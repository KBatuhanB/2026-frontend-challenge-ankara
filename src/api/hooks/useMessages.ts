/**
 * ============================================================
 * useMessages — Mesaj Verisi Hook'u
 * ============================================================
 *
 * Kişiler arası mesajları çeker. Urgency seviyesi (low/medium/high)
 * soruşturma açısından kritik filtreleme kriteri.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFormSubmissions } from '../jotformClient';
import { FORM_IDS } from '../config';
import type { Message } from '../../types';

export const MESSAGES_QUERY_KEY = ['submissions', 'messages'] as const;

export function useMessages() {
  return useQuery({
    queryKey: MESSAGES_QUERY_KEY,
    queryFn: () => fetchFormSubmissions<Message>(FORM_IDS.messages),
  });
}
