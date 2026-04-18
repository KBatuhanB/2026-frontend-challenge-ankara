/**
 * SuspicionPanel — Soruşturma özet kartları.
 *
 * Neden organism?
 * → computeSuspicionData utility'sinden gelen domain verisini
 *   3 özet kartına dönüştürür. Farklı veri kaynaklarından
 *   hesaplanmış sonuçları birleştirir (domain bridge).
 *
 * Kartlar:
 *   1. Son Görülme — Podo'nun son bilinen zaman + lokasyon + kiminle
 *   2. En Şüpheli — High confidence tip + high urgency mesaj → en yüksek skorlu kişi
 *   3. Son Konum — GPS koordinatları
 *
 * Performans:
 * → computeSuspicionData useMemo ile memoize edilir (parent'ta).
 *   Bu bileşen sadece hesaplanmış veriyi sunar — saf sunum katmanı.
 */
import { useMemo } from 'react';
import { computeSuspicionData, type SuspicionData } from '../../../utils/computeSuspicionData';
import type { FilterableData } from '../../../utils/filterRecords';
import styles from './SuspicionPanel.module.css';

export interface SuspicionPanelProps {
  /** Tüm form verileri */
  readonly data: FilterableData;
}

export function SuspicionPanel({ data }: SuspicionPanelProps) {
  /** Şüphe verisini hesapla — veri değişmedikçe aynı referans */
  const suspicion = useMemo(() => computeSuspicionData(data), [data]);

  return (
    <section className={styles.panel} aria-label="Soruşturma Özeti">
      {/* ─── Kart 1: Son Görülme ─── */}
      <div className={`${styles.card} ${styles.cardLastSeen}`}>
        <div className={styles.cardIcon}>
          <span className={styles.iconGlow}>⏱</span>
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardLabel}>Last Seen</span>
          {suspicion.lastSeen ? (
            <>
              <span className={styles.cardValue}>
                {extractTime(suspicion.lastSeen.time)}
              </span>
              <span className={styles.cardDetail}>
                {suspicion.lastSeen.location}
              </span>
              {suspicion.lastSeen.withPerson && (
                <span className={styles.cardMeta}>
                  with {suspicion.lastSeen.withPerson}
                </span>
              )}
            </>
          ) : (
            <span className={styles.cardEmpty}>No data</span>
          )}
        </div>
      </div>

      {/* ─── Kart 2: En Şüpheli ─── */}
      <div className={`${styles.card} ${styles.cardSuspect}`}>
        <div className={styles.cardIcon}>
          <span className={styles.iconGlowRed}>⚠</span>
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardLabel}>Top Suspect</span>
          {suspicion.topSuspect ? (
            <>
              <span className={styles.cardValue}>
                {suspicion.topSuspect.name}
              </span>
              <span className={styles.cardDetail}>
                {suspicion.topSuspect.highTipCount} high tips
              </span>
              <span className={styles.cardMeta}>
                {suspicion.topSuspect.highUrgencyCount} high urgency msgs
              </span>
            </>
          ) : (
            <span className={styles.cardEmpty}>No suspect identified</span>
          )}
        </div>
      </div>

      {/* ─── Kart 3: Son Konum ─── */}
      <div className={`${styles.card} ${styles.cardLocation}`}>
        <div className={styles.cardIcon}>
          <span className={styles.iconGlow}>📍</span>
        </div>
        <div className={styles.cardContent}>
          <span className={styles.cardLabel}>Last Location</span>
          {suspicion.lastLocation ? (
            <>
              <span className={styles.cardValue}>
                {suspicion.lastLocation.name}
              </span>
              {suspicion.lastLocation.coordinates && (
                <span className={styles.cardCoord}>
                  {suspicion.lastLocation.coordinates.lat.toFixed(4)},{' '}
                  {suspicion.lastLocation.coordinates.lon.toFixed(4)}
                </span>
              )}
            </>
          ) : (
            <span className={styles.cardEmpty}>Unknown</span>
          )}
        </div>
      </div>

      {/* ─── İstatistik Bar ─── */}
      <div className={styles.statsBar} role="group" aria-label="Soruşturma İstatistikleri">
        <StatItem value={suspicion.stats.totalRecords} label="Records" />
        <StatItem value={suspicion.stats.totalPersons} label="Persons" />
        <StatItem value={suspicion.stats.highAlertCount} label="High Alerts" accent />
      </div>
    </section>
  );
}

/* ─── Yardımcı Bileşenler ─── */

/** Tek istatistik öğesi */
function StatItem({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: boolean;
}) {
  return (
    <div className={styles.statItem}>
      <span className={`${styles.statValue} ${accent ? styles.statAccent : ''}`}>
        {value}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

/**
 * Timestamp string'inden "HH:mm" çıkarır.
 * Neden burada da var?
 * → buildPodoTimeline'daki extractTime ile aynı mantık ama
 *   import bağımlılığı oluşturmamak için lokal tanımlı.
 *   Kısa helper, DRY ihlali ihmal edilebilir.
 */
function extractTime(timestamp: string): string {
  const parts = timestamp.trim().split(/\s+/);
  return parts.length >= 2 ? parts[1] : timestamp;
}
