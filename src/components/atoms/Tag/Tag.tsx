/**
 * Tag — Lokasyon / kişi etiketi.
 *
 * Neden variant sistemi?
 * → Lokasyon ve kişi etiketleri görsel olarak farklı olmalı
 *   (farklı renk tonları), ancak yapısal olarak aynı bileşen.
 *   Variant ile stil farkı, prop'la kontrol edilir.
 */
import styles from './Tag.module.css';

export interface TagProps {
  /** Etiket metni */
  readonly text: string;
  /** Görsel varyant — renk ve stil farklılaştırması */
  readonly variant?: 'location' | 'person' | 'default';
  /** Aktif (seçili) durumu — filtre chip'lerinde kullanılır */
  readonly active?: boolean;
  /** Tıklama handler'ı — undefined ise tıklanamaz (cursor: default) */
  readonly onClick?: () => void;
}

export function Tag({
  text,
  variant = 'default',
  active = false,
  onClick,
}: TagProps) {
  const className = [
    styles.tag,
    styles[variant],
    active ? styles.active : '',
    onClick ? styles.clickable : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={className}
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
      {text}
    </span>
  );
}
