/**
 * InvestigationPage — Ana soruşturma sayfası.
 *
 * FAZ 4 entegrasyonu:
 * → FilterContext global arama/filtre durumunu yönetir.
 *   applyFilters ile filtrelenmiş veri kategorilere aktarılır.
 *   Kayıt tıklaması → RecordDetailModal, kişi tıklaması → PersonDetailModal.
 *   buildPersonProfiles ile kişi profilleri oluşturulur (PersonDetailModal için).
 *
 * Modal yönetimi:
 * → İki modal state'i: selectedRecord ve selectedPerson.
 *   Her ikisi de null → modal kapalı. Değer atanınca modal açılır.
 *   Birinden diğerine geçiş mümkün (RecordDetail → PersonDetail → RecordDetail).
 */
import { useState, useMemo, useCallback } from 'react';
import { useAllData } from '../../../api/hooks';
import { useFilter } from '../../../context/FilterContext';
import { applyFilters, extractUniqueLocations } from '../../../utils/filterRecords';
import type { FilterableData } from '../../../utils/filterRecords';
import { buildPersonProfiles } from '../../../utils/buildPersonProfiles';
import { normalizeName } from '../../../utils/normalizeName';
import { DashboardLayout } from '../../templates/DashboardLayout/DashboardLayout';
import { CategoryAccordion } from '../../organisms/CategoryAccordion/CategoryAccordion';
import { RecordDetailModal } from '../../organisms/RecordDetailModal/RecordDetailModal';
import { PersonDetailModal } from '../../organisms/PersonDetailModal/PersonDetailModal';
import { Timeline } from '../../organisms/Timeline/Timeline';
import { SuspicionPanel } from '../../organisms/SuspicionPanel/SuspicionPanel';
import { MapView } from '../../organisms/MapView/MapView';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { ErrorMessage } from '../../atoms/ErrorMessage/ErrorMessage';
import type { BaseRecord, RecordType } from '../../../types';
import type { Person } from '../../../types/person';
import type { FilterOption } from '../../molecules/FilterBar/FilterBar';
import styles from './InvestigationPage.module.css';

/**
 * Kategori konfigürasyonu — her form kaynağı için display bilgileri.
 * Yeni form eklemek: hook'a query + bu diziye satır ekle (OCP).
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

/** Modal state — seçili kayıt veya kişi */
interface SelectedRecord {
  readonly record: BaseRecord;
  readonly type: RecordType;
}

type DataMap = Record<string, readonly BaseRecord[]>;

export function InvestigationPage() {
  const { isLoading, isError, error, ...data } = useAllData();
  const { state: filterState, setSearch, toggleSource } = useFilter();

  /* Modal state */
  const [selectedRecord, setSelectedRecord] = useState<SelectedRecord | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  /**
   * Tüm veriyi FilterableData formatına dönüştür — applyFilters ve ilişkili kayıt
   * hesaplaması için kullanılır. Memoize: data değişmedikçe aynı referans.
   */
  const allData = useMemo<FilterableData>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  /**
   * Filtrelenmiş veri — FilterContext state'i değiştikçe yeniden hesaplanır.
   * applyFilters O(n) — 45 kayıt için ihmal edilebilir maliyet.
   */
  const filteredData = useMemo(() => applyFilters(allData, filterState), [allData, filterState]);

  /** Filtrelenmiş veriyi key-based erişime dönüştür */
  const dataMap = useMemo<DataMap>(() => ({
    checkins: filteredData.checkins,
    messages: filteredData.messages,
    sightings: filteredData.sightings,
    personalNotes: filteredData.personalNotes,
    anonymousTips: filteredData.anonymousTips,
  }), [filteredData]);

  /** Kişi profilleri — PersonDetailModal için */
  const personProfiles = useMemo(
    () => buildPersonProfiles(allData),
    [allData],
  );

  /** Benzersiz lokasyonlar — FilterBar için */
  const uniqueLocations = useMemo(() => extractUniqueLocations(allData), [allData]);

  /**
   * FilterBar seçenekleri — kaynak filtreleri.
   * Neden source filtreleri burada?
   * → Lokasyon filtreleri veriye bağlı (dynamik), kaynak filtreleri sabit.
   *   İkisini birleştirip FilterBar'a aktarıyoruz.
   */
  const filterOptions = useMemo<FilterOption[]>(() => {
    const sources: FilterOption[] = CATEGORIES.map((c) => ({
      key: `source:${c.key}`,
      label: c.title,
      active: filterState.selectedSources.includes(c.key),
    }));

    const locations: FilterOption[] = uniqueLocations.map((loc) => ({
      key: `location:${loc}`,
      label: loc,
      active: filterState.selectedLocations.includes(loc),
    }));

    return [...sources, ...locations];
  }, [filterState.selectedSources, filterState.selectedLocations, uniqueLocations]);

  /** Filtre toggle handler — prefix'e göre source veya location toggle */
  const handleFilterToggle = useCallback((key: string) => {
    if (key.startsWith('source:')) {
      toggleSource(key.replace('source:', ''));
    }
    /* Lokasyon filtreleri gelecek FAZ'da eklenebilir — şimdilik kaynak yeterli */
  }, [toggleSource]);

  /** Kayıt tıklama → RecordDetailModal aç */
  const handleRecordClick = useCallback((record: BaseRecord, type: RecordType) => {
    setSelectedRecord({ record, type });
  }, []);

  /** Kişi tıklama → PersonDetailModal aç */
  const handlePersonClick = useCallback((personName: string) => {
    const normalized = normalizeName(personName);
    const person = personProfiles.find((p) => p.normalizedName === normalized);
    if (person) {
      setSelectedPerson(person);
    }
  }, [personProfiles]);

  /** Modal kapama */
  const handleCloseRecord = useCallback(() => setSelectedRecord(null), []);
  const handleClosePerson = useCallback(() => setSelectedPerson(null), []);

  /** PersonDetail → RecordDetail geçişi */
  const handlePersonRecordClick = useCallback((record: BaseRecord, type: RecordType) => {
    setSelectedPerson(null);
    setSelectedRecord({ record, type });
  }, []);

  /* Loading durumu */
  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" />
        <p className={styles.stateText}>Soruşturma dosyaları yükleniyor...</p>
      </div>
    );
  }

  /* Hata durumu */
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
        searchValue: filterState.searchQuery,
        onSearchChange: setSearch,
        filters: filterOptions,
        onFilterToggle: handleFilterToggle,
      }}
    >
      {/* ─── FAZ 5: Bonus Bölümler ─── */}
      <SuspicionPanel data={allData} />

      <div className={styles.bonusGrid}>
        <Timeline data={allData} />
        <MapView data={allData} />
      </div>

      {/* ─── Kategori Accordion'ları ─── */}
      <div className={styles.categories}>
        {CATEGORIES.map((category, index) => (
          <CategoryAccordion
            key={category.key}
            title={category.title}
            records={dataMap[category.key] ?? []}
            recordType={category.recordType}
            accentColor={category.accentColor}
            defaultOpen={index === 0}
            onRecordClick={handleRecordClick}
          />
        ))}
      </div>

      {/* Kayıt Detay Modal */}
      <RecordDetailModal
        record={selectedRecord?.record ?? null}
        recordType={selectedRecord?.type ?? null}
        onClose={handleCloseRecord}
        onPersonClick={handlePersonClick}
        allData={allData}
      />

      {/* Kişi Profil Modal */}
      <PersonDetailModal
        person={selectedPerson}
        onClose={handleClosePerson}
        onRecordClick={handlePersonRecordClick}
      />
    </DashboardLayout>
  );
}
