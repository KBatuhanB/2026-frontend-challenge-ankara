/**
 * ============================================================
 * API Konfigürasyon Sabitleri
 * ============================================================
 *
 * Neden merkezi bir config dosyası?
 * → API adresi, anahtarı ve form ID'leri tek bir noktada tanımlanır.
 *   Değişiklik gerektiğinde (örn. API key rotasyonu) sadece bu dosya güncellenir.
 *   "as const" kullanılmasının sebebi: TypeScript'in bu değerleri literal tip
 *   olarak algılamasını sağlamak — yanlış form ID girişini derleme zamanında yakalar.
 *
 * GÜVENLİK NOTU:
 * → Hackathon ortamında API key doğrudan kodda tutuluyor.
 *   Prodüksiyon ortamında bu değer .env dosyasından (import.meta.env.VITE_API_KEY)
 *   okunmalı ve .gitignore ile korunmalıdır.
 */

// Jotform REST API temel adresi
export const API_BASE = 'https://api.jotform.com' as const;

// Jotform API anahtarı — form submission'larını okuma yetkisi verir
export const API_KEY = '54a934fa20b1ccc3a5bd1d2076f90556' as const;

/**
 * Soruşturmadaki 5 veri kaynağının Jotform Form ID'leri.
 *
 * Her form farklı bir bilgi kategorisini temsil eder:
 * - checkins:      Etkinlik giriş kayıtları (kim, nerede, ne zaman)
 * - messages:      Kişiler arası mesajlar (gönderen, alıcı, aciliyet)
 * - sightings:     Görgü tanığı raporları (kim, kiminle, nerede görüldü)
 * - personalNotes: Kişisel notlar (yazar, bahsedilen kişiler)
 * - anonymousTips: Anonim ihbarlar (şüpheli, güvenilirlik seviyesi)
 */
export const FORM_IDS = {
  checkins:      '261065067494966',
  messages:      '261065765723966',
  sightings:     '261065244786967',
  personalNotes: '261065509008958',
  anonymousTips: '261065875889981',
} as const;

/**
 * Form ID → Kullanıcıya gösterilecek kategori başlıkları.
 * Neden ayrı bir map?
 * → UI'da gösterilecek etiketleri iş mantığından ayırır (SRP).
 *   Gelecekte i18n eklenirse sadece bu map güncellenir.
 */
export const FORM_LABELS: Record<string, string> = {
  [FORM_IDS.checkins]:      'Checkins',
  [FORM_IDS.messages]:      'Messages',
  [FORM_IDS.sightings]:     'Sightings',
  [FORM_IDS.personalNotes]: 'Personal Notes',
  [FORM_IDS.anonymousTips]: 'Anonymous Tips',
} as const;

/**
 * Form ID → Kategori emoji ikonları.
 * UI'da her kategorinin görsel olarak hızlıca ayırt edilmesini sağlar.
 */
export const FORM_ICONS: Record<string, string> = {
  [FORM_IDS.checkins]:      '📍',
  [FORM_IDS.messages]:      '💬',
  [FORM_IDS.sightings]:     '👁',
  [FORM_IDS.personalNotes]: '📝',
  [FORM_IDS.anonymousTips]: '🔍',
} as const;

/**
 * API istek limiti — tek seferde çekilecek maksimum submission sayısı.
 * Neden 1000?
 * → Jotform API varsayılan limiti 20'dir. Soruşturmada ~45 kayıt var,
 *   1000 limiti tüm verilerin tek istekte gelmesini garanti eder.
 */
export const API_SUBMISSION_LIMIT = 1000 as const;
