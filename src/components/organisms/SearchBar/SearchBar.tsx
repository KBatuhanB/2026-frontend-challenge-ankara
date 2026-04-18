/**
 * SearchBar — Arama + filtre çubuğu organizma bileşeni.
 *
 * Neden organism?
 * → SearchInput (atom) + FilterBar (molecule) bileşenlerini bir araya getirir.
 *   Sticky pozisyonlama ile kaydırmada her zaman erişilebilir kalır.
 *
 * Neden controlled (value/onChange) props?
 * → FAZ 4'te FilterContext ile entegre olacak. Controlled component pattern
 *   sayesinde state yönetimi dışarıdan inject edilebilir.
 *   FAZ 3'te InvestigationPage local state kullanır,
 *   FAZ 4'te FilterContext'e geçiş breaking change olmadan yapılır.
 */
import { SearchInput } from '../../atoms/SearchInput/SearchInput';
import { FilterBar, type FilterOption } from '../../molecules/FilterBar/FilterBar';
import styles from './SearchBar.module.css';

export interface SearchBarProps {
  /** Arama metni değeri */
  readonly searchValue: string;
  /** Arama değiştiğinde (debounced) tetiklenen callback */
  readonly onSearchChange: (value: string) => void;
  /** Filtre seçenekleri listesi */
  readonly filters?: readonly FilterOption[];
  /** Filtre toggle callback */
  readonly onFilterToggle?: (key: string) => void;
}

export function SearchBar({
  searchValue,
  onSearchChange,
  filters,
  onFilterToggle,
}: SearchBarProps) {
  return (
    <div className={styles.bar}>
      <div className={styles.inner}>
        <SearchInput
          value={searchValue}
          onChange={onSearchChange}
          placeholder="Kayıtlarda ara... (isim, lokasyon, not)"
        />

        {/* FilterBar sadece filtre verilmişse render edilir */}
        {filters && filters.length > 0 && onFilterToggle && (
          <FilterBar filters={filters} onToggle={onFilterToggle} />
        )}
      </div>
    </div>
  );
}
