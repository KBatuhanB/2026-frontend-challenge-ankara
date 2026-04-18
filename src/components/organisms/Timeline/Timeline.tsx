/**
 * Timeline — Podo'nun kronolojik rota görselleştirmesi.
 *
 * Neden organism?
 * → buildPodoTimeline utility'sinden gelen domain verisini (TimelineEvent[])
 *   presentation'a dönüştürür. TimelineEntry molecule'lerini listeler.
 *   Domain mantığı (sıralama, filtreleme) utility'de, sunum burada (SRP).
 *
 * Görsel konsept:
 * → Dikey timeline — sol tarafta bağlantı çizgisi + nokta track'i,
 *   sağ tarafta zaman + lokasyon + açıklama.
 *   Son olay kırmızı vurguyla gösterilir.
 *   Timeline sonunda "KAYIP" marker'ı — dramatik soruşturma hissi.
 *
 * Erişilebilirlik:
 * → Semantik <ol> listesi, role="list", aria-label.
 *   Her olay <li> içinde — screen reader'lar sırayı anlar.
 */
import { useMemo } from 'react';
import { TimelineEntry } from '../../molecules/TimelineEntry/TimelineEntry';
import { EmptyState } from '../../atoms/EmptyState/EmptyState';
import { buildPodoTimeline, type TimelineEvent } from '../../../utils/buildPodoTimeline';
import type { FilterableData } from '../../../utils/filterRecords';
import styles from './Timeline.module.css';

export interface TimelineProps {
  /** Tüm form verileri — timeline hesaplaması için */
  readonly data: FilterableData;
}

export function Timeline({ data }: TimelineProps) {
  /**
   * Timeline olaylarını hesapla — veri değişmedikçe aynı referans.
   * buildPodoTimeline O(n log n), ~45 kayıt için ihmal edilebilir.
   */
  const events = useMemo(() => buildPodoTimeline(data), [data]);

  if (events.length === 0) {
    return <EmptyState message="Podo ile ilgili zaman çizelgesi verisi bulunamadı." />;
  }

  return (
    <section className={styles.container} aria-label="Podo'nun Kronolojik Rotası">
      {/* Bölüm başlığı */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>⏱</span>
        <h2 className={styles.title}>Podo's Timeline</h2>
        <span className={styles.eventCount}>{events.length} events</span>
      </div>

      {/* Timeline listesi */}
      <ol className={styles.timeline} role="list">
        {events.map((event, index) => (
          <li key={event.id} className={styles.item}>
            <TimelineEntry
              time={event.time}
              location={event.location}
              description={event.description}
              isLast={index === events.length - 1}
              isHighlight={event.isHighlight}
            />
          </li>
        ))}

        {/* "KAYIP" son marker — soruşturma dramatikliği */}
        <li className={styles.item}>
          <div className={styles.missingMarker}>
            <div className={styles.missingTrack}>
              <span className={styles.missingDot}>✕</span>
            </div>
            <div className={styles.missingContent}>
              <span className={styles.missingTime}>???</span>
              <span className={styles.missingLabel}>KAYIP</span>
            </div>
          </div>
        </li>
      </ol>
    </section>
  );
}
