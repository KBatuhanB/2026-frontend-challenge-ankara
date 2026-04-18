/**
 * TimelineEntry — Zaman çizelgesindeki tek olay.
 *
 * Neden ayrı bir molecule?
 * → Timeline organizması (FAZ 5) bu bileşenleri listeleyecek.
 *   Her giriş: zaman, lokasyon, açıklama ve bağlantı çizgisi içerir.
 *   Molecule olarak bağımsız render ve test edilebilir.
 *
 * isHighlight neden var?
 * → Son görülme veya kritik olaylar görsel olarak vurgulanmalı.
 *   Soruşturma bağlamında "21:11 Ankara Kalesi" gibi kayıtlar
 *   farklı renkle ayırt edilir.
 */
import styles from './TimelineEntry.module.css';

export interface TimelineEntryProps {
  /** Olay zamanı — "HH:mm" formatı */
  readonly time: string;
  /** Olay lokasyonu */
  readonly location: string;
  /** Olay açıklaması */
  readonly description: string;
  /** Son eleman mı? — bağlantı çizgisi göstermeme */
  readonly isLast?: boolean;
  /** Kritik olay mı? — kırmızı vurgu */
  readonly isHighlight?: boolean;
}

export function TimelineEntry({
  time,
  location,
  description,
  isLast = false,
  isHighlight = false,
}: TimelineEntryProps) {
  return (
    <div className={`${styles.entry} ${isHighlight ? styles.highlight : ''}`}>
      {/* Sol taraf: dikey çizgi + nokta */}
      <div className={styles.track}>
        <span className={styles.dot} />
        {!isLast && <span className={styles.line} />}
      </div>

      {/* Sağ taraf: zaman + lokasyon + açıklama */}
      <div className={styles.content}>
        <div className={styles.meta}>
          <span className={styles.time}>{time}</span>
          <span className={styles.location}>{location}</span>
        </div>
        <p className={styles.description}>{description}</p>
      </div>
    </div>
  );
}
