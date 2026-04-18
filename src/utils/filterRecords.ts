/**
 * ============================================================
 * Kayıt Filtreleme Fonksiyonları
 * ============================================================
 *
 * Neden ayrı utility?
 * → Filtreleme mantığı UI bileşenlerinden bağımsız olmalı.
 *   Pure function olarak yazıldığında:
 *   1. Unit test ile doğrulanabilir
 *   2. useMemo içinde referans stabilitesi sağlanır
 *   3. Gelecekte Web Worker'a taşınabilir (performans gerekirse)
 *
 * Strateji:
 * → Her filtreleme adımı (search, source, location, urgency, confidence)
 *   bağımsız bir predicate fonksiyonudur. Compose edilerek zincirlenir.
 *   Short-circuit: boş filtre = hepsini geçir (O(1) kontrol).
 *
 * Performans: O(n) — n = toplam kayıt sayısı (~45). Her kayıt tek geçişte
 * tüm predikatlardan geçer. Filtre aktif değilse predicate skip edilir.
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
import type { FilterState } from '../context/FilterContext';
import { normalizeName } from './normalizeName';

/**
 * Filtrelenecek veri yapısı — kategori bazında ayrılmış.
 * Neden BaseRecord[][] değil de named fields?
 * → Her kategorinin hangi RecordType olduğu açıkça belirtilir,
 *   tip güvenliği korunur.
 */
export interface FilterableData {
  readonly checkins: readonly Checkin[];
  readonly messages: readonly Message[];
  readonly sightings: readonly Sighting[];
  readonly personalNotes: readonly PersonalNote[];
  readonly anonymousTips: readonly AnonymousTip[];
}

/** Filtreleme sonucu — aynı yapıda, sayıları değişmiş */
export interface FilteredData {
  readonly checkins: readonly Checkin[];
  readonly messages: readonly Message[];
  readonly sightings: readonly Sighting[];
  readonly personalNotes: readonly PersonalNote[];
  readonly anonymousTips: readonly AnonymousTip[];
}

/**
 * Tüm filtre koşullarını uygulayarak verileri süzer.
 *
 * @param data - Filtrelenmemiş ham veri
 * @param filters - Aktif filtre durumu (FilterContext'ten)
 * @returns Filtrelenmiş veri — aynı yapıda, koşula uyan kayıtlar
 */
export function applyFilters(data: FilterableData, filters: FilterState): FilteredData {
  const { searchQuery, selectedSources, selectedLocations, urgencyFilter, confidenceFilter } = filters;

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const normalizedQueryName = normalizeName(searchQuery);

  /* Kaynak filtresi aktif mi? Boş dizi = tüm kaynaklar aktif */
  const hasSourceFilter = selectedSources.length > 0;
  const hasLocationFilter = selectedLocations.length > 0;

  return {
    checkins: (!hasSourceFilter || selectedSources.includes('checkins'))
      ? filterRecords(data.checkins, normalizedQuery, normalizedQueryName, hasLocationFilter, selectedLocations, 'checkin', urgencyFilter, confidenceFilter)
      : [],

    messages: (!hasSourceFilter || selectedSources.includes('messages'))
      ? filterRecords(data.messages, normalizedQuery, normalizedQueryName, hasLocationFilter, selectedLocations, 'message', urgencyFilter, confidenceFilter)
      : [],

    sightings: (!hasSourceFilter || selectedSources.includes('sightings'))
      ? filterRecords(data.sightings, normalizedQuery, normalizedQueryName, hasLocationFilter, selectedLocations, 'sighting', urgencyFilter, confidenceFilter)
      : [],

    personalNotes: (!hasSourceFilter || selectedSources.includes('personalNotes'))
      ? filterRecords(data.personalNotes, normalizedQuery, normalizedQueryName, hasLocationFilter, selectedLocations, 'personalNote', urgencyFilter, confidenceFilter)
      : [],

    anonymousTips: (!hasSourceFilter || selectedSources.includes('anonymousTips'))
      ? filterRecords(data.anonymousTips, normalizedQuery, normalizedQueryName, hasLocationFilter, selectedLocations, 'anonymousTip', urgencyFilter, confidenceFilter)
      : [],
  };
}

/**
 * Tek bir kategorideki kayıtları filtreler.
 * Generic olarak tüm BaseRecord alt tipleri için çalışır.
 */
function filterRecords<T extends BaseRecord>(
  records: readonly T[],
  normalizedQuery: string,
  normalizedQueryName: string,
  hasLocationFilter: boolean,
  selectedLocations: readonly string[],
  recordType: RecordType,
  urgencyFilter: string | null,
  confidenceFilter: string | null,
): T[] {
  /* Hiçbir filtre aktif değilse diziyi olduğu gibi döndür (O(1) shortcut) */
  if (
    !normalizedQuery &&
    !hasLocationFilter &&
    !urgencyFilter &&
    !confidenceFilter
  ) {
    return records as unknown as T[];
  }

  return records.filter((record) => {
    /* 1. Lokasyon filtresi */
    if (hasLocationFilter && !selectedLocations.includes(record.location)) {
      return false;
    }

    /* 2. Urgency filtresi — sadece Message tipi için geçerli */
    if (urgencyFilter && recordType === 'message') {
      if ((record as unknown as Message).urgency !== urgencyFilter) {
        return false;
      }
    }

    /* 3. Confidence filtresi — sadece AnonymousTip tipi için geçerli */
    if (confidenceFilter && recordType === 'anonymousTip') {
      if ((record as unknown as AnonymousTip).confidence !== confidenceFilter) {
        return false;
      }
    }

    /* 4. Metin araması — en pahalı işlem en sona (short-circuit) */
    if (normalizedQuery) {
      return matchesSearch(record, recordType, normalizedQuery, normalizedQueryName);
    }

    return true;
  });
}

/**
 * Bir kaydın arama sorgusuna uyup uymadığını kontrol eder.
 *
 * Strateji:
 * → Önce common alanlar (location, timestamp) kontrol edilir.
 *   Sonra tip-spesifik alanlar kontrol edilir.
 *   İlk eşleşmede true döner (short-circuit — gereksiz kontrol yapılmaz).
 *
 * İsim eşleştirmesi normalizeName üzerinden yapılır:
 * → "kagan" araması "Kağan", "Kagan", "Kağan A." ile eşleşir.
 */
function matchesSearch(
  record: BaseRecord,
  recordType: RecordType,
  normalizedQuery: string,
  normalizedQueryName: string,
): boolean {
  /* Common alanlar — tüm kayıt tipleri için geçerli */
  if (record.location.toLowerCase().includes(normalizedQuery)) return true;

  /* Tip-spesifik alanlar */
  switch (recordType) {
    case 'checkin': {
      const r = record as Checkin;
      if (nameMatches(r.personName, normalizedQuery, normalizedQueryName)) return true;
      if (r.note?.toLowerCase().includes(normalizedQuery)) return true;
      break;
    }
    case 'message': {
      const r = record as Message;
      if (nameMatches(r.senderName, normalizedQuery, normalizedQueryName)) return true;
      if (nameMatches(r.recipientName, normalizedQuery, normalizedQueryName)) return true;
      if (r.text?.toLowerCase().includes(normalizedQuery)) return true;
      break;
    }
    case 'sighting': {
      const r = record as Sighting;
      if (nameMatches(r.personName, normalizedQuery, normalizedQueryName)) return true;
      if (nameMatches(r.seenWith, normalizedQuery, normalizedQueryName)) return true;
      if (r.note?.toLowerCase().includes(normalizedQuery)) return true;
      break;
    }
    case 'personalNote': {
      const r = record as PersonalNote;
      if (nameMatches(r.authorName, normalizedQuery, normalizedQueryName)) return true;
      if (r.note?.toLowerCase().includes(normalizedQuery)) return true;
      if (r.mentionedPeople?.toLowerCase().includes(normalizedQuery)) return true;
      break;
    }
    case 'anonymousTip': {
      const r = record as AnonymousTip;
      if (nameMatches(r.suspectName, normalizedQuery, normalizedQueryName)) return true;
      if (r.tip?.toLowerCase().includes(normalizedQuery)) return true;
      break;
    }
  }

  return false;
}

/**
 * İsim eşleştirmesi — hem ham metin hem normalize edilmiş isim üzerinden.
 * İki katmanlı kontrol:
 * 1. Ham metin includes (hızlı) — "Kağan" aramasında "Kağan" bulur
 * 2. Normalize edilmiş includes (fuzzy) — "kagan" aramasında "Kağan A." bulur
 */
function nameMatches(
  fieldValue: string,
  normalizedQuery: string,
  normalizedQueryName: string,
): boolean {
  if (!fieldValue) return false;
  if (fieldValue.toLowerCase().includes(normalizedQuery)) return true;
  if (normalizedQueryName && normalizeName(fieldValue).includes(normalizedQueryName)) return true;
  return false;
}

/**
 * Veri setinden tüm benzersiz lokasyonları çıkarır.
 * FilterBar'da lokasyon chip'leri oluşturmak için kullanılır.
 *
 * @returns Alfabetik sıralı lokasyon dizisi
 */
export function extractUniqueLocations(data: FilterableData): string[] {
  const locations = new Set<string>();

  const addLocations = (records: readonly BaseRecord[]) => {
    for (const record of records) {
      if (record.location) locations.add(record.location);
    }
  };

  addLocations(data.checkins);
  addLocations(data.messages);
  addLocations(data.sightings);
  addLocations(data.personalNotes);
  addLocations(data.anonymousTips);

  return Array.from(locations).sort((a, b) => a.localeCompare(b, 'tr'));
}
