/**
 * MapPage — İmmersif soruşturma haritası (tam sayfa).
 *
 * Neden ayrı sayfa?
 * → Harita tam ekranda çok daha etkili. Dar grid'de kısıtlı kalan Leaflet
 *   haritası burada tüm potansiyeline ulaşır. Google Maps/Mapbox tarzı
 *   immersive deneyim — harita tam ekran, tüm UI overlay olarak üzerinde.
 *
 * Mimari (Smart Page / Dumb Component):
 * → MapPage (smart): veri fetch + cluster hesaplama + state yönetimi + panel
 * → MapView (dumb): pure Leaflet renderer — markers + polyline + events
 *
 * Lokasyon tıklama akışı:
 *   1. Kullanıcı marker'a tıklar → MapView.onLocationSelect(cluster) ateşlenir
 *   2. MapPage selectedCluster state'ini günceller
 *   3. Detail panel framer-motion ile sağdan slide-in eder
 *   4. Panel: o lokasyondaki tüm kişiler + kronolojik aktivite log'u gösterir
 *   5. Harita boşluğuna veya ✕ butonuna tıklayınca panel kapanır
 *
 * Panel içeriği:
 *   - Lokasyon adı + koordinatlar
 *   - İstatistikler (kişi sayısı, olay sayısı)
 *   - Podo badge (Podo burada mıydı?)
 *   - Kişi chip'leri (renkli avatar + isim)
 *   - Kronolojik aktivite log'u (mini timeline)
 */
import { useState, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import { useAllData } from '../../../api/hooks';
import { MapView } from '../../organisms/MapView/MapView';
import { Spinner } from '../../atoms/Spinner/Spinner';
import {
  buildLocationClusters,
  type LocationCluster,
  type LocationEvent,
} from '../../../utils/buildLocationClusters';
import { buildPodoTimeline } from '../../../utils/buildPodoTimeline';
import { parseCoordinates } from '../../../utils/parseCoordinates';
import type { FilterableData } from '../../../utils/filterRecords';
import type { RecordType } from '../../../types';
import styles from './MapPage.module.css';

/* ─── Sabitler ─── */

/** Kaynak tipi → ikon, etiket ve CSS class eşleştirmesi */
const SOURCE_META: Record<RecordType, { icon: string; label: string; cssClass: string }> = {
  checkin:       { icon: '📍', label: 'Check-in',  cssClass: 'typeCheckin' },
  message:       { icon: '💬', label: 'Message',   cssClass: 'typeMessage' },
  sighting:      { icon: '👁',  label: 'Sighting',  cssClass: 'typeSighting' },
  personalNote:  { icon: '📝', label: 'Note',      cssClass: 'typeNote' },
  anonymousTip:  { icon: '🔍', label: 'Tip',       cssClass: 'typeTip' },
};

/**
 * Deterministik kişi renk paleti.
 * Neden hash tabanlı?
 * → Aynı kişi her zaman aynı rengi alır (tutarlılık).
 *   Random değil, hash ile hesaplanır.
 */
const PERSON_COLORS = [
  '#3b82f6', '#14b8a6', '#a78bfa', '#f59e0b',
  '#ef4444', '#10b981', '#ec4899', '#6366f1',
];

function getPersonColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PERSON_COLORS[Math.abs(hash) % PERSON_COLORS.length];
}

/* ─── Ana Sayfa Bileşeni ─── */

export function MapPage() {
  const { isLoading, ...data } = useAllData();
  const [selectedCluster, setSelectedCluster] = useState<LocationCluster | null>(null);

  /**
   * Son marker tıklama zamanı — map click race condition önlemi.
   * Neden gerekli?
   * → Leaflet'te DivIcon marker click'i bazen map click'i de tetikleyebilir.
   *   200ms içindeki map click'leri ignore ediyoruz.
   */
  const lastMarkerClickRef = useRef(0);

  /* Tüm form verilerini birleştir */
  const allData = useMemo<FilterableData>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  /* Lokasyon kümeleri — her marker bir cluster */
  const clusters = useMemo(
    () => buildLocationClusters(allData),
    [allData],
  );

  /* Podo'nun kronolojik rota noktaları — polyline için */
  const podoRoute = useMemo<L.LatLngExpression[]>(() => {
    const events = buildPodoTimeline(allData);
    const points: L.LatLngExpression[] = [];
    for (const ev of events) {
      const coord = parseCoordinates(ev.coordinates);
      if (coord) points.push([coord.lat, coord.lon]);
    }
    return points;
  }, [allData]);

  /* Genel istatistikler — header overlay için */
  const stats = useMemo(() => {
    const allPeople = new Set<string>();
    let totalEvents = 0;
    for (const c of clusters) {
      totalEvents += c.totalEvents;
      for (const p of c.uniquePeople) allPeople.add(p);
    }
    return { locations: clusters.length, people: allPeople.size, events: totalEvents };
  }, [clusters]);

  /* Marker tıklama — toggle davranışı (aynı marker'a tekrar tıklarsa kapat) */
  const handleLocationSelect = useCallback((cluster: LocationCluster) => {
    lastMarkerClickRef.current = Date.now();
    setSelectedCluster(prev =>
      prev?.locationName === cluster.locationName ? null : cluster,
    );
  }, []);

  /* Harita boşluğuna tıklama — panel kapat (race condition korumalı) */
  const handleMapClick = useCallback(() => {
    if (Date.now() - lastMarkerClickRef.current < 200) return;
    setSelectedCluster(null);
  }, []);

  /* Panel kapat butonu */
  const handleClosePanel = useCallback(() => setSelectedCluster(null), []);

  /* ─── Loading state ─── */
  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" />
        <p className={styles.stateText}>Harita verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.mapArea}>
        {/* Leaflet Harita — tam alan */}
        <MapView
          clusters={clusters}
          podoRoute={podoRoute}
          selectedLocationName={selectedCluster?.locationName ?? null}
          onLocationSelect={handleLocationSelect}
          onMapClick={handleMapClick}
        />

        {/* ─── Header Overlay — cam efektli üst bar ─── */}
        <div className={styles.headerOverlay}>
          <div className={styles.headerLeft}>
            <h1 className={styles.title}>Investigation Map</h1>
            <p className={styles.subtitle}>
              Ankara — tüm olay noktaları ve Podo'nun rotası
            </p>
          </div>
          <div className={styles.statsBar}>
            <StatBadge icon="📍" value={stats.locations} label="Locations" />
            <StatBadge icon="👥" value={stats.people} label="People" />
            <StatBadge icon="📋" value={stats.events} label="Events" />
          </div>
        </div>

        {/* ─── Legend Overlay — sol alt köşe ─── */}
        <div className={styles.legendOverlay}>
          <LegendItem color="#ef4444" label="Last Seen" pulse />
          <LegendItem color="#c8a55a" label="Podo Visited" />
          <LegendItem color="#3b82f6" label="Other Events" />
          <LegendDash color="#c8a55a" label="Podo's Route" />
        </div>

        {/* ─── Tıklama ipucu — panel kapalıyken ─── */}
        {!selectedCluster && clusters.length > 0 && (
          <div className={styles.hintOverlay}>
            <span className={styles.hintText}>
              📌 Bir lokasyona tıklayarak detayları görüntüleyin
            </span>
          </div>
        )}

        {/* ─── Detail Panel — sağdan slide-in ─── */}
        <AnimatePresence>
          {selectedCluster && (
            <motion.div
              key={selectedCluster.locationName}
              className={styles.panel}
              initial={{ x: '100%', opacity: 0.3 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            >
              <LocationPanel
                cluster={selectedCluster}
                onClose={handleClosePanel}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   Yardımcı Alt Bileşenler — MapPage'e özel, dışa aktarılmaz
   ═══════════════════════════════════════════════════════════════ */

/** Header istatistik badge'i */
function StatBadge({ icon, value, label }: {
  icon: string;
  value: number;
  label: string;
}) {
  return (
    <div className={styles.statBadge}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

/** Legend nokta öğesi */
function LegendItem({ color, label, pulse }: {
  color: string;
  label: string;
  pulse?: boolean;
}) {
  return (
    <div className={styles.legendItem}>
      <span
        className={`${styles.legendDot} ${pulse ? styles.legendDotPulse : ''}`}
        style={{ background: color, boxShadow: `0 0 6px ${color}80` }}
      />
      <span className={styles.legendLabel}>{label}</span>
    </div>
  );
}

/** Legend kesikli çizgi öğesi */
function LegendDash({ color, label }: { color: string; label: string }) {
  return (
    <div className={styles.legendItem}>
      <span className={styles.legendLine} style={{ borderColor: color }} />
      <span className={styles.legendLabel}>{label}</span>
    </div>
  );
}

/* ─── Lokasyon Detail Panel ─── */

/**
 * LocationPanel — Seçili lokasyonun detaylı görünümü.
 *
 * İçerik:
 *   1. Header: lokasyon adı + koordinatlar + kapat butonu
 *   2. İstatistikler: kişi sayısı, olay sayısı, Podo/LastSeen badge'leri
 *   3. Kişi grid'i: renkli avatar chip'leri
 *   4. Aktivite log'u: kronolojik mini-timeline
 *
 * Neden MapPage içinde tanımlı?
 * → Bu bileşen sadece MapPage'in detail panel'i olarak kullanılır.
 *   Ayrı dosyaya çıkarmak gereksiz indirection yaratır (YAGNI).
 *   MapPage ile aynı CSS module'ünü paylaşır — style erişimi doğrudan.
 */
function LocationPanel({ cluster, onClose }: {
  cluster: LocationCluster;
  onClose: () => void;
}) {
  /* Tehdit seviyesi — high urgency/confidence olay sayısına göre */
  const highAlertCount = cluster.events.filter(e => e.isHighlight).length;

  return (
    <div className={styles.panelInner}>
      {/* ─── Panel Header (sticky) ─── */}
      <div className={styles.panelHeader}>
        <div className={styles.panelHeaderLeft}>
          <h2 className={styles.panelTitle}>{cluster.locationName}</h2>
          <span className={styles.panelCoord}>
            📍 {cluster.lat.toFixed(4)}, {cluster.lon.toFixed(4)}
          </span>
        </div>
        <button
          className={styles.panelClose}
          onClick={onClose}
          aria-label="Paneli kapat"
        >
          ✕
        </button>
      </div>

      {/* ─── İstatistik Satırı ─── */}
      <div className={styles.panelStats}>
        <div className={styles.panelStatItem}>
          <span className={styles.panelStatValue}>{cluster.uniquePeople.length}</span>
          <span className={styles.panelStatLabel}>People</span>
        </div>
        <div className={styles.panelStatItem}>
          <span className={styles.panelStatValue}>{cluster.totalEvents}</span>
          <span className={styles.panelStatLabel}>Events</span>
        </div>
        {cluster.isLastSeen && (
          <div className={`${styles.panelStatItem} ${styles.lastSeenBadge}`}>
            <span className={styles.panelStatValue}>⚠</span>
            <span className={styles.panelStatLabel}>Last Seen</span>
          </div>
        )}
        {highAlertCount > 0 && (
          <div className={`${styles.panelStatItem} ${styles.alertBadge}`}>
            <span className={styles.panelStatValue}>{highAlertCount}</span>
            <span className={styles.panelStatLabel}>High Alert</span>
          </div>
        )}
      </div>

      {/* ─── Podo Varlık Badge'i ─── */}
      {cluster.hasPodo && (
        <div className={styles.podoBadge}>
          🐾 Podo was at this location
        </div>
      )}

      {/* ─── Kişiler ─── */}
      <div className={styles.panelSection}>
        <h3 className={styles.sectionTitle}>
          People ({cluster.uniquePeople.length})
        </h3>
        <div className={styles.peopleGrid}>
          {cluster.uniquePeople.map(person => {
            const color = getPersonColor(person);
            return (
              <span key={person} className={styles.personChip}>
                <span
                  className={styles.personInitial}
                  style={{ background: color }}
                >
                  {person.charAt(0).toUpperCase()}
                </span>
                {person}
              </span>
            );
          })}
        </div>
      </div>

      {/* ─── Aktivite Log'u (kronolojik mini-timeline) ─── */}
      <div className={styles.panelSection}>
        <h3 className={styles.sectionTitle}>
          Activity Log ({cluster.events.length})
        </h3>
        <div className={styles.activityList}>
          {cluster.events.map(event => (
            <ActivityEntry key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Tek bir aktivite log girişi — mini timeline öğesi */
function ActivityEntry({ event }: { event: LocationEvent }) {
  const meta = SOURCE_META[event.type];

  return (
    <div
      className={`${styles.activityEntry} ${event.isHighlight ? styles.activityHighlight : ''}`}
    >
      {/* Üst satır: zaman + tip badge + urgency/confidence */}
      <div className={styles.activityHeader}>
        <span className={styles.activityTime}>{event.time || '??:??'}</span>
        <span className={`${styles.activityBadge} ${styles[meta.cssClass]}`}>
          {meta.icon} {meta.label}
        </span>
        {event.urgency === 'high' && (
          <span className={styles.urgencyBadge}>⚠ HIGH</span>
        )}
        {event.confidence === 'high' && (
          <span className={styles.confidenceBadge}>⚠ HIGH CONF.</span>
        )}
      </div>

      {/* Açıklama */}
      <p className={styles.activityDesc}>{event.description}</p>

      {/* İlgili kişiler */}
      {event.people.length > 0 && (
        <div className={styles.activityPeople}>
          {event.people.map(p => (
            <span key={p} className={styles.activityPersonTag}>
              👤 {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
