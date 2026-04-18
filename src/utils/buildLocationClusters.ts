/**
 * ============================================================
 * Lokasyon Kümeleme Fonksiyonu (Location Clustering)
 * ============================================================
 *
 * Neden ayrı utility?
 * → Harita görselleştirmesi için tüm veri kaynaklarını lokasyon bazında
 *   gruplamak gerekiyor. Her lokasyonda kimler bulunmuş, ne yapmışlar?
 *   Bu domain mantığı UI'dan ayrı tutulmalı (SRP).
 *   Pure function: memoize edilebilir, test edilebilir, side-effect yok.
 *
 * Algoritma:
 *   1. Tüm veri kaynaklarını tara (5 form)
 *   2. Geçerli koordinatı olan kayıtları lokasyon adına göre grupla
 *   3. Her lokasyon için: unique kişiler, olaylar, Podo varlığı hesapla
 *   4. Olayları kronolojik sırala
 *   5. Podo'nun son görülme lokasyonunu işaretle
 *
 * Performans: O(n) — n = toplam kayıt (~45). Her kayıt tek geçişte işlenir.
 *
 * Edge case'ler:
 *   - Koordinatı olmayan kayıtlar → atlanır (haritaya eklenemez)
 *   - Boş lokasyon adı → "Bilinmeyen Konum" olarak gruplanır
 *   - Podo ile ilgili kayıt yoksa → isLastSeen hiçbir cluster'da true olmaz
 *   - Aynı lokasyon farklı koordinatlarla → ilk koordinat kullanılır
 */

import type { FilterableData } from './filterRecords';
import type {
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
  RecordType,
} from '../types';
import { parseCoordinates } from './parseCoordinates';
import { normalizeName } from './normalizeName';
import { buildPodoTimeline } from './buildPodoTimeline';

/* ─── Dışa Aktarılan Tipler ─── */

/** Bir lokasyondaki tek olay — aktivite log'unda gösterilir */
export interface LocationEvent {
  readonly id: string;
  readonly type: RecordType;
  readonly time: string;
  readonly description: string;
  readonly people: readonly string[];
  readonly isHighlight: boolean;
  readonly urgency?: string;
  readonly confidence?: string;
  /** Sıralama için — UI'a yansıtılmaz */
  readonly _sortKey: number;
}

/** Bir lokasyon kümesi — haritadaki tek marker'ı temsil eder */
export interface LocationCluster {
  readonly locationName: string;
  readonly lat: number;
  readonly lon: number;
  readonly events: readonly LocationEvent[];
  readonly uniquePeople: readonly string[];
  readonly totalEvents: number;
  readonly hasPodo: boolean;
  readonly isLastSeen: boolean;
}

/* ─── Sabitler ─── */

const PODO_NORMALIZED = normalizeName('Podo');
const UNKNOWN_LOCATION = 'Bilinmeyen Konum';

/* ─── Yardımcı Fonksiyonlar ─── */

/**
 * Timestamp string'inden "HH:mm" çıkarır.
 * Format: "DD-MM-YYYY HH:mm" → "HH:mm"
 */
function extractTime(timestamp: string): string {
  const parts = timestamp.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : '';
}

/**
 * Kronolojik sıralama için sayısal değer üretir.
 * Neden tam Date parse değil?
 * → Sadece gün içi sıralama gerekiyor (aynı gün), saat:dakika yeterli.
 *   Daha hafif hesaplama.
 */
function toSortKey(timestamp: string): number {
  const parts = timestamp.trim().split(/\s+/);
  if (parts.length < 2) return Infinity;
  const timeParts = parts[1].split(':');
  if (timeParts.length < 2) return Infinity;
  return parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
}

/** Kişi adının Podo olup olmadığını kontrol eder (normalize edilmiş eşleşme) */
function isPodo(name: string | undefined | null): boolean {
  if (!name) return false;
  return normalizeName(name) === PODO_NORMALIZED;
}

/** String'i belirtilen uzunlukta keser — açıklama alanları için */
function truncate(str: string, max: number): string {
  return str.length <= max ? str : str.slice(0, max - 1) + '…';
}

/* ─── İç Yapı: Kümeleme Sırasında Kullanılan Mutable Builder ─── */

interface ClusterBuilder {
  locationName: string;
  lat: number;
  lon: number;
  events: LocationEvent[];
  peopleSet: Set<string>;
  hasPodo: boolean;
}

/* ─── Ana Fonksiyon ─── */

/**
 * Tüm form verilerini lokasyon bazında kümeler.
 * Her lokasyon için: marker koordinatı, orada bulunan kişiler,
 * gerçekleşen aktiviteler ve Podo'nun varlığı hesaplanır.
 *
 * @param data - Tüm form verileri (filtrelenmemiş)
 * @returns Lokasyon kümeleri — olay sayısına göre azalan sırada
 */
export function buildLocationClusters(data: FilterableData): LocationCluster[] {
  const clusterMap = new Map<string, ClusterBuilder>();

  /* Podo'nun son görülme lokasyonunu bul — kırmızı marker işareti için */
  const timeline = buildPodoTimeline(data);
  const lastSeenLocation = timeline.length > 0
    ? timeline[timeline.length - 1].location
    : null;

  /**
   * Bir kaydı uygun cluster'a ekler.
   * Cluster yoksa oluşturur, varsa event + kişi ekler.
   * Koordinatsız kayıtlar sessizce atlanır (haritada gösterilemez).
   */
  function addToCluster(
    locationName: string,
    coordinates: string,
    event: LocationEvent,
    people: string[],
  ): void {
    const coord = parseCoordinates(coordinates);
    if (!coord) return;

    /* Lokasyon adını normalize ederek gruplama key'i oluştur */
    const key = (locationName || UNKNOWN_LOCATION).trim().toLowerCase();
    const displayName = locationName?.trim() || UNKNOWN_LOCATION;

    let builder = clusterMap.get(key);
    if (!builder) {
      builder = {
        locationName: displayName,
        lat: coord.lat,
        lon: coord.lon,
        events: [],
        peopleSet: new Set(),
        hasPodo: false,
      };
      clusterMap.set(key, builder);
    }

    builder.events.push(event);

    /* Kişileri ekle — boş ve geçersiz isimleri filtrele */
    for (const p of people) {
      const trimmed = p?.trim();
      if (!trimmed) continue;
      builder.peopleSet.add(trimmed);
      if (isPodo(trimmed)) builder.hasPodo = true;
    }
  }

  /* ─── 1. Checkins: Etkinlik girişleri ─── */
  for (const r of data.checkins) {
    const record = r as Checkin;
    addToCluster(record.location, record.coordinates, {
      id: record.id,
      type: 'checkin',
      time: extractTime(record.timestamp),
      description: record.note || `${record.personName} check-in yaptı`,
      people: [record.personName],
      isHighlight: false,
      _sortKey: toSortKey(record.timestamp),
    }, [record.personName]);
  }

  /* ─── 2. Messages: Kişiler arası mesajlar ─── */
  for (const r of data.messages) {
    const record = r as Message;
    const desc = `${record.senderName} → ${record.recipientName}: "${truncate(record.text, 80)}"`;
    addToCluster(record.location, record.coordinates, {
      id: record.id,
      type: 'message',
      time: extractTime(record.timestamp),
      description: desc,
      people: [record.senderName, record.recipientName],
      isHighlight: record.urgency === 'high',
      urgency: record.urgency,
      _sortKey: toSortKey(record.timestamp),
    }, [record.senderName, record.recipientName]);
  }

  /* ─── 3. Sightings: Görgü tanığı raporları ─── */
  for (const r of data.sightings) {
    const record = r as Sighting;
    const withPerson = record.seenWith && record.seenWith !== 'Unknown'
      ? record.seenWith
      : null;
    const desc = withPerson
      ? `${record.personName} ile ${withPerson} birlikte görüldü${record.note ? ` — ${truncate(record.note, 60)}` : ''}`
      : `${record.personName} yalnız görüldü${record.note ? ` — ${truncate(record.note, 60)}` : ''}`;
    const people = withPerson
      ? [record.personName, withPerson]
      : [record.personName];

    addToCluster(record.location, record.coordinates, {
      id: record.id,
      type: 'sighting',
      time: extractTime(record.timestamp),
      description: desc,
      people,
      isHighlight: false,
      _sortKey: toSortKey(record.timestamp),
    }, people);
  }

  /* ─── 4. Personal Notes: Kişisel gözlem notları ─── */
  for (const r of data.personalNotes) {
    const record = r as PersonalNote;
    const mentioned = record.mentionedPeople
      ? record.mentionedPeople.split(',').map(s => s.trim()).filter(Boolean)
      : [];
    const allPeople = [record.authorName, ...mentioned];

    addToCluster(record.location, record.coordinates, {
      id: record.id,
      type: 'personalNote',
      time: extractTime(record.timestamp),
      description: `${record.authorName}: "${truncate(record.note, 80)}"`,
      people: allPeople,
      isHighlight: false,
      _sortKey: toSortKey(record.timestamp),
    }, allPeople);
  }

  /* ─── 5. Anonymous Tips: Anonim ihbarlar ─── */
  for (const r of data.anonymousTips) {
    const record = r as AnonymousTip;
    const people = record.suspectName ? [record.suspectName] : [];

    addToCluster(record.location, record.coordinates, {
      id: record.id,
      type: 'anonymousTip',
      time: extractTime(record.timestamp),
      description: truncate(record.tip, 100),
      people,
      isHighlight: record.confidence === 'high',
      confidence: record.confidence,
      _sortKey: toSortKey(record.timestamp),
    }, people);
  }

  /* ─── Builder'ları nihai cluster'lara dönüştür ─── */
  const clusters: LocationCluster[] = [];

  for (const builder of clusterMap.values()) {
    /* Her cluster içindeki olayları kronolojik sırala */
    builder.events.sort((a, b) => a._sortKey - b._sortKey);

    clusters.push({
      locationName: builder.locationName,
      lat: builder.lat,
      lon: builder.lon,
      events: builder.events,
      uniquePeople: Array.from(builder.peopleSet),
      totalEvents: builder.events.length,
      hasPodo: builder.hasPodo,
      /* Son görülme: normalize edilmiş lokasyon adı karşılaştırması */
      isLastSeen: lastSeenLocation !== null
        && builder.locationName.trim().toLowerCase() === lastSeenLocation.trim().toLowerCase(),
    });
  }

  /* Olay sayısına göre sırala — en yoğun lokasyonlar önde */
  clusters.sort((a, b) => b.totalEvents - a.totalEvents);

  return clusters;
}
