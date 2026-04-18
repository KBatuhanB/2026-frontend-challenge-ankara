/**
 * ============================================================
 * Jotform API İstemcisi
 * ============================================================
 *
 * Sorumluluklar (Single Responsibility):
 *   1. HTTP isteklerini oluştur ve gönder
 *   2. API yanıtını doğrula (response validation)
 *   3. Hataları anlamlı mesajlarla yakala ve yeniden fırlat
 *   4. Ham submission verisini uygulama tiplerine dönüştür
 *
 * Neden ayrı bir client modülü?
 * → API iletişim detaylarını (URL oluşturma, header, hata yönetimi)
 *   uygulama mantığından izole eder. Hook'lar sadece "veri getir" der,
 *   nasıl getirildiğini bilmek zorunda kalmaz (Abstraction).
 *   Test sırasında bu modül mock'lanarak gerçek API çağrısı yapılmadan
 *   hook'lar test edilebilir (Dependency Inversion).
 *
 * Güvenlik:
 * → API key query parametresinde gönderiliyor (Jotform'un beklentisi).
 *   Prodüksiyonda bu bir backend proxy arkasına alınmalı —
 *   client-side API key maruziyeti güvenlik riski oluşturur.
 *   Hackathon kapsamında kabul edilebilir.
 */

import { API_BASE, API_KEY, API_SUBMISSION_LIMIT } from './config';
import { normalizeSubmissions } from '../utils/normalizeSubmission';
import type { JotformApiResponse } from '../types';

/**
 * Özel API hata sınıfı — ağ hatalarını ve API hatalarını ayırt etmek için.
 *
 * Neden Error'ı extend ediyoruz?
 * → Standart Error stack trace ve message sağlar.
 *   Ek olarak statusCode ve formId bilgisi ekleyerek
 *   hata kaynağını detaylı tespit etmeyi sağlıyoruz.
 *   Bu, üst katmanlarda (UI) hatanın türüne göre farklı mesaj
 *   göstermeyi mümkün kılar (örn. 429 = rate limit, 401 = yetki hatası).
 */
export class JotformApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly formId: string,
  ) {
    super(message);
    /* Neden name ataması?
       → Error subclass'larında name default olarak "Error" kalır.
         Açıkça atama yapmazsak, console'da ve hata raporlarında
         hangi hata türü olduğu anlaşılmaz. */
    this.name = 'JotformApiError';
  }
}

/**
 * Belirli bir formun tüm submission'larını çeker ve normalize eder.
 *
 * @typeParam T - Hedef form tipi (Checkin, Message, Sighting, PersonalNote, AnonymousTip)
 * @param formId - Jotform Form ID'si (FORM_IDS sabitlerinden birisi)
 * @returns Normalize edilmiş submission dizisi — tip-güvenli
 *
 * @throws {JotformApiError} HTTP hatası veya API hata yanıtı durumunda
 * @throws {Error} Ağ bağlantı hatası veya beklenmeyen hata durumunda
 *
 * @example
 * ```ts
 * const checkins = await fetchFormSubmissions<Checkin>(FORM_IDS.checkins);
 * // checkins: Checkin[] — her biri normalize edilmiş flat obje
 * ```
 */
export async function fetchFormSubmissions<T>(formId: string): Promise<T[]> {
  /**
   * URL oluşturma — query parametreleri ile.
   * Neden URL template literal yerine URL constructor?
   * → URL constructor özel karakterleri otomatik encode eder,
   *   injection saldırılarını önler (OWASP: Injection Prevention).
   *   apiKey gibi değerlerin URL-safe olduğunu garanti eder.
   */
  const url = new URL(`/form/${formId}/submissions`, API_BASE);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('limit', String(API_SUBMISSION_LIMIT));

  /**
   * AbortController — istek zaman aşımı kontrolü.
   * Neden 15 saniye?
   * → Jotform API genelde 1-3 saniyede yanıt verir.
   *   15 saniye, yavaş ağ koşullarına tolerans tanırken
   *   sonsuz beklemeyi önler. React Query retry mekanizması
   *   zaman aşımı durumunda yeniden deneyecek.
   */
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        /* Accept header — API'nin JSON formatında yanıt vermesini garanti eder */
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    /* HTTP durum kodu kontrolü — 2xx dışı kodlar hata olarak ele alınır */
    if (!response.ok) {
      throw new JotformApiError(
        `Jotform API hatası: HTTP ${response.status} — ${response.statusText}`,
        response.status,
        formId,
      );
    }

    /**
     * JSON parse — tip assertion ile JotformApiResponse'a cast ediyoruz.
     * Neden as JotformApiResponse?
     * → fetch().json() any döner. Runtime validation (zod) eklenebilir
     *   ancak hackathon kapsamında API'nin tutarlı yapıda döndüğüne güveniyoruz.
     */
    const data = (await response.json()) as JotformApiResponse;

    /**
     * API seviyesi hata kontrolü — HTTP 200 olsa bile API kendi hata
     * yanıtını döndürebilir (responseCode !== 200).
     * Örnek: Geçersiz formId → HTTP 200 ama responseCode: 401
     */
    if (data.responseCode !== 200) {
      throw new JotformApiError(
        `Jotform API yanıt hatası: ${data.message}`,
        data.responseCode,
        formId,
      );
    }

    /**
     * Boş yanıt kontrolü — content alanı yoksa veya boş diziyse
     * boş dizi döndür (null yerine boş dizi → null check gereksiz olur).
     */
    if (!data.content || !Array.isArray(data.content)) {
      return [];
    }

    /* Ham submission verisini uygulama tipine normalize et */
    return normalizeSubmissions<T>(data.content);

  } catch (error: unknown) {
    /**
     * AbortError — zaman aşımı durumunda özel hata mesajı.
     * Neden ayrı yakalıyoruz?
     * → Kullanıcıya "bağlantı kesildi" yerine "zaman aşımı" demek
     *   daha açıklayıcı ve çözüm yönlendirici.
     */
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new JotformApiError(
        `API isteği zaman aşımına uğradı (15s) — formId: ${formId}`,
        408,
        formId,
      );
    }

    /* Kendi fırlattığımız JotformApiError'ları olduğu gibi ilet */
    if (error instanceof JotformApiError) {
      throw error;
    }

    /**
     * Beklenmeyen hatalar — ağ kesintisi, DNS hatası vb.
     * Error instance kontrolü ile mesajı koruyoruz.
     */
    if (error instanceof Error) {
      throw new JotformApiError(
        `Ağ hatası: ${error.message}`,
        0,
        formId,
      );
    }

    /* Bilinmeyen hata tipi — son çare, olmaması gereken durum */
    throw new JotformApiError(
      'Bilinmeyen bir hata oluştu',
      0,
      formId,
    );
  } finally {
    /* Timeout'u temizle — bellek sızıntısını önler.
       try/catch/finally kalıbı ile her durumda çalışması garanti. */
    clearTimeout(timeoutId);
  }
}
