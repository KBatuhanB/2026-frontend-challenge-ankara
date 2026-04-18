/**
 * TimelinePage — Podo'nun kronolojik rotası ve şüphe analizi sayfası.
 *
 * Neden ayrı sayfa?
 * → InvestigationPage'den ayrıştırıldı. Timeline ve SuspicionPanel
 *   birlikte anlam taşıyor: "Ne oldu?" + "Kim şüpheli?".
 *   Tam sayfa olarak daha fazla alan — timeline rahat okunur.
 *
 * Mimari:
 * → AceternityTimeline UI bileşeni (scroll-beam + sticky header) kullanılır.
 *   buildPodoTimeline utility'sinden gelen TimelineEvent[] verisi,
 *   her olay için zengin JSX content'e dönüştürülür.
 *   SuspicionPanel sayfanın üstünde — "özet" → "detay" akışı.
 *
 * Veri dönüşümü:
 *   TimelineEvent[] → TimelineEntry[] (Aceternity formatı)
 *   Her event için: title = "HH:mm", content = lokasyon + açıklama + badge'ler
 *   Son olay "SON GÖRÜLME" vurgusu + "KAYIP" ghost entry eklenir.
 */
import { useMemo } from 'react';
import { useAllData } from '../../../api/hooks';
import { AceternityTimeline, type TimelineEntry } from '../../ui/AceternityTimeline/AceternityTimeline';
import { SuspicionPanel } from '../../organisms/SuspicionPanel/SuspicionPanel';
import { Spinner } from '../../atoms/Spinner/Spinner';
import { EmptyState } from '../../atoms/EmptyState/EmptyState';
import { buildPodoTimeline, type TimelineEvent } from '../../../utils/buildPodoTimeline';
import type { FilterableData } from '../../../utils/filterRecords';
import type { RecordType } from '../../../types';
import styles from './TimelinePage.module.css';

/* ─── Kaynak tipi → ikon ve etiket eşleştirmesi ─── */
const SOURCE_META: Record<RecordType, { icon: string; label: string; colorClass: string }> = {
  checkin:       { icon: '📍', label: 'Check-in',       colorClass: 'sourceCheckin' },
  message:       { icon: '💬', label: 'Message',        colorClass: 'sourceMessage' },
  sighting:      { icon: '👁',  label: 'Sighting',       colorClass: 'sourceSighting' },
  personalNote:  { icon: '📝', label: 'Personal Note',  colorClass: 'sourceNote' },
  anonymousTip:  { icon: '🔍', label: 'Anonymous Tip',  colorClass: 'sourceTip' },
};

/**
 * Tek bir TimelineEvent'i Aceternity TimelineEntry formatına dönüştürür.
 *
 * Neden ayrı fonksiyon?
 * → JSX oluşturma mantığı render fonksiyonundan ayrılmalı (SRP).
 *   Her event için zengin içerik: lokasyon kartı, açıklama, kaynak badge'i.
 *   isHighlight durumunda ek görsel vurgu eklenir.
 *
 * @param event - buildPodoTimeline'dan gelen tek olay
 * @param isLast - Son olay mı? → "SON GÖRÜLME" etiketi
 */
function eventToEntry(event: TimelineEvent, isLast: boolean): TimelineEntry {
  const meta = SOURCE_META[event.sourceType];

  return {
    title: event.time || '??:??',
    isHighlight: event.isHighlight,
    content: (
      <div className={styles.eventCard}>
        {/* Kaynak tipi badge'i */}
        <div className={styles.eventBadgeRow}>
          <span className={`${styles.eventBadge} ${styles[meta.colorClass]}`}>
            {meta.icon} {meta.label}
          </span>
          {/* Kritik olay → uyarı badge'i */}
          {event.isHighlight && (
            <span className={styles.alertBadge}>
              ⚠ {isLast ? 'SON GÖRÜLME' : 'HIGH'}
            </span>
          )}
        </div>

        {/* Lokasyon kartı */}
        <div className={styles.locationRow}>
          <span className={styles.locationIcon}>📍</span>
          <span className={styles.locationText}>{event.location}</span>
        </div>

        {/* Olay açıklaması */}
        <p className={styles.eventDescription}>{event.description}</p>

        {/* Koordinat bilgisi — varsa göster */}
        {event.coordinates && event.coordinates !== '' && (
          <span className={styles.coordText}>
            🌐 {event.coordinates}
          </span>
        )}
      </div>
    ),
  };
}

export function TimelinePage() {
  const { isLoading, ...data } = useAllData();

  /* Tüm form verilerini FilterableData formatında hazırla */
  const allData = useMemo<FilterableData>(() => ({
    checkins: data.checkins,
    messages: data.messages,
    sightings: data.sightings,
    personalNotes: data.personalNotes,
    anonymousTips: data.anonymousTips,
  }), [data.checkins, data.messages, data.sightings, data.personalNotes, data.anonymousTips]);

  /**
   * Podo'nun timeline olaylarını hesapla → Aceternity entry formatına dönüştür.
   *
   * Dönüşüm zinciri:
   *   FilterableData → TimelineEvent[] (buildPodoTimeline)
   *   → TimelineEntry[] (eventToEntry) + "KAYIP" ghost entry
   *
   * Son eleman olarak "KAYIP" girişi eklenir — soruşturma dramatikliği.
   * useMemo ile memoize — veri değişmedikçe yeniden hesaplanmaz.
   */
  const timelineEntries = useMemo<TimelineEntry[]>(() => {
    const events = buildPodoTimeline(allData);
    if (events.length === 0) return [];

    /* Her TimelineEvent'i Aceternity entry'ye dönüştür */
    const entries = events.map((evt, i) =>
      eventToEntry(evt, i === events.length - 1)
    );

    /* "KAYIP" ghost entry — timeline'ın dramatik sonu */
    entries.push({
      title: '???',
      isHighlight: true,
      content: (
        <div className={styles.missingCard}>
          <div className={styles.missingIcon}>✕</div>
          <div className={styles.missingContent}>
            <h4 className={styles.missingTitle}>KAYIP</h4>
            <p className={styles.missingDesc}>
              Podo bu noktadan sonra görülmedi. Soruşturma devam ediyor...
            </p>
          </div>
        </div>
      ),
    });

    return entries;
  }, [allData]);

  /* ─── Loading state ─── */
  if (isLoading) {
    return (
      <div className={styles.stateContainer}>
        <Spinner size="lg" />
        <p className={styles.stateText}>Zaman çizelgesi hazırlanıyor...</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        {/* Sayfa Başlığı */}
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Podo's Timeline</h1>
          <p className={styles.pageDesc}>
            Kronolojik olay sırası ve şüphe analizi — Podo'nun izini takip edin.
          </p>
        </div>

        {/* Şüphe Analiz Kartları */}
        <section className={styles.suspicionSection}>
          <SuspicionPanel data={allData} />
        </section>

        {/* Kronolojik Aceternity Timeline */}
        <section className={styles.timelineSection}>
          {timelineEntries.length > 0 ? (
            <AceternityTimeline data={timelineEntries} />
          ) : (
            <EmptyState message="Podo ile ilgili zaman çizelgesi verisi bulunamadı." />
          )}
        </section>
      </div>
    </div>
  );
}
