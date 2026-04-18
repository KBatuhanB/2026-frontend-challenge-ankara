/**
 * ============================================================
 * Sighting Tipi — Görgü Tanığı Raporu
 * ============================================================
 *
 * Form: Sightings (261065244786967)
 * Bir kişinin belirli bir lokasyonda kiminle görüldüğünü kaydeder.
 * 9 adet kayıt mevcut — Podo'nun son görülme kaydı 21:11'de Ankara Kalesi.
 */
import type { BaseRecord } from './common';

export interface Sighting extends BaseRecord {
  /** Görülen kişinin adı (genellikle Podo) */
  readonly personName: string;

  /**
   * Birlikte görülen kişinin adı.
   * "Unknown" değeri de gelebilir — Kağan'ın 21:22'de
   * Hamamönü'nde yalnız görülmesi bu şekilde kaydedilmiş.
   */
  readonly seenWith: string;

  /** Görgü tanığının notu — boş olabilir */
  readonly note: string;
}
