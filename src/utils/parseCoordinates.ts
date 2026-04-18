/**
 * ============================================================
 * Koordinat Parse Fonksiyonu
 * ============================================================
 *
 * Neden bu fonksiyon?
 * → Jotform'dan gelen koordinatlar "39.93159,32.84967" formatında tek string.
 *   Leaflet harita kütüphanesi ise ayrı lat/lon sayısal değerler bekler.
 *   Bu fonksiyon dönüşümü tek noktada yapar (SRP).
 *
 * Edge case'ler:
 *   - Boş string → null (haritada gösterilmez)
 *   - Geçersiz sayı → null
 *   - Eksik virgül → null
 *   - Ekstra boşluk → handle edilir (trim)
 *   - Geçersiz lat/lon aralığı → null (lat: -90..90, lon: -180..180)
 *
 * Performans: O(1) — sabit zaman, her kayıt için bir kez çağrılır.
 */

/**
 * Parse edilmiş GPS koordinat yapısı.
 * Neden ayrı bir interface?
 * → Leaflet'in LatLng tipinden bağımsız tutarak kütüphane bağımlılığını önlüyoruz.
 *   Dönüşüm Leaflet tarafında yapılır — bu katman sadece veri parse'lar.
 */
export interface Coordinates {
  readonly lat: number;
  readonly lon: number;
}

/**
 * "lat,lon" formatındaki string'i sayısal koordinatlara dönüştürür.
 *
 * @param coordString - "39.93159,32.84967" formatında koordinat string'i
 * @returns Koordinat objesi veya geçersiz girdi durumunda null
 *
 * @example
 * parseCoordinates("39.93159,32.84967") // → { lat: 39.93159, lon: 32.84967 }
 * parseCoordinates("")                   // → null
 * parseCoordinates("invalid")            // → null
 * parseCoordinates("999,999")            // → null (geçersiz aralık)
 */
export function parseCoordinates(coordString: string | null | undefined): Coordinates | null {
  /* Null/undefined/boş string kontrolü — API'den boş gelebilir */
  if (!coordString || typeof coordString !== 'string') {
    return null;
  }

  const trimmed = coordString.trim();
  if (trimmed.length === 0) {
    return null;
  }

  /* Virgülle ayır — tam olarak 2 parça bekleniyor (lat ve lon) */
  const parts = trimmed.split(',');
  if (parts.length !== 2) {
    return null;
  }

  /* Sayısal dönüşüm — parseFloat NaN dönebilir, kontrol gerekli */
  const lat = parseFloat(parts[0].trim());
  const lon = parseFloat(parts[1].trim());

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  /* Geçerli coğrafi aralık kontrolü — geçersiz değerlerin haritaya gitmesini önler.
     Lat: -90 ile 90 arası, Lon: -180 ile 180 arası.
     Ankara koordinatları ~39.9, ~32.8 civarında — bu aralıkta olması beklenir. */
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return null;
  }

  return { lat, lon };
}
