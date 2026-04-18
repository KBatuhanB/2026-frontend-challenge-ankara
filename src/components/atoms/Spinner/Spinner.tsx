/**
 * Spinner — CSS-only yükleniyor animasyonu.
 *
 * Neden CSS-only?
 * → Harici animasyon kütüphanesi (Lottie, Framer) gerektirmez.
 *   Bundle boyutunu artırmaz. Basit ring animasyonu yeterli.
 *
 * Neden size prop?
 * → Farklı kontekstlerde (tam sayfa vs. inline) farklı boyut gerekir.
 */
import styles from './Spinner.module.css';

export interface SpinnerProps {
  /** Boyut — sm: 20px, md: 36px, lg: 56px */
  readonly size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ size = 'md' }: SpinnerProps) {
  return (
    <div
      className={`${styles.spinner} ${styles[size]}`}
      role="status"
      aria-label="Yükleniyor"
    >
      <span className="sr-only">Yükleniyor...</span>
    </div>
  );
}
