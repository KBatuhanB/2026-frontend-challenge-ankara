/**
 * ============================================================
 * Podo Timeline Oluşturucu
 * ============================================================
 *
 * Neden ayrı bir utility?
 * → Timeline verisi, 5 farklı formdan Podo'nun adının geçtiği kayıtları
 *   toplama + kronolojik sıralama + display-ready dönüşüm gerektirir.
 *   Bu domain mantığı UI'dan ayrı tutulmalı (SRP).
 *   Pure function: memoize edilebilir, test edilebilir, side-effect yok.
 *
 * Algoritma:
 *   1. Her veri kaynağını tara, Podo'nun adının geçtiği kayıtları seç
 *   2. Her kaydı TimelineEvent formatına dönüştür
 *   3. Timestamp'e göre kronolojik sırala (artan)
 *   4. Son olaya "SON GÖRÜLME" işareti koy
 *
 * Performans: O(n log n) — n = toplam kayıt sayısı (~45).
 *   Filtreleme O(n), sıralama O(k log k) k=Podo kayıtları (~12).
 *
 * Edge case'ler:
 *   - Podo ile ilgili kayıt yoksa → boş dizi
 *   - Aynı timestamp'te birden fazla kayıt → sıra korunur (stable sort)
 *   - Parse edilemeyen timestamp → listenin sonuna düşer (null → Infinity)
 */

import type { FilterableData } from './filterRecords';
import type {
  Checkin,
  Message,
  Sighting,
  RecordType,
} from '../types';
import { normalizeName } from './normalizeName';
import { parseTimestamp } from './parseTimestamp';

/** Timeline'da gösterilecek tek olay */
export interface TimelineEvent {
  /** Kaynak kaydın ID'si — unique key olarak */
  readonly id: string;
  /** Olay zamanı — "HH:mm" formatında gösterim için */
  readonly time: string;
  /** Olay lokasyonu */
  readonly location: string;
  /** Olay açıklaması — insan okunabilir */
  readonly description: string;
  /** Kaynak tipi — ikon seçimi için */
  readonly sourceType: RecordType;
  /** Koordinatlar — harita entegrasyonu için */
  readonly coordinates: string;
  /** Kritik olay mı? — görsel vurgu (son görülme, HIGH mesaj vb.) */
  readonly isHighlight: boolean;
  /** Sıralama için parse edilmiş timestamp — UI'a yansıtılmaz */
  readonly _sortKey: number;
}

/** Podo'nun normalize edilmiş adı — sabit, her seferinde hesaplamaya gerek yok */
const PODO_NORMALIZED = normalizeName('Podo');

/**
 * Bir ismin Podo olup olmadığını kontrol eder.
 * Neden ayrı fonksiyon?
 * → normalizeName çağrısını kapsüller, null-safe.
 */
function isPodo(name: string | undefined | null): boolean {
  if (!name) return false;
  return normalizeName(name) === PODO_NORMALIZED;
}

/**
 * Timestamp string'inden "HH:mm" formatını çıkarır.
 * Neden regex yerine split?
 * → Veri formatı garantili "DD-MM-YYYY HH:mm", split daha okunabilir.
 *   Parse başarısız olursa boş string döner (UI'da gizlenir).
 */
function extractTime(timestamp: string): string {
  const parts = timestamp.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : '';
}

/**
 * Tüm veri kaynaklarından Podo ile ilgili olayları toplayıp
 * kronolojik sıralı timeline dizisi oluşturur.
 *
 * @param data - Tüm form verileri (filtrelenmemiş)
 * @returns Kronolojik sıralı timeline olayları
 */
export function buildPodoTimeline(data: FilterableData): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  /* ─── 1. Checkins: Podo'nun check-in'leri ─── */
  for (const record of data.checkins) {
    const r = record as Checkin;
    if (!isPodo(r.personName)) continue;
    events.push({
      id: r.id,
      time: extractTime(r.timestamp),
      location: r.location,
      description: r.note || 'Check-in yaptı',
      sourceType: 'checkin',
      coordinates: r.coordinates,
      isHighlight: false,
      _sortKey: parseTimestamp(r.timestamp)?.getTime() ?? Infinity,
    });
  }

  /* ─── 2. Messages: Podo'nun gönderdiği veya aldığı mesajlar ─── */
  for (const record of data.messages) {
    const r = record as Message;
    const podoIsSender = isPodo(r.senderName);
    const podoIsRecipient = isPodo(r.recipientName);
    if (!podoIsSender && !podoIsRecipient) continue;

    const description = podoIsSender
      ? `${r.recipientName}'a mesaj: "${truncate(r.text, 60)}"`
      : `${r.senderName}'dan mesaj: "${truncate(r.text, 60)}"`;

    events.push({
      id: r.id,
      time: extractTime(r.timestamp),
      location: r.location || '—',
      description,
      sourceType: 'message',
      coordinates: r.coordinates,
      /* HIGH urgency mesajlar soruşturma açısından kritik */
      isHighlight: r.urgency === 'high',
      _sortKey: parseTimestamp(r.timestamp)?.getTime() ?? Infinity,
    });
  }

  /* ─── 3. Sightings: Podo'nun görüldüğü kayıtlar ─── */
  for (const record of data.sightings) {
    const r = record as Sighting;
    if (!isPodo(r.personName)) continue;

    const withWho = r.seenWith && r.seenWith !== 'Unknown'
      ? `${r.seenWith} ile görüldü`
      : 'Yalnız görüldü';

    const note = r.note ? ` — ${truncate(r.note, 50)}` : '';

    events.push({
      id: r.id,
      time: extractTime(r.timestamp),
      location: r.location,
      description: `${withWho}${note}`,
      sourceType: 'sighting',
      coordinates: r.coordinates,
      isHighlight: false,
      _sortKey: parseTimestamp(r.timestamp)?.getTime() ?? Infinity,
    });
  }

  /* ─── Sıralama: kronolojik (artan timestamp) ─── */
  events.sort((a, b) => a._sortKey - b._sortKey);

  /* ─── Son olayı "SON GÖRÜLME" olarak işaretle ─── */
  if (events.length > 0) {
    const last = events[events.length - 1];
    events[events.length - 1] = { ...last, isHighlight: true };
  }

  return events;
}

/**
 * String'i belirtilen uzunlukta keser.
 * Neden custom truncate?
 * → CSS text-overflow yerine JS seviyesinde kesmek,
 *   timeline description'larında tutarlı uzunluk sağlar.
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}
