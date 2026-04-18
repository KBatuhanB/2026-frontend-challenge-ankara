/**
 * ============================================================
 * Jotform Submission Normalizer
 * ============================================================
 *
 * Neden bu fonksiyon?
 * → Jotform API, submission verilerini iç içe geçmiş (nested) bir yapıda döner:
 *   `answers[qid] = { name: "personName", answer: "Podo" }`
 *
 *   UI bileşenleri ise düz (flat) obje bekler:
 *   `{ personName: "Podo" }`
 *
 *   Bu fonksiyon, API'nin karmaşık yapısını uygulama tipine dönüştürür.
 *   Tüm form tipleri için tek bir generic fonksiyon kullanılır (DRY).
 *
 * Neden qid yerine field name kullanıyoruz?
 * → Her formun qid numaralandırması farklı olabilir (Anonymous Tips qid=1'den,
 *   diğerleri qid=2'den başlar). Field name ("personName", "senderName" vb.)
 *   ise tutarlı ve anlamlıdır — bu yaklaşım form yapısı değişikliklerine dayanıklıdır.
 *
 * Generic tip parametresi:
 * → T, hedef form tipini temsil eder (Checkin, Message, vb.).
 *   Bu sayede dönüş değeri tip-güvenli olur ve yanlış alan erişimi derleme zamanında yakalanır.
 *
 * Performans: O(n) — n = answers objesindeki alan sayısı (form başına 5-8 alan, ihmal edilebilir).
 */

import type { JotformSubmission } from '../types';

/**
 * Tek bir Jotform submission'ını düz (flat) objeye dönüştürür.
 *
 * @typeParam T - Hedef form tipi (Checkin, Message, Sighting, PersonalNote, AnonymousTip)
 * @param submission - Jotform API'den gelen ham submission
 * @returns Düzleştirilmiş ve tiplendirilmiş obje
 *
 * @example
 * ```ts
 * // API'den gelen:
 * // { id: "123", answers: { "2": { name: "personName", answer: "Podo" } } }
 * // Dönüşüm sonrası:
 * // { id: "123", personName: "Podo", ... }
 * ```
 */
export function normalizeSubmission<T>(submission: JotformSubmission): T {
  /**
   * id alanı her submission'da mevcut — flat objenin temel tanımlayıcısı.
   * Record<string, unknown> kullanarak dinamik alan eklemeye izin veriyoruz,
   * sonrasında T'ye cast ediyoruz.
   */
  const result: Record<string, unknown> = {
    id: submission.id,
  };

  /**
   * answers objesinin her entry'sini dolaş.
   * Neden Object.values yerine Object.entries?
   * → qid değerine ihtiyacımız yok ama ileride debug için gerekebilir.
   *   Object.values da yeterli olurdu, ancak entries daha açıklayıcı.
   */
  const answers = submission.answers;

  if (answers) {
    for (const qid of Object.keys(answers)) {
      const answerObj = answers[qid];

      /* Güvenlik kontrolü: answer objesi veya name alanı yoksa atla.
         Jotform'da silinmiş veya deaktif edilmiş sorular undefined gelebilir. */
      if (!answerObj || !answerObj.name) {
        continue;
      }

      /**
       * answer değeri undefined ise boş string ata.
       * Neden?
       * → UI bileşenleri string bekliyor. undefined yerine boş string
       *   vermek null check gereksinimini azaltır ve defensive coding sağlar.
       *   Boş bir cevap "veri yok" anlamına gelir, undefined ise "alan hiç yok" —
       *   ikisi de UI'da aynı şekilde (boş) gösterilmeli.
       */
      result[answerObj.name] = answerObj.answer ?? '';
    }
  }

  /**
   * T'ye cast etme — TypeScript'te runtime tip kontrolü olmadığı için
   * bu noktada güveniyoruz ki API'den gelen field name'ler
   * beklediğimiz tiplerdeki property isimlerine karşılık geliyor.
   *
   * Bu güven DATA_ANALYSIS.md'deki alan eşleştirme tablosuyla doğrulanmıştır.
   * Prodüksiyon ortamında runtime validation kütüphanesi (zod, io-ts)
   * kullanılabilir, ancak hackathon kapsamında bu yeterlidir.
   */
  return result as T;
}

/**
 * Birden fazla submission'ı toplu olarak normalize eder.
 *
 * Neden ayrı bir fonksiyon?
 * → Array.map() ile her seferinde normalizeSubmission çağrısı yapmak yerine,
 *   semantik olarak açık ve tekrar kullanılabilir bir wrapper sağlar.
 *   Ayrıca ileride filtreleme (örn. sadece ACTIVE submission'lar) eklenebilir.
 *
 * @typeParam T - Hedef form tipi
 * @param submissions - Jotform API'den gelen ham submission dizisi
 * @returns Normalize edilmiş obje dizisi
 */
export function normalizeSubmissions<T>(submissions: readonly JotformSubmission[]): T[] {
  return submissions
    /* Sadece aktif submission'ları al — silinmiş/arşivlenmiş kayıtları filtrele.
       Neden?
       → Jotform'da silinen submission'lar "DELETED" statüsüyle kalabilir.
         Soruşturma sadece aktif kayıtlarla çalışmalı — silinmiş veri güvenilir değil.
       Not: Jotform "ACTIVE" veya "CUSTOM" statüsünü kullanabilir, ikisi de geçerli. */
    .filter((sub) => sub.status !== 'DELETED')
    .map((sub) => normalizeSubmission<T>(sub));
}
