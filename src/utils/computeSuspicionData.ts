/**
 * ============================================================
 * Şüphe Analiz Hesaplayıcısı (Suspicion Data Computer)
 * ============================================================
 *
 * Neden ayrı bir utility?
 * → SuspicionPanel'in gösterdiği 3 özet kartı (Son Görülme, En Şüpheli,
 *   Son Konum) farklı veri kaynaklarından hesaplama gerektirir.
 *   Bu hesaplama UI render'ından ayrılmalı (SRP) — pure function
 *   olarak memoize edilebilir ve test edilebilir.
 *
 * Hesaplama mantığı:
 *   1. Son Görülme: Podo'nun son sighting VEYA aldığı/gönderdiği son mesaj
 *   2. En Şüpheli: high confidence tip + high urgency mesaj sayısı en yüksek kişi
 *   3. Son Konum: Son görülme kaydının GPS koordinatları
 *
 * Performans: O(n) — tüm kayıtlar tek geçişte taranır (~45 kayıt).
 *
 * Edge case'ler:
 *   - Podo ile ilgili kayıt yoksa → null alanlar
 *   - Hiçbir kişi high flag'e sahip değilse → en çok toplam kayda sahip kişi
 *   - Koordinat boş ise → null
 */

import type { FilterableData } from './filterRecords';
import type {
  Checkin,
  Message,
  Sighting,
  AnonymousTip,
} from '../types';
import { normalizeName } from './normalizeName';
import { parseTimestamp } from './parseTimestamp';
import { parseCoordinates, type Coordinates } from './parseCoordinates';

/** SuspicionPanel'e aktarılacak hesaplanmış veri */
export interface SuspicionData {
  /** Son görülme bilgisi */
  readonly lastSeen: {
    readonly time: string;
    readonly location: string;
    readonly withPerson: string | null;
    readonly coordinates: Coordinates | null;
  } | null;

  /** En şüpheli kişi */
  readonly topSuspect: {
    readonly name: string;
    readonly highTipCount: number;
    readonly highUrgencyCount: number;
    readonly totalScore: number;
  } | null;

  /** Son bilinen konum */
  readonly lastLocation: {
    readonly name: string;
    readonly coordinates: Coordinates | null;
  } | null;

  /** Toplam kayıt istatistikleri */
  readonly stats: {
    readonly totalRecords: number;
    readonly totalPersons: number;
    readonly highAlertCount: number;
  };
}

/** Podo'nun normalize edilmiş adı */
const PODO_NORMALIZED = normalizeName('Podo');

/** Kişi bazlı şüphe skoru biriktirme yapısı */
interface SuspectAccumulator {
  name: string;
  highTipCount: number;
  highUrgencyCount: number;
}

/**
 * Tüm veriden şüphe analizi çıkarır.
 *
 * @param data - Tüm form verileri (filtrelenmemiş)
 * @returns Hesaplanmış şüphe verisi — SuspicionPanel'e hazır
 */
export function computeSuspicionData(data: FilterableData): SuspicionData {
  /*
   * ─── 1. Son Görülme Hesaplama ───
   * Podo'nun adının geçtiği tüm checkin, mesaj ve sighting kayıtlarını tara.
   * En geç timestamp'e sahip olanı "son görülme" olarak belirle.
   */
  let lastSeenTime = -Infinity;
  let lastSeenRecord: {
    time: string;
    location: string;
    withPerson: string | null;
    coordinates: string;
  } | null = null;

  /* Checkins — Podo'nun check-in'leri */
  for (const record of data.checkins) {
    const r = record as Checkin;
    if (normalizeName(r.personName) !== PODO_NORMALIZED) continue;
    const t = parseTimestamp(r.timestamp)?.getTime() ?? -Infinity;
    if (t > lastSeenTime) {
      lastSeenTime = t;
      lastSeenRecord = {
        time: r.timestamp,
        location: r.location,
        withPerson: null,
        coordinates: r.coordinates,
      };
    }
  }

  /* Messages — Podo'nun gönderdiği veya aldığı mesajlar */
  for (const record of data.messages) {
    const r = record as Message;
    const podoSender = normalizeName(r.senderName) === PODO_NORMALIZED;
    const podoRecipient = normalizeName(r.recipientName) === PODO_NORMALIZED;
    if (!podoSender && !podoRecipient) continue;
    const t = parseTimestamp(r.timestamp)?.getTime() ?? -Infinity;
    if (t > lastSeenTime) {
      lastSeenTime = t;
      lastSeenRecord = {
        time: r.timestamp,
        location: r.location,
        withPerson: podoSender ? r.recipientName : r.senderName,
        coordinates: r.coordinates,
      };
    }
  }

  /* Sightings — Podo'nun görüldüğü kayıtlar */
  for (const record of data.sightings) {
    const r = record as Sighting;
    if (normalizeName(r.personName) !== PODO_NORMALIZED) continue;
    const t = parseTimestamp(r.timestamp)?.getTime() ?? -Infinity;
    if (t > lastSeenTime) {
      lastSeenTime = t;
      lastSeenRecord = {
        time: r.timestamp,
        location: r.location,
        withPerson: r.seenWith && r.seenWith !== 'Unknown' ? r.seenWith : null,
        coordinates: r.coordinates,
      };
    }
  }

  /*
   * ─── 2. En Şüpheli Kişi Hesaplama ───
   * Her kişi için:
   *   - High confidence anonymous tip sayısı
   *   - High urgency mesaj sayısı (gönderen olarak)
   * Skor = highTipCount * 2 + highUrgencyCount
   * (tip'ler daha ağırlıklı çünkü birden fazla bağımsız kaynak)
   */
  const suspects = new Map<string, SuspectAccumulator>();

  /* Anonymous tips — şüpheli isimleri */
  for (const record of data.anonymousTips) {
    const r = record as AnonymousTip;
    const normalized = normalizeName(r.suspectName);
    if (!normalized || normalized === PODO_NORMALIZED) continue;

    const acc = suspects.get(normalized) ?? {
      name: r.suspectName,
      highTipCount: 0,
      highUrgencyCount: 0,
    };

    if (r.confidence === 'high') {
      acc.highTipCount++;
    }
    suspects.set(normalized, acc);
  }

  /* Messages — high urgency gönderenler */
  for (const record of data.messages) {
    const r = record as Message;
    if (r.urgency !== 'high') continue;
    const normalized = normalizeName(r.senderName);
    if (!normalized || normalized === PODO_NORMALIZED) continue;

    const acc = suspects.get(normalized) ?? {
      name: r.senderName,
      highTipCount: 0,
      highUrgencyCount: 0,
    };

    acc.highUrgencyCount++;
    suspects.set(normalized, acc);
  }

  /* En yüksek skorlu şüpheliyi bul */
  let topSuspect: SuspicionData['topSuspect'] = null;
  let maxScore = 0;

  for (const acc of suspects.values()) {
    const score = acc.highTipCount * 2 + acc.highUrgencyCount;
    if (score > maxScore) {
      maxScore = score;
      topSuspect = {
        name: acc.name,
        highTipCount: acc.highTipCount,
        highUrgencyCount: acc.highUrgencyCount,
        totalScore: score,
      };
    }
  }

  /*
   * ─── 3. İstatistikler ───
   */
  const totalRecords =
    data.checkins.length +
    data.messages.length +
    data.sightings.length +
    data.personalNotes.length +
    data.anonymousTips.length;

  /* Unique kişi sayısını hesapla — Set<normalizedName> */
  const uniquePersons = new Set<string>();
  for (const r of data.checkins) uniquePersons.add(normalizeName((r as Checkin).personName));
  for (const r of data.messages) {
    uniquePersons.add(normalizeName((r as Message).senderName));
    uniquePersons.add(normalizeName((r as Message).recipientName));
  }
  for (const r of data.sightings) uniquePersons.add(normalizeName((r as Sighting).personName));
  for (const r of data.anonymousTips) uniquePersons.add(normalizeName((r as AnonymousTip).suspectName));
  /* Boş string'i kaldır */
  uniquePersons.delete('');

  /* High alert sayısı = high urgency mesaj + high confidence tip */
  let highAlertCount = 0;
  for (const r of data.messages) {
    if ((r as Message).urgency === 'high') highAlertCount++;
  }
  for (const r of data.anonymousTips) {
    if ((r as AnonymousTip).confidence === 'high') highAlertCount++;
  }

  /*
   * ─── Sonuç ───
   */
  const lastSeenCoords = lastSeenRecord
    ? parseCoordinates(lastSeenRecord.coordinates)
    : null;

  return {
    lastSeen: lastSeenRecord
      ? {
          time: lastSeenRecord.time,
          location: lastSeenRecord.location,
          withPerson: lastSeenRecord.withPerson,
          coordinates: lastSeenCoords,
        }
      : null,

    topSuspect,

    lastLocation: lastSeenRecord
      ? {
          name: lastSeenRecord.location,
          coordinates: lastSeenCoords,
        }
      : null,

    stats: {
      totalRecords,
      totalPersons: uniquePersons.size,
      highAlertCount,
    },
  };
}
