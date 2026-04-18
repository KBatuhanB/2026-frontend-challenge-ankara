/**
 * InvestigationBoard — Dedektif Ağı / Knowledge Graph arayüzü.
 *
 * Tasarım konsepti:
 * → Karanlık soruşturma panosu. Ortada "Missing Podo" root node'u,
 *   etrafında 5 kategori node'u. Kategoriye tıklayınca kanıt kartları
 *   animasyonlu bir şekilde ağaçtan filizlenir. Yaprak node'a (kayıt)
 *   tıklayınca detay pop-up'ı açılır.
 *
 * Layout: Dikey ağaç — Root (üst), Kategoriler (orta), Kayıtlar (alt).
 * Edges: SVG quadratic bezier eğrileri, altın kesikli çizgiler.
 * Kartlar: Aceternity 3D Card efekti — hover'da perspektif dönüşü.
 *
 * Neden radyal değil dikey?
 * → Radyal layout'ta kayıt kartları birbirine çakışıyordu (chord distance
 *   hesabı kart genişliğinin altında kalıyordu). Dikey ağaç doğal
 *   akış sağlıyor ve overlap imkansız.
 */
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconMapPin,
  IconMail,
  IconEye,
  IconNotes,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { CardContainer, CardBody, CardItem } from '../../ui/ThreeDCard/ThreeDCard';
import { SearchBar } from '../SearchBar/SearchBar';
import { RecordDetailModal } from '../RecordDetailModal/RecordDetailModal';
import { PersonDetailModal } from '../PersonDetailModal/PersonDetailModal';
import { useFilter } from '../../../context/FilterContext';
import { applyFilters, extractUniqueLocations } from '../../../utils/filterRecords';
import { buildPersonProfiles } from '../../../utils/buildPersonProfiles';
import { normalizeName } from '../../../utils/normalizeName';
import type { FilterableData } from '../../../utils/filterRecords';
import type { FilterOption } from '../../molecules/FilterBar/FilterBar';
import type {
  BaseRecord,
  RecordType,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../../../types';
import type { Person } from '../../../types/person';
import type { ReactNode } from 'react';
import styles from './InvestigationBoard.module.css';

/* ═══════════════════════════════════════════
   Types
   ═══════════════════════════════════════════ */

interface CategoryConfig {
  readonly key: string;
  readonly title: string;
  readonly recordType: RecordType;
  readonly color: string;
  readonly icon: ReactNode;
  readonly records: readonly BaseRecord[];
}

interface LayoutNode {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly type: 'root' | 'category' | 'record';
  readonly categoryKey?: string;
  readonly record?: BaseRecord;
  readonly recordType?: RecordType;
  readonly config?: CategoryConfig;
  readonly label?: { title: string; sub: string };
}

interface LayoutEdge {
  readonly id: string;
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
  readonly color: string;
  readonly type: 'root-cat' | 'cat-rec';
  readonly delay: number;
}

interface SelectedRecord {
  readonly record: BaseRecord;
  readonly type: RecordType;
}

/* ═══════════════════════════════════════════
   Constants
   ═══════════════════════════════════════════ */

const ROOT_H = 110;
const CAT_W = 170;
const CAT_H = 100;
const REC_W = 150;
const REC_H = 58;
const REC_GAP = 10;
const REC_COLS = 2;
const MAX_RECORDS = 12;

/* ═══════════════════════════════════════════
   Helpers
   ═══════════════════════════════════════════ */

function getRecordLabel(
  record: BaseRecord,
  type: RecordType,
): { title: string; sub: string } {
  switch (type) {
    case 'checkin':
      return {
        title: (record as Checkin).personName,
        sub: record.location,
      };
    case 'message':
      return {
        title: (record as Message).senderName,
        sub: `→ ${(record as Message).recipientName}`,
      };
    case 'sighting':
      return {
        title: (record as Sighting).personName,
        sub: (record as Sighting).seenWith,
      };
    case 'personalNote':
      return {
        title: (record as PersonalNote).authorName,
        sub: record.location,
      };
    case 'anonymousTip':
      return {
        title: (record as AnonymousTip).suspectName,
        sub: (record as AnonymousTip).confidence,
      };
  }
}

/** Quadratic bezier yolu — root→category arasında organik eğri */
function getQuadPath(
  x1: number, y1: number,
  x2: number, y2: number,
): string {
  // Kontrol noktası: dikey ortada, yatay olarak hedefe %40 yakın
  const cy = y1 + (y2 - y1) * 0.6;
  return `M ${x1} ${y1} Q ${x1} ${cy} ${x2} ${y2}`;
}

/** Layout hesaplama — genişliğe göre pozisyonlar */
function calculateLayout(
  width: number,
  categories: readonly CategoryConfig[],
  expandedKey: string | null,
): { nodes: LayoutNode[]; edges: LayoutEdge[]; totalHeight: number } {
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];

  const cx = width / 2;
  const rootY = 80;
  const catY = rootY + ROOT_H + 90;

  // Root node
  nodes.push({ id: 'root', x: cx, y: rootY, type: 'root' });

  // Category spacing
  const catSpacing = Math.min(width / (categories.length + 1), 240);
  const catStartX = cx - ((categories.length - 1) * catSpacing) / 2;

  let maxY = catY + CAT_H;

  categories.forEach((cat, i) => {
    const catX = catStartX + i * catSpacing;

    nodes.push({
      id: cat.key,
      x: catX,
      y: catY,
      type: 'category',
      categoryKey: cat.key,
      config: cat,
    });

    edges.push({
      id: `root-${cat.key}`,
      x1: cx,
      y1: rootY + ROOT_H / 2,
      x2: catX,
      y2: catY - CAT_H / 2,
      color: cat.color,
      type: 'root-cat',
      delay: 0.15 + i * 0.08,
    });

    // Expanded category — record grid below
    if (expandedKey === cat.key) {
      const records = cat.records.slice(0, MAX_RECORDS);
      const gridW = REC_COLS * REC_W + (REC_COLS - 1) * REC_GAP;
      const gridX = catX - gridW / 2;
      const recordStartY = catY + CAT_H / 2 + 50;

      records.forEach((record, j) => {
        const col = j % REC_COLS;
        const row = Math.floor(j / REC_COLS);
        const rx = gridX + col * (REC_W + REC_GAP) + REC_W / 2;
        const ry = recordStartY + row * (REC_H + REC_GAP) + REC_H / 2;

        const label = getRecordLabel(record, cat.recordType);
        nodes.push({
          id: record.id,
          x: rx,
          y: ry,
          type: 'record',
          categoryKey: cat.key,
          record,
          recordType: cat.recordType,
          label,
        });

        edges.push({
          id: `${cat.key}-${record.id}`,
          x1: catX,
          y1: catY + CAT_H / 2,
          x2: rx,
          y2: ry - REC_H / 2,
          color: cat.color,
          type: 'cat-rec',
          delay: 0.05 + j * 0.03,
        });

        maxY = Math.max(maxY, ry + REC_H / 2 + 40);
      });

      // "+N more" indicator
      if (cat.records.length > MAX_RECORDS) {
        const moreRow = Math.floor(records.length / REC_COLS);
        const moreCol = records.length % REC_COLS;
        const mx =
          moreCol === 0
            ? catX
            : gridX + moreCol * (REC_W + REC_GAP) + REC_W / 2;
        const my =
          recordStartY + moreRow * (REC_H + REC_GAP) + REC_H / 2;
        nodes.push({
          id: `${cat.key}-more`,
          x: mx,
          y: my,
          type: 'record',
          categoryKey: cat.key,
          label: {
            title: `+${cat.records.length - MAX_RECORDS} more`,
            sub: 'records',
          },
        });
        maxY = Math.max(maxY, my + REC_H / 2 + 40);
      }
    }
  });

  return { nodes, edges, totalHeight: Math.max(maxY, 500) };
}

/* ═══════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════ */

/** SVG Edge — quadratic bezier veya düz çizgi */
function BoardEdge({ edge }: { edge: LayoutEdge }) {
  const isRootEdge = edge.type === 'root-cat';
  const pathD = isRootEdge
    ? getQuadPath(edge.x1, edge.y1, edge.x2, edge.y2)
    : `M ${edge.x1} ${edge.y1} L ${edge.x2} ${edge.y2}`;

  return (
    <g>
      <motion.path
        d={pathD}
        stroke={edge.color}
        strokeWidth={isRootEdge ? 1.5 : 1}
        strokeDasharray={isRootEdge ? '6 4' : '4 3'}
        strokeLinecap="round"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: isRootEdge ? 0.5 : 0.35 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.5, delay: edge.delay, ease: 'easeOut' }}
      />
      {/* Pin noktası — bağlantı ucu */}
      <motion.circle
        cx={edge.x2}
        cy={edge.y2}
        r={isRootEdge ? 3 : 2}
        fill={edge.color}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.7 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ delay: edge.delay + 0.3 }}
      />
    </g>
  );
}

/** Root Node — merkez soruşturma kartı */
function RootNode({ x, y }: { x: number; y: number }) {
  return (
    <div className={styles.nodeWrapper} style={{ left: x, top: y, width: 220 }}>
    <motion.div
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
    >
      <CardContainer sensitivity={25}>
        <CardBody className={styles.rootCard}>
          <CardItem translateZ={30} className={styles.rootLabel}>
            CASE FILE #2026-ANK
          </CardItem>
          <CardItem translateZ={55} className={styles.rootTitle}>
            Missing Podo
          </CardItem>
          <CardItem translateZ={35} className={styles.rootSub}>
            The Ankara Case
          </CardItem>
          <CardItem translateZ={15} className={styles.rootMeta}>
            5 Evidence Sources
          </CardItem>
        </CardBody>
      </CardContainer>
    </motion.div>
    </div>
  );
}

/** Category Node — veri kaynağı kartı */
function CategoryNode({
  node,
  isExpanded,
  onClick,
}: {
  node: LayoutNode;
  isExpanded: boolean;
  onClick: () => void;
}) {
  const config = node.config!;
  const count = config.records.length;

  return (
    <div className={styles.nodeWrapper} style={{ left: node.x, top: node.y, width: CAT_W }}>
    <motion.div
      initial={{ scale: 0.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 180,
        damping: 16,
        delay: 0.3 + (parseInt(node.id, 36) % 5) * 0.08,
      }}
    >
      <CardContainer sensitivity={30}>
        <CardBody
          className={`${styles.catCard} ${isExpanded ? styles.catCardExpanded : ''}`}
          onClick={onClick}
        >
          <div className={styles.catAccent} style={{ background: config.color }} />
          <CardItem translateZ={35} className={styles.catIcon}>
            <span style={{ color: config.color }}>{config.icon}</span>
          </CardItem>
          <CardItem translateZ={45} className={styles.catTitle}>
            {config.title}
          </CardItem>
          <CardItem translateZ={20} className={styles.catCount}>
            {count} kayıt
          </CardItem>
          <CardItem translateZ={10} className={styles.catHint}>
            {isExpanded ? '▾ Kapat' : '▸ İncele'}
          </CardItem>
        </CardBody>
      </CardContainer>
    </motion.div>
    </div>
  );
}

/** Record Node — yaprak kanıt kartı */
function RecordNode({
  node,
  index,
  color,
  onClick,
}: {
  node: LayoutNode;
  index: number;
  color: string;
  onClick: () => void;
}) {
  const label = node.label ?? { title: '—', sub: '' };
  const isMoreIndicator = node.id.endsWith('-more');

  return (
    <div className={styles.nodeWrapper} style={{ left: node.x, top: node.y, width: REC_W }}>
    <motion.div
      initial={{ scale: 0, opacity: 0, y: -30 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: -20 }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 18,
        delay: 0.05 + index * 0.04,
      }}
    >
      <CardContainer sensitivity={40}>
        <CardBody
          className={`${styles.recCard} ${isMoreIndicator ? styles.recCardMore : ''}`}
          onClick={isMoreIndicator ? undefined : onClick}
        >
          <div className={styles.recDot} style={{ background: color }} />
          <CardItem translateZ={25} className={styles.recTitle}>
            {label.title}
          </CardItem>
          <CardItem translateZ={12} className={styles.recSub}>
            {label.sub}
          </CardItem>
        </CardBody>
      </CardContainer>
    </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   Main Component
   ═══════════════════════════════════════════ */

interface InvestigationBoardProps {
  readonly data: FilterableData;
}

export function InvestigationBoard({ data }: InvestigationBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // ─── Filter Context ───
  const { state: filterState, setSearch, toggleSource } = useFilter();

  // ─── Filtered data ───
  const filteredData = useMemo(() => applyFilters(data, filterState), [data, filterState]);
  const uniqueLocations = useMemo(() => extractUniqueLocations(data), [data]);

  const CATEGORY_META = useMemo(() => [
    { key: 'checkins', title: 'Checkins', recordType: 'checkin' as const, color: 'var(--category-checkins)', icon: <IconMapPin size={22} stroke={1.5} /> },
    { key: 'messages', title: 'Messages', recordType: 'message' as const, color: 'var(--category-messages)', icon: <IconMail size={22} stroke={1.5} /> },
    { key: 'sightings', title: 'Sightings', recordType: 'sighting' as const, color: 'var(--category-sightings)', icon: <IconEye size={22} stroke={1.5} /> },
    { key: 'personalNotes', title: 'Notes', recordType: 'personalNote' as const, color: 'var(--category-notes)', icon: <IconNotes size={22} stroke={1.5} /> },
    { key: 'anonymousTips', title: 'Tips', recordType: 'anonymousTip' as const, color: 'var(--category-tips)', icon: <IconAlertTriangle size={22} stroke={1.5} /> },
  ], []);

  // ─── Filter options for SearchBar ───
  const filterOptions = useMemo<FilterOption[]>(() => {
    const sources: FilterOption[] = CATEGORY_META.map((c) => ({
      key: `source:${c.key}`,
      label: c.title,
      active: filterState.selectedSources.includes(c.key),
    }));
    return sources;
  }, [CATEGORY_META, filterState.selectedSources]);

  const handleFilterToggle = useCallback((key: string) => {
    if (key.startsWith('source:')) {
      toggleSource(key.replace('source:', ''));
    }
  }, [toggleSource]);

  // ─── ResizeObserver — genişlik takibi ───
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─── Categories — filtered records ile ───
  const categories = useMemo<CategoryConfig[]>(
    () => {
      const dataMap: Record<string, readonly BaseRecord[]> = {
        checkins: filteredData.checkins,
        messages: filteredData.messages,
        sightings: filteredData.sightings,
        personalNotes: filteredData.personalNotes,
        anonymousTips: filteredData.anonymousTips,
      };
      return CATEGORY_META.map((m) => ({
        ...m,
        records: dataMap[m.key] ?? [],
      }));
    },
    [CATEGORY_META, filteredData],
  );

  // ─── Person profiles — modal için ───
  const personProfiles = useMemo(() => buildPersonProfiles(data), [data]);

  // ─── Layout hesaplama ───
  const layout = useMemo(() => {
    if (containerWidth === 0) return { nodes: [], edges: [], totalHeight: 500 };
    return calculateLayout(containerWidth, categories, expandedCategory);
  }, [containerWidth, categories, expandedCategory]);

  // ─── Handlers ───
  const handleCategoryClick = useCallback(
    (key: string) => {
      setExpandedCategory((prev) => (prev === key ? null : key));
    },
    [],
  );

  const handleRecordClick = useCallback(
    (record: BaseRecord, type: RecordType) => {
      setSelectedRecord({ record, type });
    },
    [],
  );

  const handlePersonClick = useCallback(
    (personName: string) => {
      const normalized = normalizeName(personName);
      const person = personProfiles.find((p) => p.normalizedName === normalized);
      if (person) setSelectedPerson(person);
    },
    [personProfiles],
  );

  const handleCloseRecord = useCallback(() => setSelectedRecord(null), []);
  const handleClosePerson = useCallback(() => setSelectedPerson(null), []);

  const handlePersonRecordClick = useCallback(
    (record: BaseRecord, type: RecordType) => {
      setSelectedPerson(null);
      setSelectedRecord({ record, type });
    },
    [],
  );

  // ─── Render helpers ───
  const rootNodes = layout.nodes.filter((n) => n.type === 'root');
  const catNodes = layout.nodes.filter((n) => n.type === 'category');
  const recNodes = layout.nodes.filter((n) => n.type === 'record');

  const rootEdges = layout.edges.filter((e) => e.type === 'root-cat');
  const recEdges = layout.edges.filter((e) => e.type === 'cat-rec');

  return (
    <>
      {/* ─── Filter Bar ─── */}
      <div className={styles.filterBar}>
        <SearchBar
          searchValue={filterState.searchQuery}
          onSearchChange={setSearch}
          filters={filterOptions}
          onFilterToggle={handleFilterToggle}
        />
      </div>

      <div
        ref={containerRef}
        className={styles.board}
        style={{ minHeight: layout.totalHeight }}
      >
      {/* ─── SVG Edge Layer ─── */}
      <svg
        className={styles.edgeLayer}
        width="100%"
        height={layout.totalHeight}
        viewBox={`0 0 ${containerWidth} ${layout.totalHeight}`}
      >
        {/* Root → Category edges (always visible) */}
        {rootEdges.map((edge) => (
          <BoardEdge key={edge.id} edge={edge} />
        ))}

        {/* Category → Record edges (only when expanded) */}
        <AnimatePresence>
          {recEdges.map((edge) => (
            <BoardEdge key={edge.id} edge={edge} />
          ))}
        </AnimatePresence>
      </svg>

      {/* ─── Node Layer ─── */}

      {/* Root */}
      {rootNodes.map((node) => (
        <RootNode key={node.id} x={node.x} y={node.y} />
      ))}

      {/* Categories */}
      {catNodes.map((node) => (
        <CategoryNode
          key={node.id}
          node={node}
          isExpanded={expandedCategory === node.categoryKey}
          onClick={() => handleCategoryClick(node.categoryKey!)}
        />
      ))}

      {/* Records — AnimatePresence for enter/exit */}
      <AnimatePresence>
        {recNodes.map((node, i) => {
          const catConfig = categories.find(
            (c) => c.key === node.categoryKey,
          );
          return (
            <RecordNode
              key={node.id}
              node={node}
              index={i}
              color={catConfig?.color ?? 'var(--color-accent-gold)'}
              onClick={() => {
                if (node.record && node.recordType) {
                  handleRecordClick(node.record, node.recordType);
                }
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* ─── Modals ─── */}
      <RecordDetailModal
        record={selectedRecord?.record ?? null}
        recordType={selectedRecord?.type ?? null}
        onClose={handleCloseRecord}
        onPersonClick={handlePersonClick}
        allData={data}
      />

      <PersonDetailModal
        person={selectedPerson}
        onClose={handleClosePerson}
        onRecordClick={handlePersonRecordClick}
      />
    </div>
    </>
  );
}
