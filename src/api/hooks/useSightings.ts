/**
 * ============================================================
 * useSightings — Görgü Tanığı Raporu Verisi Hook'u
 * ============================================================
 *
 * Podo'nun nerede, kiminle görüldüğünü çeker.
 * Son görülme kaydı (21:11, Ankara Kalesi) soruşturmanın en kritik noktası.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFormSubmissions } from '../jotformClient';
import { FORM_IDS } from '../config';
import type { Sighting } from '../../types';

export const SIGHTINGS_QUERY_KEY = ['submissions', 'sightings'] as const;

export function useSightings() {
  return useQuery({
    queryKey: SIGHTINGS_QUERY_KEY,
    queryFn: () => fetchFormSubmissions<Sighting>(FORM_IDS.sightings),
  });
}
