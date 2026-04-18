/**
 * ============================================================
 * useAnonymousTips — Anonim İhbar Verisi Hook'u
 * ============================================================
 *
 * Güvenilirliği değişen anonim ihbarları çeker.
 * confidence: 'high' olan ihbarlar soruşturma öncelikli.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFormSubmissions } from '../jotformClient';
import { FORM_IDS } from '../config';
import type { AnonymousTip } from '../../types';

export const ANONYMOUS_TIPS_QUERY_KEY = ['submissions', 'anonymousTips'] as const;

export function useAnonymousTips() {
  return useQuery({
    queryKey: ANONYMOUS_TIPS_QUERY_KEY,
    queryFn: () => fetchFormSubmissions<AnonymousTip>(FORM_IDS.anonymousTips),
  });
}
