/**
 * ErrorMessage — Hata durumu gösterimi.
 *
 * Neden ayrı bir bileşen?
 * → Hata gösterimi birden fazla yerde kullanılır (sayfa, modal, accordion).
 *   Tutarlı hata deneyimi için merkezi bir bileşen şart.
 *
 * Neden onRetry?
 * → Ağ hatalarında kullanıcıya "tekrar dene" seçeneği sunmak UX best practice.
 *   React Query refetch ile entegre çalışır.
 */
import styles from './ErrorMessage.module.css';

export interface ErrorMessageProps {
  /** Hata mesajı — kullanıcıya gösterilecek metin */
  readonly message: string;
  /** Tekrar deneme callback'i — undefined ise buton gösterilmez */
  readonly onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className={styles.container} role="alert">
      {/* CSS-only uyarı ikonu — daire içinde ünlem */}
      <span className={styles.icon} aria-hidden="true">!</span>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <button
          type="button"
          className={styles.retryButton}
          onClick={onRetry}
        >
          Tekrar Dene
        </button>
      )}
    </div>
  );
}
