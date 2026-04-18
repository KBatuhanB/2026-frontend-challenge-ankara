/**
 * ============================================================
 * AnonymousTip Tipi — Anonim İhbar
 * ============================================================
 *
 * Form: Anonymous Tips (261065875889981)
 * Güvenilirliği değişen anonim ihbar kayıtları.
 * 5 adet kayıt mevcut — Kağan'a işaret eden 3 ihbar (2× HIGH confidence).
 *
 * DİKKAT: Bu formun qid yapısı diğerlerinden farklıdır.
 * submissionDate alanı qid=1'de başlar, diğer formlarda qid=2'den başlar.
 * Bu fark normalizeSubmission tarafından otomatik olarak ele alınır
 * çünkü qid yerine field name'e bakılır.
 */
import type { BaseRecord, ConfidenceLevel } from './common';

export interface AnonymousTip extends BaseRecord {
  /**
   * İhbarın gönderildiği tarih — "Apr 6, 2026" gibi farklı bir formatta.
   * timestamp alanından ayrı tutulur çünkü farklı bir veriyi temsil eder:
   * submissionDate = formun doldurulma tarihi, timestamp = olayın zamanı.
   */
  readonly submissionDate: string;

  /** İhbarda adı geçen şüpheli kişi */
  readonly suspectName: string;

  /** İhbar metni — soruşturma ipuçları içerir */
  readonly tip: string;

  /**
   * İhbarın güvenilirlik seviyesi.
   * 'high' seviyesi soruşturma açısından kritik —
   * Kağan'a işaret eden Atakule ve Ankara Kalesi ihbarları bu kategoride.
   */
  readonly confidence: ConfidenceLevel;
}
