/**
 * AccordionItem — Açılır-kapanır liste öğesi.
 *
 * Neden grid-template-rows animasyonu?
 * → max-height tabanlı geçişler tahmini yükseklik gerektirir (ör. max-height: 9999px),
 *   bu da animasyon süresini orantısız etkiler.
 *   grid-template-rows: 0fr → 1fr geçişi CSS Grid spesifikasyonunda
 *   native olarak desteklenir ve içerik yüksekliğinden bağımsız çalışır.
 *
 * Neden defaultOpen state ile başlatılıyor?
 * → İlk render'da bazı accordion'lar açık olabilir (ör. ilk kategori).
 *   Controlled component yerine uncontrolled + defaultOpen tercih edildi
 *   çünkü accordion durumu parent'ın sorumluluğu değil (SRP).
 */
import { useState, useCallback, type ReactNode } from 'react';
import styles from './AccordionItem.module.css';

export interface AccordionItemProps {
  /** Başlık metni */
  readonly title: string;
  /** Kayıt sayısı — başlıkta gösterilir */
  readonly count?: number;
  /** Sol kenar aksan rengi — kategori farklılaştırması */
  readonly accentColor?: string;
  /** Varsayılan açık/kapalı durumu */
  readonly defaultOpen?: boolean;
  /** Alt içerik — accordion açıkken render edilir */
  readonly children: ReactNode;
}

export function AccordionItem({
  title,
  count,
  accentColor,
  defaultOpen = false,
  children,
}: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return (
    <div
      className={styles.item}
      style={accentColor ? { '--accent': accentColor } as React.CSSProperties : undefined}
    >
      <button
        type="button"
        className={styles.header}
        onClick={toggle}
        aria-expanded={isOpen}
      >
        {/* Sol kenar aksan çizgisi — kategori rengiyle */}
        {accentColor && <span className={styles.accentBar} aria-hidden="true" />}

        {/* Açma/kapama oku — CSS transform ile döndürülür */}
        <span className={`${styles.arrow} ${isOpen ? styles.arrowOpen : ''}`} aria-hidden="true" />

        <span className={styles.title}>{title}</span>

        {count != null && (
          <span className={styles.count}>{count}</span>
        )}
      </button>

      {/* Grid animasyonlu içerik alanı */}
      <div className={`${styles.content} ${isOpen ? styles.contentOpen : ''}`}>
        <div className={styles.contentInner}>
          {children}
        </div>
      </div>
    </div>
  );
}
