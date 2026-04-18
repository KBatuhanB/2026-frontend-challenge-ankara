/**
 * SearchResults — Google tarzı arama sonuçları organizma bileşeni.
 *
 * Neden organism?
 * → Birden fazla veri kaynağından gelen kayıtları tek bir düz listede
 *   gösterir. Domain verisi (FilterableData) → sunum (RecordCard listesi)
 *   dönüşümü yapar. Modal yönetimini içerir.
 *
 * Kullanım akışı:
 * → Kullanıcı HomePage'deki SearchBar'a yazar
 *   → query prop olarak gelir
 *   → tüm kayıtlar text match'e göre filtrelenir
 *   → eşleşen kayıtlar score'a göre sıralanır
 *   → RecordCard olarak listelenir
 *   → Tıklama → RecordDetailModal açılır
 *
 * Performans: O(n) filtreleme + O(n log n) sıralama — ~45 kayıt, ihmal edilebilir.
 */
import { useMemo, useState, useCallback } from 'react';
import { RecordCard } from '../../molecules/RecordCard/RecordCard';
import { RecordDetailModal } from '../../organisms/RecordDetailModal/RecordDetailModal';
import { PersonDetailModal } from '../../organisms/PersonDetailModal/PersonDetailModal';
import { buildPersonProfiles } from '../../../utils/buildPersonProfiles';
import { normalizeName } from '../../../utils/normalizeName';
import type { FilterableData } from '../../../utils/filterRecords';
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
import styles from './SearchResults.module.css';

export interface SearchResultsProps {
  /** Arama sorgusu — boşsa hiçbir sonuç gösterilmez */
  readonly query: string;
  /** Tüm veri (filtrelenmemiş) */
  readonly data: FilterableData;
}

/** Düzleştirilmiş kayıt — tip etiketi ile birlikte */
interface FlatRecord {
  readonly record: BaseRecord;
  readonly type: RecordType;
  readonly title: string;
  readonly subtitle: string;
  readonly badgeLevel?: 'low' | 'medium' | 'high';
  readonly badgeLabel?: string;
}

/** Minimum arama karakter sayısı — çok kısa sorgularda sonuç gösterme */
const MIN_QUERY_LENGTH = 2;

export function SearchResults({ query, data }: SearchResultsProps) {
  const [selectedRecord, setSelectedRecord] = useState<{ record: BaseRecord; type: RecordType } | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  /** Kişi profilleri — PersonDetailModal için */
  const personProfiles = useMemo(() => buildPersonProfiles(data), [data]);

  /**
   * Tüm kayıtları düzleştir — her kayda tip etiketi ekle.
   * Neden useMemo?
   * → data değişmedikçe aynı referans. 45 kayıt × 5 kategori = max 225 obje.
   */
  const flatRecords = useMemo<FlatRecord[]>(() => {
    const results: FlatRecord[] = [];

    for (const r of data.checkins) {
      results.push({
        record: r,
        type: 'checkin',
        title: (r as Checkin).personName,
        subtitle: (r as Checkin).note || '',
      });
    }

    for (const r of data.messages) {
      const m = r as Message;
      results.push({
        record: r,
        type: 'message',
        title: `${m.senderName} → ${m.recipientName}`,
        subtitle: m.text || '',
        badgeLevel: m.urgency,
        badgeLabel: m.urgency,
      });
    }

    for (const r of data.sightings) {
      const s = r as Sighting;
      const title = s.seenWith && s.seenWith !== 'Unknown'
        ? `${s.personName} + ${s.seenWith}`
        : s.personName;
      results.push({
        record: r,
        type: 'sighting',
        title,
        subtitle: s.note || '',
      });
    }

    for (const r of data.personalNotes) {
      const n = r as PersonalNote;
      results.push({
        record: r,
        type: 'personalNote',
        title: n.authorName,
        subtitle: n.note || '',
      });
    }

    for (const r of data.anonymousTips) {
      const t = r as AnonymousTip;
      results.push({
        record: r,
        type: 'anonymousTip',
        title: t.suspectName ? `Suspect: ${t.suspectName}` : 'Anonymous Tip',
        subtitle: t.tip || '',
        badgeLevel: t.confidence,
        badgeLabel: t.confidence,
      });
    }

    return results;
  }, [data]);

  /**
   * Arama sonuçları — query'ye göre filtrelenmiş ve sıralanmış.
   * Strateji: case-insensitive + normalizeName fuzzy match.
   */
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < MIN_QUERY_LENGTH) return [];

    const normalizedQ = normalizeName(query);

    return flatRecords
      .filter((item) => {
        const { record, type } = item;
        /* Başlık ve alt metin kontrolü */
        if (item.title.toLowerCase().includes(q)) return true;
        if (item.subtitle.toLowerCase().includes(q)) return true;
        /* Lokasyon kontrolü */
        if (record.location.toLowerCase().includes(q)) return true;
        /* Normalize isim kontrolü */
        if (normalizedQ && matchesNormalizedName(record, type, normalizedQ)) return true;
        return false;
      })
      .slice(0, 20); /* Maksimum 20 sonuç — performans + UX */
  }, [query, flatRecords]);

  const handleRecordClick = useCallback((record: BaseRecord, type: RecordType) => {
    setSelectedRecord({ record, type });
  }, []);

  const handleCloseRecord = useCallback(() => setSelectedRecord(null), []);
  const handleClosePerson = useCallback(() => setSelectedPerson(null), []);

  const handlePersonClick = useCallback((personName: string) => {
    const normalized = normalizeName(personName);
    const person = personProfiles.find((p) => p.normalizedName === normalized);
    if (person) {
      setSelectedPerson(person);
    }
  }, [personProfiles]);

  const handlePersonRecordClick = useCallback((record: BaseRecord, type: RecordType) => {
    setSelectedPerson(null);
    setSelectedRecord({ record, type });
  }, []);

  /* Sorgu çok kısaysa veya sonuç yoksa hiçbir şey gösterme */
  if (query.trim().length < MIN_QUERY_LENGTH) return null;

  return (
    <>
      <div className={styles.container}>
        {results.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <p className={styles.emptyText}>
              "<strong>{query}</strong>" için sonuç bulunamadı.
            </p>
          </div>
        ) : (
          <>
            <p className={styles.count}>
              {results.length} result{results.length !== 1 ? 's' : ''} found
            </p>
            <ul className={styles.list} role="list">
              {results.map((item) => (
                <li key={`${item.type}-${item.record.id}`} className={styles.item}>
                  <div className={styles.typeTag} data-type={item.type}>
                    {TYPE_LABELS[item.type]}
                  </div>
                  <RecordCard
                    title={item.title}
                    subtitle={item.subtitle}
                    timestamp={item.record.timestamp}
                    location={item.record.location}
                    badgeLevel={item.badgeLevel}
                    badgeLabel={item.badgeLabel}
                    onClick={() => handleRecordClick(item.record, item.type)}
                  />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {/* Kayıt Detay Modal */}
      <RecordDetailModal
        record={selectedRecord?.record ?? null}
        recordType={selectedRecord?.type ?? null}
        onClose={handleCloseRecord}
        onPersonClick={handlePersonClick}
        allData={data}
      />

      {/* Kişi Profil Modal */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={handleClosePerson}
        onRecordClick={handlePersonRecordClick}
      />
    </>
  );
}

/* ─── Yardımcı Sabitler ─── */

const TYPE_LABELS: Record<RecordType, string> = {
  checkin: 'Checkin',
  message: 'Message',
  sighting: 'Sighting',
  personalNote: 'Note',
  anonymousTip: 'Tip',
};

/**
 * Normalize isim eşleştirmesi.
 * → Kağan/Kagan/Kağan A. gibi varyasyonları yakalar.
 */
function matchesNormalizedName(
  record: BaseRecord,
  type: RecordType,
  normalizedQ: string,
): boolean {
  switch (type) {
    case 'checkin':
      return normalizeName((record as Checkin).personName).includes(normalizedQ);
    case 'message': {
      const m = record as Message;
      return (
        normalizeName(m.senderName).includes(normalizedQ) ||
        normalizeName(m.recipientName).includes(normalizedQ)
      );
    }
    case 'sighting': {
      const s = record as Sighting;
      return (
        normalizeName(s.personName).includes(normalizedQ) ||
        normalizeName(s.seenWith).includes(normalizedQ)
      );
    }
    case 'personalNote':
      return normalizeName((record as PersonalNote).authorName).includes(normalizedQ);
    case 'anonymousTip':
      return normalizeName((record as AnonymousTip).suspectName).includes(normalizedQ);
    default:
      return false;
  }
}
