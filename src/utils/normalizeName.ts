/**
 * ============================================================
 * İsim Normalizasyon Fonksiyonu
 * ============================================================
 *
 * Neden bu fonksiyon gerekli?
 * → Jotform verilerinde aynı kişi farklı yazımlarla geçebiliyor:
 *   "Kağan", "Kagan", "Kağan A." → hepsi aynı kişi.
 *   Bu fonksiyon tüm isimleri tutarlı bir formata dönüştürerek
 *   kişi bazlı eşleştirmeyi (linking) mümkün kılar.
 *
 * Algoritma:
 *   1. Boş/null girdi kontrolü → boş string döndür (fail-safe)
 *   2. Küçük harfe çevir (case-insensitive karşılaştırma için)
 *   3. Türkçe özel karakterleri ASCII karşılıklarına dönüştür
 *   4. Trailing initial/nokta kaldır ("Kağan A." → "Kağan")
 *   5. Birden fazla boşluğu tek boşluğa indir + trim
 *
 * Performans: O(n) — string uzunluğuyla doğrusal, her kayıt için bir kez çağrılır.
 *
 * Edge case'ler:
 *   - null/undefined → ""
 *   - "  " (sadece boşluk) → ""
 *   - "Kağan A." → "kagan"
 *   - "GÜLŞAH" → "gulsah"
 *   - "a" (tek karakter) → "a"
 */

/**
 * Türkçe karakterleri ASCII karşılıklarına dönüştürme haritası.
 * Neden Map değil de Record?
 * → Statik, küçük boyutlu ve derleme zamanında bilinen key seti —
 *   Record burada yeterli ve okunabilirliği daha yüksek.
 */
const TURKISH_CHAR_MAP: Readonly<Record<string, string>> = {
  'ğ': 'g',
  'ü': 'u',
  'ş': 's',
  'ı': 'i',
  'ö': 'o',
  'ç': 'c',
  'â': 'a',
  'î': 'i',
  'û': 'u',
} as const;

/**
 * Trailing initial kalıbı — "isim X." veya "isim X" formatını yakalar.
 * Neden bu regex?
 * → Veri setinde "Kağan A." gibi kayıtlar var. Sonundaki " A." veya " A"
 *   kısmı bir soyadı baş harfi — kişi eşleştirmesinde gürültü yaratır.
 *
 * Regex açıklama:
 *   \s+       → bir veya daha fazla boşluk
 *   [a-z]     → tek bir küçük harf (lowercase yapıldıktan sonra)
 *   \.?       → opsiyonel nokta
 *   $         → string sonu
 */
const TRAILING_INITIAL_REGEX = /\s+[a-z]\.?$/;

/**
 * Verilen ismi normalize ederek karşılaştırma için standart forma dönüştürür.
 *
 * @param name - Ham isim string'i (API'den gelen haliyle)
 * @returns Normalize edilmiş küçük harf ASCII string — eşleştirme anahtarı olarak kullanılır
 *
 * @example
 * normalizeName("Kağan")    // → "kagan"
 * normalizeName("Kagan")    // → "kagan"
 * normalizeName("Kağan A.") // → "kagan"
 * normalizeName("GÜLŞAH")   // → "gulsah"
 * normalizeName("")          // → ""
 * normalizeName(null)        // → ""
 */
export function normalizeName(name: string | null | undefined): string {
  /* Boş/null girdi kontrolü — defensive programming:
     API'den beklenmeyen null değerler gelebilir */
  if (!name || typeof name !== 'string') {
    return '';
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return '';
  }

  /* Adım 1: Küçük harfe çevir — case-insensitive karşılaştırma temeli */
  let normalized = trimmed.toLowerCase();

  /* Adım 2: Türkçe karakterleri ASCII'ye dönüştür
     Neden char-by-char replace? → String.replace(regex) ile tüm Türkçe
     karakterleri tek geçişte yakalamak mümkün, ancak okunabilirlik açısından
     map tabanlı yaklaşım daha açık ve bakımı daha kolay. */
  normalized = normalized
    .split('')
    .map((char) => TURKISH_CHAR_MAP[char] ?? char)
    .join('');

  /* Adım 3: Trailing initial kaldır ("kagan a." → "kagan")
     Neden sondaki harfler kaldırılıyor?
     → Veride "Kağan A." gibi kayıtlar var — "A." bir soyadı baş harfi.
       Bu veri gürültüsünü temizleyerek aynı kişinin tüm kayıtlarını eşleştiriyoruz. */
  normalized = normalized.replace(TRAILING_INITIAL_REGEX, '');

  /* Adım 4: Birden fazla boşluğu tek boşluğa indir ve trim uygula
     → Normalize sonrası oluşabilecek çift boşlukları temizler */
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}
