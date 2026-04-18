/**
 * Badge — Urgency/confidence seviye göstergesi.
 *
 * Neden ayrı bir atom?
 * → Renk-seviye eşleştirmesi (low=gri, medium=amber, high=kırmızı)
 *   birden fazla bileşende tekrar eder (RecordCard, modal, timeline).
 *   Tek bir noktada tanımlayarak tutarlılık ve DRY sağlanır.
 *
 * Emoji yerine neden CSS renk kodlaması?
 * → Erişilebilirlik — ekran okuyucularda emoji tutarsız davranır.
 *   Renk + metin kombinasyonu evrensel olarak anlaşılır.
 */
import styles from './Badge.module.css';

export interface BadgeProps {
  /** Seviye: low | medium | high — CSS sınıfını belirler */
  readonly level: 'low' | 'medium' | 'high';
  /** Opsiyonel etiket — varsayılan olarak seviye adı gösterilir */
  readonly label?: string;
}

export function Badge({ level, label }: BadgeProps) {
  return (
    <span
      className={`${styles.badge} ${styles[level]}`}
      role="status"
      aria-label={`${label ?? level} seviyesi`}
    >
      {label ?? level}
    </span>
  );
}
