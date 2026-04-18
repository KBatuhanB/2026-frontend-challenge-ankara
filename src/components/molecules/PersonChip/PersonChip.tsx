/**
 * PersonChip — Tıklanabilir kişi adı göstergesi.
 *
 * Neden ayrı bir bileşen?
 * → Kişi adları birçok bağlamda tekrar eder (RecordCard, modal, timeline).
 *   Tıklandığında PersonDetailModal açılması FAZ 4'te eklenecek.
 *   Şimdilik görsel olarak ayırt edici, tıklanabilir bir eleman.
 *
 * Neden baş harf göstergesi (avatar)?
 * → Profil fotoğrafı yokken baş harf + renk kombinasyonu
 *   kişileri hızlıca ayırt etmeyi kolaylaştırır.
 */
import styles from './PersonChip.module.css';

export interface PersonChipProps {
  /** Kişi adı */
  readonly name: string;
  /** Tıklama handler'ı — kişi profil modal'ı için (FAZ 4) */
  readonly onClick?: () => void;
}

export function PersonChip({ name, onClick }: PersonChipProps) {
  /* Baş harfi çıkar — Türkçe karakterleri de destekler */
  const initial = name.charAt(0).toUpperCase();

  return (
    <span
      className={`${styles.chip} ${onClick ? styles.clickable : ''}`}
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
      <span className={styles.avatar} aria-hidden="true">{initial}</span>
      <span className={styles.name}>{name}</span>
    </span>
  );
}
