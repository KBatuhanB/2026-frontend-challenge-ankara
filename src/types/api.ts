/**
 * ============================================================
 * Jotform API Yanıt Tipleri
 * ============================================================
 *
 * Neden ayrı API yanıt tipleri?
 * → Jotform API'nin döndürdüğü JSON yapısı, bizim uygulama tiplerinden farklıdır.
 *   API yanıtını uygulama tiplerine dönüştürme (normalizeSubmission) işlemi sırasında
 *   tip güvenliği sağlamak için ham API yapısını da tiplendiriyoruz.
 *   Bu sayede API yanıtı değişirse, TypeScript derleme zamanında bizi uyarır.
 */

/**
 * Jotform submission'ındaki tek bir cevap alanı.
 * API yanıtında her soru-cevap çifti bu yapıda gelir.
 *
 * Örnek:
 * ```json
 * { "name": "personName", "order": "2", "text": "Person Name", "answer": "Podo" }
 * ```
 */
export interface JotformAnswer {
  /** Alan adı — normalizeSubmission bunu flat object'in key'i olarak kullanır */
  readonly name: string;

  /** Sorunun sıra numarası */
  readonly order: string;

  /** Sorunun gösterim etiketi */
  readonly text: string;

  /**
   * Cevap değeri — string veya undefined olabilir.
   * Neden undefined kontrolü gerekli?
   * → Jotform'da boş bırakılan alanlar `answer` property'si olmadan gelebilir.
   *   Ayrıca bazı control type'lar (header, divider) cevap içermez.
   */
  readonly answer?: string;
}

/**
 * Jotform API'nin döndürdüğü tek bir submission (form gönderimi).
 */
export interface JotformSubmission {
  /** Submission'ın benzersiz ID'si — string formatında sayısal değer */
  readonly id: string;

  /** Form ID */
  readonly form_id: string;

  /** Gönderim durumu — "ACTIVE" veya diğer durumlar olabilir */
  readonly status: string;

  /** Gönderim tarihi — ISO formatında */
  readonly created_at: string;

  /**
   * Cevaplar — question ID'ye göre indexlenmiş obje.
   * Key: qid (string), Value: JotformAnswer
   *
   * Neden Record<string, JotformAnswer | undefined>?
   * → Bazı qid'ler silinmiş veya deaktif edilmiş olabilir.
   *   undefined kontrolü ile beklenmeyen boşluklar güvenle ele alınır.
   */
  readonly answers: Record<string, JotformAnswer | undefined>;
}

/**
 * Jotform API'nin ana yanıt zarfı (envelope).
 * Tüm Jotform API endpoint'leri bu yapıda yanıt döner.
 */
export interface JotformApiResponse {
  /** HTTP durum kodu — 200 = başarılı */
  readonly responseCode: number;

  /** Durum mesajı — genellikle "success" */
  readonly message: string;

  /** Submission dizisi — asıl veri buradadır */
  readonly content: readonly JotformSubmission[];

  /**
   * Sayfalama bilgisi.
   * Neden "result set" neden optional?
   * → Boş yanıtlarda veya hata durumlarında bu alan gelmeyebilir.
   */
  readonly 'result-set'?: {
    readonly offset: number;
    readonly limit: number;
    readonly count: number;
  };
}
