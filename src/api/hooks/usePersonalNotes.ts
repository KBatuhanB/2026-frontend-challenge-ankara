/**
 * ============================================================
 * usePersonalNotes — Kişisel Not Verisi Hook'u
 * ============================================================
 *
 * Karakterlerin kendi gözlem notlarını çeker.
 * mentionedPeople alanı kişiler arası bağlantı kurmak için kullanılır.
 */
import { useQuery } from '@tanstack/react-query';
import { fetchFormSubmissions } from '../jotformClient';
import { FORM_IDS } from '../config';
import type { PersonalNote } from '../../types';

export const PERSONAL_NOTES_QUERY_KEY = ['submissions', 'personalNotes'] as const;

export function usePersonalNotes() {
  return useQuery({
    queryKey: PERSONAL_NOTES_QUERY_KEY,
    queryFn: () => fetchFormSubmissions<PersonalNote>(FORM_IDS.personalNotes),
  });
}
