/**
 * ============================================================
 * Kişi Profili Oluşturucu (Person Profile Builder)
 * ============================================================
 *
 * Neden bu fonksiyon?
 * → Soruşturma verisi 5 farklı formda dağınık halde. Bir kişiye tıklandığında
 *   o kişiyle ilgili TÜM kayıtları gösterebilmek için, verilerin kişi bazında
 *   birleştirilmesi gerekir. Bu fonksiyon:
 *   1. Tüm formlardaki isim alanlarını tarar
 *   2. normalizeName ile aynı kişiyi farklı yazımlarla eşleştirir
 *   3. Her kişi için ilişkili tüm kayıtları gruplar
 *
 * Algoritma:
 *   1. Boş bir Map<normalizedName, Person> oluştur
 *   2. Her veri kaynağını dolaş, ilgili isim alanlarını normalize et
 *   3. Normalize edilmiş key ile Map'te ara — yoksa oluştur, varsa kayıt ekle
 *   4. Map'i Person dizisine dönüştür ve ada göre sırala
 *
 * Performans: O(n) — n = toplam kayıt sayısı (~45). Her kayıt bir kez taranır.
 * Bellek: O(k) — k = unique kişi sayısı (~9). Map boyutu.
 *
 * Edge case'ler:
 *   - Boş veri setleri → boş Person dizisi döner
 *   - İsimsiz kayıtlar → atlanır (boş normalize → skip)
 *   - mentionedPeople virgülle ayrılmış → split ile her biri ayrı kişi olarak eklenir
 */

import type {
  FilterableData,
} from './filterRecords';
import type {
  Person,
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../types';
import { normalizeName } from './normalizeName';

/**
 * Dahili profil tipi — Map içinde mutable olarak tutulur.
 * Neden Person'dan ayrı?
 * → Person interface'i readonly diziler kullanır (immutability).
 *   Oluşturma sırasında ise push yapabilmemiz gerekir.
 *   Oluşturma bittikten sonra Person tipine cast edilir.
 */
interface MutablePersonProfile {
  name: string;
  normalizedName: string;
  checkins: Checkin[];
  sentMessages: Message[];
  receivedMessages: Message[];
  sightings: Sighting[];
  seenWithSightings: Sighting[];
  authoredNotes: PersonalNote[];
  mentionedInNotes: PersonalNote[];
  tips: AnonymousTip[];
}

/**
 * Verilen normalize edilmiş isim için Map'ten profil al, yoksa oluştur.
 *
 * Neden ayrı bir helper?
 * → Her veri kaynağı işlenirken aynı "al veya oluştur" mantığı tekrarlanır.
 *   Bu helper ile DRY prensibine uyuyoruz.
 *
 * @param profiles - Kişi profili Map'i
 * @param originalName - Orijinal isim (gösterim için)
 * @param normalized - Normalize edilmiş isim (eşleştirme key'i)
 * @returns Mutable profil referansı
 */
function getOrCreateProfile(
  profiles: Map<string, MutablePersonProfile>,
  originalName: string,
  normalized: string,
): MutablePersonProfile {
  let profile = profiles.get(normalized);

  if (!profile) {
    profile = {
      /* İlk karşılaşılan yazımı gösterim adı olarak kullan.
         Neden ilk karşılaşılan?
         → "Kağan" checkin'de görülmüş, "Kagan" sighting'de. İlk kaydedilen
           genellikle en "doğru" yazımdır (checkin = kişinin kendisi girdi). */
      name: originalName,
      normalizedName: normalized,
      checkins: [],
      sentMessages: [],
      receivedMessages: [],
      sightings: [],
      seenWithSightings: [],
      authoredNotes: [],
      mentionedInNotes: [],
      tips: [],
    };
    profiles.set(normalized, profile);
  }

  return profile;
}

/**
 * Tüm veri kaynaklarını kişi bazında birleştirerek Person dizisi oluşturur.
 *
 * @param data - useAllData hook'undan gelen birleşik veri
 * @returns Kişi profilleri dizisi — ada göre alfabetik sıralı
 *
 * @example
 * ```ts
 * const { checkins, messages, ... } = useAllData();
 * const persons = buildPersonProfiles({ checkins, messages, ... });
 * // persons[0] = { name: "Aslı", checkins: [...], sentMessages: [...], ... }
 * ```
 */
export function buildPersonProfiles(data: FilterableData): Person[] {
  const profiles = new Map<string, MutablePersonProfile>();

  /* ─── 1. Checkins: personName alanı ─── */
  for (const checkin of data.checkins) {
    const normalized = normalizeName(checkin.personName);
    if (!normalized) continue;

    const profile = getOrCreateProfile(profiles, checkin.personName, normalized);
    profile.checkins.push(checkin);
  }

  /* ─── 2. Messages: senderName ve recipientName alanları ─── */
  for (const message of data.messages) {
    /* Göndereni kaydet */
    const senderNorm = normalizeName(message.senderName);
    if (senderNorm) {
      const senderProfile = getOrCreateProfile(profiles, message.senderName, senderNorm);
      senderProfile.sentMessages.push(message);
    }

    /* Alıcıyı kaydet */
    const recipientNorm = normalizeName(message.recipientName);
    if (recipientNorm) {
      const recipientProfile = getOrCreateProfile(profiles, message.recipientName, recipientNorm);
      recipientProfile.receivedMessages.push(message);
    }
  }

  /* ─── 3. Sightings: personName ve seenWith alanları ─── */
  for (const sighting of data.sightings) {
    /* Görülen kişiyi kaydet */
    const personNorm = normalizeName(sighting.personName);
    if (personNorm) {
      const personProfile = getOrCreateProfile(profiles, sighting.personName, personNorm);
      personProfile.sightings.push(sighting);
    }

    /* Birlikte görülen kişiyi kaydet.
       "Unknown" değerini atla — gerçek bir kişi değil. */
    const seenWithNorm = normalizeName(sighting.seenWith);
    if (seenWithNorm && seenWithNorm !== 'unknown') {
      const seenWithProfile = getOrCreateProfile(profiles, sighting.seenWith, seenWithNorm);
      seenWithProfile.seenWithSightings.push(sighting);
    }
  }

  /* ─── 4. Personal Notes: authorName ve mentionedPeople alanları ─── */
  for (const note of data.personalNotes) {
    /* Notu yazan kişiyi kaydet */
    const authorNorm = normalizeName(note.authorName);
    if (authorNorm) {
      const authorProfile = getOrCreateProfile(profiles, note.authorName, authorNorm);
      authorProfile.authoredNotes.push(note);
    }

    /* Notta bahsedilen kişileri kaydet.
       mentionedPeople virgülle ayrılmış string: "Podo, Kağan"
       Her birini ayrı kişi olarak işle. */
    if (note.mentionedPeople) {
      const mentioned = note.mentionedPeople.split(',');
      for (const name of mentioned) {
        const mentionedNorm = normalizeName(name);
        if (mentionedNorm) {
          const mentionedProfile = getOrCreateProfile(profiles, name.trim(), mentionedNorm);
          mentionedProfile.mentionedInNotes.push(note);
        }
      }
    }
  }

  /* ─── 5. Anonymous Tips: suspectName alanı ─── */
  for (const tip of data.anonymousTips) {
    const suspectNorm = normalizeName(tip.suspectName);
    if (suspectNorm) {
      const suspectProfile = getOrCreateProfile(profiles, tip.suspectName, suspectNorm);
      suspectProfile.tips.push(tip);
    }
  }

  /* Map'i diziye dönüştür ve ada göre alfabetik sırala.
     Neden sıralama?
     → UI'da kişi listesi tutarlı ve tahmin edilebilir bir sırada gösterilir.
       Kullanıcı deneyimi açısından önemli. */
  return Array.from(profiles.values())
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'))
    .map((profile) => profile as Person);
}
