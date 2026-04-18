/**
 * ============================================================
 * useCheckins — Checkin Verisi Hook'u
 * ============================================================
 *
 * Neden her form için ayrı hook?
 * → Single Responsibility: Her hook yalnızca kendi formunun verisini yönetir.
 *   Bu sayede bir formun hatası diğerlerini etkilemez.
 *   Ayrıca component seviyesinde sadece ihtiyaç duyulan veri çekilebilir —
 *   tüm veriyi çekip filtrelemek yerine, gerekli hook'u kullanmak yeterli.
 *
 * React Query avantajları:
 * - Otomatik caching — aynı veri tekrar istenmez (staleTime boyunca)
 * - Loading/Error state yönetimi — manuel useState/useEffect gereksiz
 * - Retry mekanizması — main.tsx'te 2 retry olarak ayarlandı
 * - Deduplication — aynı anda birden fazla component isterse tek istek gider
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFormSubmissions } from '../jotformClient';
import { FORM_IDS } from '../config';
import type { Checkin } from '../../types';

/**
 * Query key sabiti — cache invalidation ve deduplication için benzersiz tanımlayıcı.
 * Neden dışarıda tanımlı?
 * → Birden fazla yerde (hook, invalidation, prefetch) kullanılabilir.
 *   Typo riskini ortadan kaldırır.
 */
export const CHECKINS_QUERY_KEY = ['submissions', 'checkins'] as const;

/**
 * Checkin form verilerini çeker ve cache'ler.
 *
 * @returns React Query result objesi — { data, isLoading, isError, error }
 */
export function useCheckins() {
  return useQuery({
    queryKey: CHECKINS_QUERY_KEY,
    queryFn: () => fetchFormSubmissions<Checkin>(FORM_IDS.checkins),
  });
}
