/**
 * ============================================================
 * Person Tipi — Birleştirilmiş Kişi Profili
 * ============================================================
 *
 * Neden bu tip gerekli?
 * → Soruşturma verisi 5 farklı formda dağınık halde. Bir kişiye tıklandığında
 *   o kişiyle ilgili TÜM kayıtları gösterebilmek için, verilerin kişi bazında
 *   birleştirilmesi gerekir. Bu tip, buildPersonProfiles fonksiyonunun
 *   çıktı yapısını tanımlar.
 *
 * normalizedName kullanımının sebebi:
 * → "Kağan", "Kagan", "Kağan A." aynı kişiyi temsil ediyor.
 *   normalizedName → "kagan" olarak saklanır ve eşleştirme key'i olarak kullanılır.
 *   name alanı ise kullanıcıya gösterilecek orijinal (ilk karşılaşılan) yazımı tutar.
 */
import type { Checkin } from './checkin';
import type { Message } from './message';
import type { Sighting } from './sighting';
import type { PersonalNote } from './personalNote';
import type { AnonymousTip } from './anonymousTip';

export interface Person {
  /** Gösterim adı — ilk karşılaşılan orijinal yazım (örn. "Kağan") */
  readonly name: string;

  /** Normalize edilmiş ad — eşleştirme anahtarı (örn. "kagan") */
  readonly normalizedName: string;

  /** Kişinin yaptığı check-in'ler */
  readonly checkins: readonly Checkin[];

  /** Kişinin gönderdiği mesajlar */
  readonly sentMessages: readonly Message[];

  /** Kişinin aldığı mesajlar */
  readonly receivedMessages: readonly Message[];

  /** Kişinin doğrudan görüldüğü kayıtlar (personName olarak) */
  readonly sightings: readonly Sighting[];

  /** Kişinin "yanında görüldüğü" kayıtlar (seenWith olarak) */
  readonly seenWithSightings: readonly Sighting[];

  /** Kişinin yazdığı notlar */
  readonly authoredNotes: readonly PersonalNote[];

  /** Kişinin adının geçtiği notlar (mentionedPeople alanında) */
  readonly mentionedInNotes: readonly PersonalNote[];

  /** Kişiye işaret eden anonim ihbarlar */
  readonly tips: readonly AnonymousTip[];
}
