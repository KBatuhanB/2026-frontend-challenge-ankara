/**
 * RecordsPage — Dedektif Ağı / Investigation Board sayfası.
 *
 * Artık accordion değil — interaktif bir knowledge graph.
 * Root node → 5 kategori → kayıtlar. Collapsible tree mantığı.
 * InvestigationBoard tüm ağaç mantığını, modalları ve layout'u yönetir.
 */
import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAllData } from '../../../api/hooks';
import { InvestigationBoard } from '../../organisms/InvestigationBoard/InvestigationBoard';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorMessage } from '../../atoms/ErrorMessage/ErrorMessage';
import type { FilterableData } from '../../../utils/filterRecords';
import styles from './RecordsPage.module.css';

export function RecordsPage() {
  const { isLoading, isError, error, ...data } = useAllData();
  const queryClient = useQueryClient();

  const allData = useMemo<FilterableData>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" />
        <p className={styles.stateText}>Soruşturma ağı hazırlanıyor...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={styles.stateContainer}>
        <ErrorMessage
          message={error?.message ?? 'Veriler yüklenirken bir hata oluştu.'}
          onRetry={() => void queryClient.invalidateQueries()}
        />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <InvestigationBoard data={allData} />
    </div>
  );
}
