/**
 * InvestigationPage — Ana soruşturma sayfası.
 *
 * Neden tüm veri çekimi burada?
 * → Single Responsibility: Bu sayfa "soruşturma verisini göster" sorumluluğunu taşır.
 *   useAllData hook'u veri katmanını kapsüller, sayfa sadece sunum yapar.
 *   Loading/error/data durumları burada yönetilir — alt bileşenler
 *   sadece hazır veri alır.
 *
 * FAZ 3 kapsamı:
 * → SearchBar görsel olarak mevcut ancak henüz veri filtrelemiyor.
 *   FAZ 4'te FilterContext eklenince, arama ve filtre fonksiyonel olacak.
 *
 * Kategori konfigürasyonu:
 * → Her form türü için başlık, renk, recordType ve veri eşleştirmesi
 *   tek bir dizi olarak tanımlanır — yeni form eklemek tek satırlık iş.
 */
import { useState, useMemo } from 'react';
import { useAllData } from '../../../api/hooks';
import { DashboardLayout } from '../../templates/DashboardLayout/DashboardLayout';
import { CategoryAccordion } from '../../organisms/CategoryAccordion/CategoryAccordion';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorMessage } from '../../atoms/ErrorMessage/ErrorMessage';
import type { BaseRecord, RecordType } from '../../../types';
import styles from './InvestigationPage.module.css';

/**
 * Kategori konfigürasyonu — her form kaynağı için display bilgileri.
 *
 * Neden sabit dizi?
 * → Render sırasında .map ile iterate edilir. Yeni form eklemek:
 *   1. Hook'a yeni query ekle
 *   2. Bu diziye yeni satır ekle
 *   Başka dosyaya dokunmaya gerek yok (OCP).
 */
interface CategoryConfig {
  readonly key: string;
  readonly title: string;
  readonly recordType: RecordType;
  readonly accentColor: string;
}

const CATEGORIES: readonly CategoryConfig[] = [
  { key: 'checkins', title: 'Checkins', recordType: 'checkin', accentColor: 'var(--category-checkins)' },
  { key: 'messages', title: 'Messages', recordType: 'message', accentColor: 'var(--category-messages)' },
  { key: 'sightings', title: 'Sightings', recordType: 'sighting', accentColor: 'var(--category-sightings)' },
  { key: 'personalNotes', title: 'Personal Notes', recordType: 'personalNote', accentColor: 'var(--category-notes)' },
  { key: 'anonymousTips', title: 'Anonymous Tips', recordType: 'anonymousTip', accentColor: 'var(--category-tips)' },
] as const;

/**
 * AllData hook'unun döndürdüğü veriye güvenli erişim.
 * Neden Record<string, readonly BaseRecord[]>?
 * → CATEGORIES dizisindeki key ile veri eşleştirmesi yapılır.
 *   AllData interface'i readonly diziler döner, BaseRecord tüm tiplerin atasıdır.
 */
type DataMap = Record<string, readonly BaseRecord[]>;

export function InvestigationPage() {
  const { isLoading, isError, error, ...data } = useAllData();

  /* FAZ 3: Arama değeri local state — FAZ 4'te FilterContext'e taşınacak */
  const [searchValue, setSearchValue] = useState('');

  /**
   * Hook verisini key-based erişim yapısına dönüştür.
   * useAllData dönüşü: { checkins, messages, sightings, personalNotes, anonymousTips }
   * Bu obje doğrudan CATEGORIES[n].key ile indexlenebilir.
   */
  const dataMap = useMemo<DataMap>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  /* Loading durumu — merkezileştirilmiş spinner */
  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" />
        <p className={styles.stateText}>Soruşturma dosyaları yükleniyor...</p>
      </div>
    );
  }

  /* Hata durumu — tekrar dene butonu ile */
  if (isError) {
    return (
      <div className={styles.stateContainer}>
        <ErrorMessage
          message={
            error?.message ??
            'Veriler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
          }
        />
      </div>
    );
  }

  return (
    <DashboardLayout
      searchBarProps={{
        searchValue,
        onSearchChange: setSearchValue,
        /* FAZ 4'te FilterContext bağlantısı eklenecek */
      }}
    >
      <div className={styles.categories}>
        {CATEGORIES.map((category, index) => (
          <CategoryAccordion
            key={category.key}
            title={category.title}
            records={dataMap[category.key] ?? []}
            recordType={category.recordType}
            accentColor={category.accentColor}
            defaultOpen={index === 0}
          />
        ))}
      </div>
    </DashboardLayout>
  );
}
