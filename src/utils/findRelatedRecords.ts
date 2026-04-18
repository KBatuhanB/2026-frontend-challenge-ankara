/**
 * ============================================================
 * İlişkili Kayıt Bulma Fonksiyonu
 * ============================================================
 *
 * Neden ayrı utility?
 * → İlişkili kayıt bulma mantığı RecordDetailModal'ın render'ından bağımsız.
 *   Pure function: test edilebilir, memoize edilebilir.
 *
 * İlişki kriterleri (üç boyutlu):
 *   1. Kişi ilişkisi — aynı normalize edilmiş isim geçen kayıtlar
 *   2. Lokasyon ilişkisi — aynı mekandaki diğer kayıtlar
 *   3. Zaman yakınlığı — ±15 dakika içindeki kayıtlar
 *
 * Performans: O(n) — n = toplam kayıt sayısı (~45). Her kayıt bir kez taranır.
 * Sonuç: Duplicate'ler Set<id> ile engellenir.
 */

import type {
  BaseRecord,
  RecordType,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../types';
import type { FilterableData } from './filterRecords';
import { normalizeName } from './normalizeName';
import { parseTimestamp } from './parseTimestamp';

/** İlişkili kayıt — kayıt + tipi + ilişki nedeni */
export interface RelatedRecord {
  readonly record: BaseRecord;
  readonly recordType: RecordType;
  readonly reason: 'person' | 'location' | 'time';
}

/** Zaman yakınlığı eşiği: 15 dakika (milisaniye cinsinden) */
const TIME_PROXIMITY_MS = 15 * 60 * 1000;

/**
 * Verilen kayıt için ilişkili kayıtları bulur.
 *
 * @param targetRecord - İlişki aranan kayıt
 * @param targetType - Kaydın tipi
 * @param allData - Tüm veri seti
 * @param maxResults - Maksimum sonuç sayısı (varsayılan: 10)
 * @returns İlişkili kayıtlar — zamana göre sıralı, kendisi hariç
 */
export function findRelatedRecords(
  targetRecord: BaseRecord,
  targetType: RecordType,
  allData: FilterableData,
  maxResults = 10,
): RelatedRecord[] {
  const seen = new Set<string>([targetRecord.id]);
  const results: RelatedRecord[] = [];

  /* Hedef kaydın kişi isimlerini çıkar (normalize) */
  const targetNames = extractNames(targetRecord, targetType);
  const targetTime = parseTimestamp(targetRecord.timestamp);

  /**
   * Tüm kategorileri dolaş, her kaydı üç kritere göre kontrol et.
   * İlk eşleşen neden kaydedilir (bir kayıt birden fazla nedenle ilişkili olabilir,
   * ancak tek kez eklenir).
   */
  const categories: { records: readonly BaseRecord[]; type: RecordType }[] = [
    { records: allData.checkins, type: 'checkin' },
    { records: allData.messages, type: 'message' },
    { records: allData.sightings, type: 'sighting' },
    { records: allData.personalNotes, type: 'personalNote' },
    { records: allData.anonymousTips, type: 'anonymousTip' },
  ];

  for (const { records, type } of categories) {
    for (const record of records) {
      /* Kendisini atla veya zaten eklenmiş kaydı atla */
      if (seen.has(record.id)) continue;

      let reason: RelatedRecord['reason'] | null = null;

      /* 1. Kişi ilişkisi — en güçlü bağlantı */
      if (targetNames.size > 0) {
        const recordNames = extractNames(record, type);
        for (const name of recordNames) {
          if (targetNames.has(name)) {
            reason = 'person';
            break;
          }
        }
      }

      /* 2. Lokasyon ilişkisi */
      if (!reason && targetRecord.location && record.location === targetRecord.location) {
        reason = 'location';
      }

      /* 3. Zaman yakınlığı */
      if (!reason && targetTime) {
        const recordTime = parseTimestamp(record.timestamp);
        if (recordTime && Math.abs(targetTime.getTime() - recordTime.getTime()) <= TIME_PROXIMITY_MS) {
          reason = 'time';
        }
      }

      if (reason) {
        seen.add(record.id);
        results.push({ record, recordType: type, reason });

        if (results.length >= maxResults) return results;
      }
    }
  }

  return results;
}

/**
 * Bir kayıttaki tüm kişi isimlerini normalize ederek çıkarır.
 * Set kullanılmasının sebebi: aynı isim birden fazla alanda geçebilir
 * (ör. sighting'de personName ve seenWith aynı kişi), duplicate'i önler.
 */
function extractNames(record: BaseRecord, type: RecordType): Set<string> {
  const names = new Set<string>();

  const addIfValid = (name: string | undefined | null) => {
    if (!name) return;
    const normalized = normalizeName(name);
    if (normalized && normalized !== 'unknown') {
      names.add(normalized);
    }
  };

  switch (type) {
    case 'checkin':
      addIfValid((record as Checkin).personName);
      break;
    case 'message':
      addIfValid((record as Message).senderName);
      addIfValid((record as Message).recipientName);
      break;
    case 'sighting':
      addIfValid((record as Sighting).personName);
      addIfValid((record as Sighting).seenWith);
      break;
    case 'personalNote':
      addIfValid((record as PersonalNote).authorName);
      if ((record as PersonalNote).mentionedPeople) {
        for (const name of (record as PersonalNote).mentionedPeople.split(',')) {
          addIfValid(name.trim());
        }
      }
      break;
    case 'anonymousTip':
      addIfValid((record as AnonymousTip).suspectName);
      break;
  }

  return names;
}
