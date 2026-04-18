/**
 * ============================================================
 * Checkin Tipi — Etkinlik Giriş Kaydı
 * ============================================================
 *
 * Form: Checkins (261065067494966)
 * Bir kişinin belirli bir lokasyona check-in yaptığını gösteren kayıt.
 * 9 adet kayıt mevcut — tüm karakterler CerModern'de 19:05–19:16 arası giriş yapmış.
 */
import type { BaseRecord } from './common';

export interface Checkin extends BaseRecord {
  /** Check-in yapan kişinin adı (örn. "Podo", "Kağan") */
  readonly personName: string;

  /** Kişinin bıraktığı not — boş olabilir */
  readonly note: string;
}
