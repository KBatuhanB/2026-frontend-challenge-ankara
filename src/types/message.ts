/**
 * ============================================================
 * Message Tipi — Kişiler Arası Mesaj
 * ============================================================
 *
 * Form: Messages (261065765723966)
 * İki kişi arasında gönderilen mesajları temsil eder.
 * 14 adet kayıt mevcut — Kağan→Podo ve Kağan→Eray mesajları HIGH urgency.
 */
import type { BaseRecord, UrgencyLevel } from './common';

export interface Message extends BaseRecord {
  /** Mesajı gönderen kişinin adı */
  readonly senderName: string;

  /** Mesajı alan kişinin adı */
  readonly recipientName: string;

  /** Mesaj içeriği */
  readonly text: string;

  /**
   * Mesajın aciliyet seviyesi.
   * 'high' seviyesi soruşturma açısından kritik — özellikle
   * Kağan'ın Podo'ya ve Eray'a attığı mesajlar bu kategoride.
   */
  readonly urgency: UrgencyLevel;
}
