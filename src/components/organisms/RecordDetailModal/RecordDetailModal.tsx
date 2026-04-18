/**
 * RecordDetailModal — Kayıt detay modal'ı.
 *
 * Neden organism?
 * → Domain verisini (Checkin, Message vb.) presentation'a çevirir.
 *   İlişkili kayıtları hesaplar ve gösterir.
 *   Modal atom'unu wrapper olarak kullanır.
 *
 * İlişkili kayıt bulma:
 * → findRelatedRecords utility'si üç boyutlu ilişki (kişi, lokasyon, zaman)
 *   ile bağlantılı kayıtları bulur. Sonuçlar useMemo ile memoize edilir.
 *
 * PersonChip tıklama:
 * → Kişi adına tıklandığında onPersonClick callback tetiklenir.
 *   Parent (InvestigationPage) PersonDetailModal'a geçişi yönetir.
 */
import { useMemo } from 'react';
import { Modal } from '../../atoms/Modal/Modal';
import { Badge } from '../../atoms/Badge/Badge';
import { Tag } from '../../atoms/Tag/Tag';
import { PersonChip } from '../../molecules/PersonChip/PersonChip';
import { RecordCard } from '../../molecules/RecordCard/RecordCard';
import { findRelatedRecords } from '../../../utils/findRelatedRecords';
import type {
  BaseRecord,
  RecordType,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../../../types';
import type { FilterableData } from '../../../utils/filterRecords';
import styles from './RecordDetailModal.module.css';

export interface RecordDetailModalProps {
  /** Gösterilecek kayıt — null ise modal kapalı */
  readonly record: BaseRecord | null;
  /** Kaydın tipi */
  readonly recordType: RecordType | null;
  /** Kapatma callback'i */
  readonly onClose: () => void;
  /** Kişi adına tıklanınca — PersonDetailModal açmak için */
  readonly onPersonClick?: (personName: string) => void;
  /** İlişkili kayıt aramak için tüm veri seti */
  readonly allData: FilterableData;
}

/** RecordType → okunabilir başlık eşleştirmesi */
const TYPE_LABELS: Record<RecordType, string> = {
  checkin: 'Checkin Record',
  message: 'Message Record',
  sighting: 'Sighting Record',
  personalNote: 'Personal Note',
  anonymousTip: 'Anonymous Tip',
};

export function RecordDetailModal({
  record,
  recordType,
  onClose,
  onPersonClick,
  allData,
}: RecordDetailModalProps) {
  /* İlişkili kayıtları hesapla — sadece modal açıkken */
  const relatedRecords = useMemo(() => {
    if (!record || !recordType) return [];
    return findRelatedRecords(record, recordType, allData);
  }, [record, recordType, allData]);

  if (!record || !recordType) return null;

  return (
    <Modal
      isOpen={!!record}
      onClose={onClose}
      title={TYPE_LABELS[recordType]}
      subtitle={`ID: ${record.id}`}
    >
      {/* Kayıt detayları — tip bazlı render */}
      <div className={styles.fields}>
        {renderRecordFields(record, recordType, onPersonClick)}
      </div>

      {/* Ortak alanlar: zaman, lokasyon, koordinat */}
      <div className={styles.metaSection}>
        <MetaRow label="Time" value={record.timestamp} mono />
        <MetaRow label="Location">
          <Tag text={record.location} variant="location" />
        </MetaRow>
        {record.coordinates && (
          <MetaRow label="Coordinates" value={record.coordinates} mono />
        )}
      </div>

      {/* İlişkili kayıtlar bölümü */}
      {relatedRecords.length > 0 && (
        <div className={styles.relatedSection}>
          <h3 className={styles.sectionTitle}>Related Records</h3>
          <div className={styles.relatedList}>
            {relatedRecords.map(({ record: rel, recordType: relType, reason }) => (
              <div key={rel.id} className={styles.relatedItem}>
                <span className={styles.reasonTag}>{reasonLabel(reason)}</span>
                <RecordCard
                  title={extractTitle(rel, relType)}
                  subtitle={extractSubtitle(rel, relType)}
                  timestamp={rel.timestamp}
                  location={rel.location}
                  badgeLevel={extractBadgeLevel(rel, relType)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

/* ─── Helper Bileşenler ─── */

/** Tek satırlık meta bilgi — label: value formatı */
function MetaRow({
  label,
  value,
  mono,
  children,
}: {
  label: string;
  value?: string;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.metaRow}>
      <span className={styles.metaLabel}>{label}</span>
      {children ?? (
        <span className={mono ? styles.metaValueMono : styles.metaValue}>
          {value}
        </span>
      )}
    </div>
  );
}

/* ─── Tip-spesifik render fonksiyonları ─── */

/**
 * Kayıt tipine göre detay alanlarını render eder.
 * Neden switch + JSX döndüren fonksiyon?
 * → Her tip farklı alanlar gösterir. Polimorfik render
 *   component yerine helper function ile yapılır (basitlik).
 */
function renderRecordFields(
  record: BaseRecord,
  type: RecordType,
  onPersonClick?: (name: string) => void,
): React.ReactNode {
  switch (type) {
    case 'checkin': {
      const r = record as Checkin;
      return (
        <>
          <FieldRow label="Person">
            <PersonChip
              name={r.personName}
              onClick={onPersonClick ? () => onPersonClick(r.personName) : undefined}
            />
          </FieldRow>
          {r.note && <FieldRow label="Note" value={r.note} />}
        </>
      );
    }
    case 'message': {
      const r = record as Message;
      return (
        <>
          <FieldRow label="From">
            <PersonChip
              name={r.senderName}
              onClick={onPersonClick ? () => onPersonClick(r.senderName) : undefined}
            />
          </FieldRow>
          <FieldRow label="To">
            <PersonChip
              name={r.recipientName}
              onClick={onPersonClick ? () => onPersonClick(r.recipientName) : undefined}
            />
          </FieldRow>
          <FieldRow label="Urgency">
            <Badge level={r.urgency} />
          </FieldRow>
          <FieldRow label="Message" value={r.text} />
        </>
      );
    }
    case 'sighting': {
      const r = record as Sighting;
      return (
        <>
          <FieldRow label="Person">
            <PersonChip
              name={r.personName}
              onClick={onPersonClick ? () => onPersonClick(r.personName) : undefined}
            />
          </FieldRow>
          {r.seenWith && r.seenWith !== 'Unknown' && (
            <FieldRow label="Seen With">
              <PersonChip
                name={r.seenWith}
                onClick={onPersonClick ? () => onPersonClick(r.seenWith) : undefined}
              />
            </FieldRow>
          )}
          {r.note && <FieldRow label="Note" value={r.note} />}
        </>
      );
    }
    case 'personalNote': {
      const r = record as PersonalNote;
      return (
        <>
          <FieldRow label="Author">
            <PersonChip
              name={r.authorName}
              onClick={onPersonClick ? () => onPersonClick(r.authorName) : undefined}
            />
          </FieldRow>
          <FieldRow label="Note" value={r.note} />
          {r.mentionedPeople && (
            <FieldRow label="Mentioned">
              <div className={styles.chipList}>
                {r.mentionedPeople.split(',').map((name) => {
                  const trimmed = name.trim();
                  return trimmed ? (
                    <PersonChip
                      key={trimmed}
                      name={trimmed}
                      onClick={onPersonClick ? () => onPersonClick(trimmed) : undefined}
                    />
                  ) : null;
                })}
              </div>
            </FieldRow>
          )}
        </>
      );
    }
    case 'anonymousTip': {
      const r = record as AnonymousTip;
      return (
        <>
          <FieldRow label="Suspect">
            <PersonChip
              name={r.suspectName}
              onClick={onPersonClick ? () => onPersonClick(r.suspectName) : undefined}
            />
          </FieldRow>
          <FieldRow label="Confidence">
            <Badge level={r.confidence} />
          </FieldRow>
          <FieldRow label="Tip" value={r.tip} />
          {r.submissionDate && <FieldRow label="Submitted" value={r.submissionDate} />}
        </>
      );
    }
  }
}

/** Alan satırı — label: value/children */
function FieldRow({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={styles.fieldRow}>
      <span className={styles.fieldLabel}>{label}</span>
      {children ?? <span className={styles.fieldValue}>{value}</span>}
    </div>
  );
}

/* ─── Yardımcı fonksiyonlar ─── */

function reasonLabel(reason: 'person' | 'location' | 'time'): string {
  switch (reason) {
    case 'person': return 'Same Person';
    case 'location': return 'Same Location';
    case 'time': return 'Near Time';
  }
}

function extractTitle(record: BaseRecord, type: RecordType): string {
  switch (type) {
    case 'checkin': return (record as Checkin).personName;
    case 'message': return `${(record as Message).senderName} → ${(record as Message).recipientName}`;
    case 'sighting': {
      const s = record as Sighting;
      return s.seenWith && s.seenWith !== 'Unknown'
        ? `${s.personName} + ${s.seenWith}` : s.personName;
    }
    case 'personalNote': return (record as PersonalNote).authorName;
    case 'anonymousTip': return (record as AnonymousTip).suspectName;
  }
}

function extractSubtitle(record: BaseRecord, type: RecordType): string {
  switch (type) {
    case 'checkin': return (record as Checkin).note ?? '';
    case 'message': return (record as Message).text ?? '';
    case 'sighting': return (record as Sighting).note ?? '';
    case 'personalNote': return (record as PersonalNote).note ?? '';
    case 'anonymousTip': return (record as AnonymousTip).tip ?? '';
  }
}

function extractBadgeLevel(record: BaseRecord, type: RecordType): 'low' | 'medium' | 'high' | undefined {
  switch (type) {
    case 'message': return (record as Message).urgency;
    case 'anonymousTip': return (record as AnonymousTip).confidence;
    default: return undefined;
  }
}
