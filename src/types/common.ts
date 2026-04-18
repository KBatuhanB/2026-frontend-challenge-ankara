/**
 * ============================================================
 * Ortak Kayıt Tipi (Base Record)
 * ============================================================
 *
 * Neden bir base tip?
 * → 5 formun hepsinde tekrarlayan alanlar var: id, timestamp, location, coordinates.
 *   Bu ortak yapıyı burada tanımlayarak DRY prensibine uyuyoruz.
 *   Tüm form tipleri bu interface'i extend eder — böylece ortak alanlar
 *   üzerinden çalışan fonksiyonlar (sıralama, gruplama, filtreleme)
 *   tek bir tip üzerinden yazılabilir.
 *
 * readonly kullanımının sebebi:
 * → Veri katmanından gelen nesneler immutable olmalı. UI bileşenleri
 *   bu verileri doğrudan değiştirmemeli, yeni nesneler oluşturmalı.
 *   Bu, beklenmeyen yan etkileri (side effects) derleme zamanında önler.
 */
export interface BaseRecord {
  /** Jotform submission ID — her kayıt için benzersiz tanımlayıcı */
  readonly id: string;

  /**
   * Olayın gerçekleştiği zaman — "DD-MM-YYYY HH:mm" formatında ham string.
   * Neden Date değil?
   * → API'den string geldiği için, parse işlemi utility fonksiyonuna bırakılır.
   *   Bu sayede tip dönüşüm sorumluluğu tek bir noktada kalır (SRP).
   */
  readonly timestamp: string;

  /** Olayın gerçekleştiği mekan adı (örn. "Ankara Kalesi", "CerModern") */
  readonly location: string;

  /**
   * Mekanın GPS koordinatları — "lat,lon" formatında string.
   * Örnek: "39.93159,32.84967"
   * Parse işlemi parseCoordinates utility'sine bırakılır.
   */
  readonly coordinates: string;
}

/**
 * Urgency seviyesi — mesajların aciliyet derecesi.
 * Union type kullanılmasının sebebi: enum yerine string literal union
 * daha hafiftir ve tree-shaking'e uygundur.
 */
export type UrgencyLevel = 'low' | 'medium' | 'high';

/**
 * Confidence seviyesi — anonim ihbarların güvenilirlik derecesi.
 */
export type ConfidenceLevel = 'low' | 'medium' | 'high';
