/**
 * ============================================================
 * PersonalNote Tipi — Kişisel Gözlem Notu
 * ============================================================
 *
 * Form: Personal Notes (261065509008958)
 * Karakterlerin kendi gözlemlerini/notlarını kaydettiği form.
 * 8 adet kayıt mevcut — Kağan'ın notu "planladığım gibi" ifadesi kritik ipucu.
 */
import type { BaseRecord } from './common';

export interface PersonalNote extends BaseRecord {
  /** Notu yazan kişinin adı */
  readonly authorName: string;

  /** Not içeriği — soruşturma ipuçları içerir */
  readonly note: string;

  /**
   * Notta bahsedilen kişiler — virgülle ayrılmış string.
   * Örnek: "Podo, Kağan"
   * Boş olabilir (Cem'in notunda kimse bahsedilmemiş).
   *
   * Neden string dizisi değil?
   * → API'den tek bir string olarak geliyor. Parse sorumluluğu
   *   kullanım noktasına bırakılır — gereksiz dönüşüm yapılmaz.
   */
  readonly mentionedPeople: string;
}
