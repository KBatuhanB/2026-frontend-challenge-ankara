/**
 * ============================================================
 * Barrel Export — Tip Modülü Giriş Noktası
 * ============================================================
 *
 * Neden barrel export?
 * → Tüketici kodun "import { Checkin, Message } from '../types'" şeklinde
 *   tek bir noktadan tüm tiplere ulaşmasını sağlar.
 *   Her tip değişikliğinde import path'lerini güncellemeye gerek kalmaz.
 *   Ayrıca modül bağımlılıklarını tek bir yerden kontrol etmeyi kolaylaştırır.
 */

export type { BaseRecord, UrgencyLevel, ConfidenceLevel, RecordType } from './common';
export type { Checkin } from './checkin';
export type { Message } from './message';
export type { Sighting } from './sighting';
export type { PersonalNote } from './personalNote';
export type { AnonymousTip } from './anonymousTip';
export type { Person } from './person';
export type {
  JotformAnswer,
  JotformSubmission,
  JotformApiResponse,
} from './api';
