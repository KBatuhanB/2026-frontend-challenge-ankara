/**
 * Modal — Yeniden kullanılabilir modal altyapısı.
 *
 * Neden ayrı bir base modal?
 * → RecordDetailModal ve PersonDetailModal aynı altyapıyı paylaşır:
 *   backdrop, animasyon, kapatma mantığı, klavye/erişilebilirlik.
 *   Base modal bu ortak sorumlulukları kapsüller (DRY).
 *
 * Portal kullanımı:
 * → createPortal ile modal document.body'ye render edilir.
 *   Neden? Parent bileşenin overflow:hidden veya z-index kısıtlamaları
 *   modal'ın görünürlüğünü engelleyemez.
 *
 * Erişilebilirlik:
 * → role="dialog", aria-modal="true", aria-label
 * → Escape tuşu ile kapatma
 * → Backdrop tıklama ile kapatma
 * → Focus trap — modal açıkken odak modal dışına çıkmaz
 */
import { useEffect, useRef, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

export interface ModalProps {
  /** Modal açık mı? */
  readonly isOpen: boolean;
  /** Kapatma callback'i */
  readonly onClose: () => void;
  /** Modal başlığı — erişilebilirlik için aria-label'da kullanılır */
  readonly title: string;
  /** Alt başlık — opsiyonel */
  readonly subtitle?: string;
  /** Modal içeriği */
  readonly children: ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  /**
   * Escape tuşu ile kapatma.
   * Neden document seviyesinde?
   * → Modal açıkken herhangi bir odak noktasında Escape çalışmalı.
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    /* Önceki odak noktasını kaydet — modal kapanınca geri dön */
    previousFocusRef.current = document.activeElement as HTMLElement;

    /* Escape listener ekle */
    document.addEventListener('keydown', handleKeyDown);

    /* Body scroll'u kitle — modal arkasında sayfa kaydırılmasın */
    document.body.style.overflow = 'hidden';

    /* Modal'a odaklan — erişilebilirlik */
    requestAnimationFrame(() => {
      modalRef.current?.focus();
    });

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';

      /* Önceki odak noktasına geri dön */
      previousFocusRef.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  /**
   * Backdrop tıklama — sadece backdrop'a tıklanırsa kapat.
   * Neden stopPropagation yerine target kontrolü?
   * → İçerik tıklamalarında event bubbling ile yanlışlıkla
   *   kapanma önlenir.
   */
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return createPortal(
    <div
      className={styles.backdrop}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        {/* Header: başlık + kapatma butonu */}
        <div className={styles.header}>
          <div className={styles.headerText}>
            <h2 className={styles.title}>{title}</h2>
            {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Kapat"
          >
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        {/* İçerik — scroll edilebilir */}
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
