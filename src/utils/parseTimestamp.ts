/**
 * ============================================================
 * Timestamp Parse Fonksiyonu
 * ============================================================
 *
 * Neden bu fonksiyon?
 * → Jotform verilerindeki timestamp formatı "18-04-2026 19:05" (DD-MM-YYYY HH:mm).
 *   JavaScript Date constructor'ı bu formatı doğrudan tanımaz.
 *   Bu fonksiyon güvenli bir şekilde Date objesine dönüştürür.
 *
 * Neden Date.parse() veya new Date(string) kullanmıyoruz?
 * → Tarayıcılar arası tutarsız davranış riski var. Explicit parse
 *   her ortamda aynı sonucu garanti eder.
 *
 * Edge case'ler:
 *   - Boş string → null
 *   - Yanlış format → null
 *   - Geçersiz tarih (32. gün vb.) → null (Date.getTime() NaN kontrolü)
 *   - Sadece saat ("19:05") → null (tam format gerekli)
 *
 * Performans: O(1) — sabit zaman, string split + parse.
 */

/**
 * Beklenen timestamp formatı: DD-MM-YYYY HH:mm
 * Regex açıklama:
 *   ^(\d{2})     → gün (2 haneli)
 *   -(\d{2})     → ay (2 haneli)
 *   -(\d{4})     → yıl (4 haneli)
 *   \s+          → boşluk (bir veya daha fazla)
 *   (\d{2})      → saat (2 haneli)
 *   :(\d{2})$    → dakika (2 haneli)
 */
const TIMESTAMP_REGEX = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/;

/**
 * "DD-MM-YYYY HH:mm" formatındaki string'i Date objesine dönüştürür.
 *
 * @param timestampStr - "18-04-2026 19:05" formatında zaman damgası
 * @returns Date objesi veya geçersiz girdi durumunda null
 *
 * @example
 * parseTimestamp("18-04-2026 19:05") // → Date(2026-04-18T19:05:00)
 * parseTimestamp("")                  // → null
 * parseTimestamp("2026-04-18")        // → null (yanlış format)
 */
export function parseTimestamp(timestampStr: string | null | undefined): Date | null {
  /* Null/undefined/boş string kontrolü */
  if (!timestampStr || typeof timestampStr !== 'string') {
    return null;
  }

  const trimmed = timestampStr.trim();
  if (trimmed.length === 0) {
    return null;
  }

  /* Regex ile format doğrulama ve parçalara ayırma */
  const match = trimmed.match(TIMESTAMP_REGEX);
  if (!match) {
    return null;
  }

  /* Destructure: match[0] = full match, match[1..5] = capture groups */
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const hours = parseInt(match[4], 10);
  const minutes = parseInt(match[5], 10);

  /* Temel aralık kontrolleri — Date constructor geçersiz değerlerde
     hata fırlatmak yerine "Invalid Date" döner, bu yüzden önceden kontrol ediyoruz */
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  /* Date oluştur — month 0-indexed olduğu için month - 1
     Neden UTC değil local time?
     → Tüm olaylar Ankara'da (UTC+3) aynı gün içinde gerçekleşiyor.
       Karşılaştırma için mutlak zaman yetersiz değil, göreli sıralama yeterli. */
  const date = new Date(year, month - 1, day, hours, minutes);

  /* Date'in geçerli olup olmadığını kontrol et
     (örn. 31 Şubat gibi geçersiz tarihler için) */
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  /* Date constructor'ın otomatik taşma düzeltmesini kontrol et.
     Örn: 31 Şubat → 3 Mart olarak düzeltilir. Biz bunu geçersiz sayıyoruz.
     Neden? → Veri tutarsızlığını sessizce kabul etmek yerine, açıkça reddetmek
     daha güvenli bir yaklaşım. */
  if (date.getDate() !== day || date.getMonth() !== month - 1) {
    return null;
  }

  return date;
}

/**
 * İki timestamp string'ini karşılaştırır — sıralama için kullanılır.
 * null/geçersiz değerler sona atılır.
 *
 * Neden ayrı bir comparator?
 * → Array.sort() için doğrudan kullanılabilecek bir fonksiyon sağlar.
 *   Her sıralama noktasında parse + null check tekrarını önler (DRY).
 *
 * @returns Negatif (a < b), 0 (eşit), pozitif (a > b)
 */
export function compareTimestamps(a: string, b: string): number {
  const dateA = parseTimestamp(a);
  const dateB = parseTimestamp(b);

  /* Her iki tarih de geçersizse eşit say,
     birisi geçersizse geçersizi sona at */
  if (!dateA && !dateB) return 0;
  if (!dateA) return 1;
  if (!dateB) return -1;

  return dateA.getTime() - dateB.getTime();
}
