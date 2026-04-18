/**
 * FilterBar — Filtre seçenekleri satırı.
 *
 * Neden presentational?
 * → FilterBar sadece filtre chip'lerini render eder ve tıklama olaylarını iletir.
 *   Gerçek filtre mantığı (FAZ 4'te FilterContext) parent'ta yönetilir.
 *   Bu ayrım bileşeni bağımsız test edilebilir ve yeniden kullanılabilir kılar.
 *
 * Neden scroll container?
 * → Filtre sayısı artarsa (birçok lokasyon, tüm form türleri) yatay kaydırma
 *   ile tüm seçenekler erişilebilir kalır. Satır kırmak layout'u bozabilir.
 */
import { Tag } from '../../atoms/Tag/Tag';
import styles from './FilterBar.module.css';

export interface FilterOption {
  /** Benzersiz anahtar — toggle işlemi için */
  readonly key: string;
  /** Gösterilecek etiket */
  readonly label: string;
  /** Aktif (seçili) mi? */
  readonly active: boolean;
}

export interface FilterBarProps {
  /** Filtre seçenekleri listesi */
  readonly filters: readonly FilterOption[];
  /** Bir filtre toggle edildiğinde tetiklenir */
  readonly onToggle: (key: string) => void;
}

export function FilterBar({ filters, onToggle }: FilterBarProps) {
  if (filters.length === 0) return null;

  return (
    <div className={styles.bar} role="group" aria-label="Filtreler">
      {filters.map((filter) => (
        <Tag
          key={filter.key}
          text={filter.label}
          active={filter.active}
          onClick={() => onToggle(filter.key)}
        />
      ))}
    </div>
  );
}
