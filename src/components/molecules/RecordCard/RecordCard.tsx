/**
 * RecordCard — Tek bir kaydın özet kartı (presentational).
 *
 * Neden domain-agnostic props?
 * → RecordCard hiçbir veri tipini (Checkin, Message vb.) doğrudan bilmez.
 *   Parent bileşen (CategoryAccordion) domain verisini flat props'a çevirir.
 *   Bu sayede:
 *   1. RecordCard bağımsız olarak test edilebilir
 *   2. Farklı veri kaynakları aynı kartı kullanabilir
 *   3. Stil değişikliği domain mantığını etkilemez (SRP)
 *
 * Neden subtitle kırpılıyor (line-clamp)?
 * → Uzun not/mesaj metinleri kart yüksekliğini tutarsız hale getirir.
 *   2 satır limiti görsel düzeni korur; tam metin detay modal'ında okunur.
 */
import { Badge } from '../../atoms/Badge/Badge';
import { Tag } from '../../atoms/Tag/Tag';
import styles from './RecordCard.module.css';

export interface RecordCardProps {
  /** Ana başlık — kişi adı veya gönderen→alıcı */
  readonly title: string;
  /** Alt metin — not, mesaj veya ihbar özeti */
  readonly subtitle?: string;
  /** Zaman damgası — "HH:mm" veya "DD-MM-YYYY HH:mm" */
  readonly timestamp: string;
  /** Mekan adı */
  readonly location: string;
  /** Urgency/confidence seviyesi — badge göstermek için */
  readonly badgeLevel?: 'low' | 'medium' | 'high';
  /** Badge etiketi — opsiyonel özel metin */
  readonly badgeLabel?: string;
  /** Tıklama handler'ı — detay modal'ı açmak için (FAZ 4'te aktif) */
  readonly onClick?: () => void;
}

export function RecordCard({
  title,
  subtitle,
  timestamp,
  location,
  badgeLevel,
  badgeLabel,
  onClick,
}: RecordCardProps) {
  return (
    <article
      className={`${styles.card} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {/* Üst satır: başlık + badge */}
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        {badgeLevel && <Badge level={badgeLevel} label={badgeLabel} />}
      </div>

      {/* Alt metin — 2 satır limiti (line-clamp) */}
      {subtitle && (
        <p className={styles.subtitle}>{subtitle}</p>
      )}

      {/* Alt bilgi satırı: zaman + lokasyon */}
      <div className={styles.meta}>
        <span className={styles.timestamp}>{extractTime(timestamp)}</span>
        <Tag text={location} variant="location" />
      </div>
    </article>
  );
}

/**
 * Zaman damgasından sadece saat:dakika kısmını çıkarır.
 * "18-04-2026 21:11" → "21:11"
 * Eğer zaten kısa formatsa olduğu gibi döner.
 */
function extractTime(timestamp: string): string {
  const timeMatch = timestamp.match(/(\d{2}:\d{2})/);
  return timeMatch ? timeMatch[1] : timestamp;
}
