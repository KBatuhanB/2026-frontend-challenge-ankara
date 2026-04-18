/**
 * EmptyState — Boş veri durumu gösterimi.
 *
 * Neden ayrı bir bileşen?
 * → "Sonuç bulunamadı" durumu her listede olabilir (arama, filtre, boş kategori).
 *   Tutarlı ve kullanıcı dostu bir mesaj göstermek UX kalitesini artırır.
 *   Boş bir ekran yerine bağlam içeren bir mesaj, kullanıcıyı yönlendirir.
 */
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  /** Gösterilecek mesaj — kontekste uygun olmalı */
  readonly message: string;
}

export function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className={styles.container}>
      {/* Basit çizgi ikon — dosya bulunamadı hissi */}
      <div className={styles.icon} aria-hidden="true">
        <span className={styles.line} />
        <span className={styles.line} />
        <span className={styles.line} />
      </div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
