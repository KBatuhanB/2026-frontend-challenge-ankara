/**
 * SearchInput — Debounced arama giriş alanı.
 *
 * Neden debounce?
 * → Her tuş vuruşunda üst bileşene bildirim göndermek gereksiz
 *   re-render zinciri tetikler. 300ms gecikme ile kullanıcı yazmayı
 *   bitirdikten sonra tek bir güncelleme yapılır.
 *
 * Neden internal state + controlled input?
 * → Input anında tepki vermeli (kullanıcı yazdıklarını görmeli),
 *   ancak dışarıya sadece debounce edilmiş değer gitmeli.
 *   İki katmanlı state bu dengeyi sağlar.
 */
import { useState, useRef, useCallback, useEffect, type ChangeEvent } from 'react';
import styles from './SearchInput.module.css';

export interface SearchInputProps {
  /** Dışarıdan kontrol edilen arama değeri */
  readonly value: string;
  /** Debounce sonrası tetiklenen callback */
  readonly onChange: (value: string) => void;
  /** Placeholder metni — varsayılan: 'Kayıtlarda ara...' */
  readonly placeholder?: string;
}

/** Debounce süresi (ms) — 300ms UX araştırmalarında optimal denge noktası */
const DEBOUNCE_DELAY = 300;

export function SearchInput({
  value,
  onChange,
  placeholder = 'Kayıtlarda ara...',
}: SearchInputProps) {
  /* Dahili state — input'un anlık görüntüsünü tutar */
  const [inputValue, setInputValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      /* Önceki zamanlayıcıyı temizle — sadece son tuş vuruşu sayılır */
      if (timerRef.current) clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        onChange(newValue);
      }, DEBOUNCE_DELAY);
    },
    [onChange],
  );

  /* Unmount'ta zamanlayıcıyı temizle — memory leak önlemi */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /* Dışarıdan gelen değer değiştiğinde senkronize et (ör. filtre sıfırlama) */
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <div className={styles.wrapper}>
      {/* CSS-only arama ikonu — SVG/emoji bağımlılığı yok */}
      <span className={styles.icon} aria-hidden="true" />
      <input
        type="text"
        className={styles.input}
        value={inputValue}
        onChange={handleChange}
        placeholder={placeholder}
        aria-label={placeholder}
        spellCheck={false}
        autoComplete="off"
      />
    </div>
  );
}
