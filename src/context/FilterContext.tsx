/**
 * ============================================================
 * FilterContext — Global Arama & Filtre Durum Yönetimi
 * ============================================================
 *
 * Neden React Context (Redux/Zustand değil)?
 * → Durum basit ve düz yapıda — sadece string + string[].
 *   45 kayıtlık veri setinde üst-düzey state yönetim kütüphanesi
 *   gereksiz karmaşıklık ve bundle boyutu ekler.
 *   Context + useReducer, bu ölçekte optimal.
 *
 * Neden useReducer (useState değil)?
 * → Birden fazla ilişkili state alanı var (searchQuery, sources, locations vb.).
 *   useReducer ile:
 *   1. State değişiklikleri öngörülebilir ve izlenebilir (dispatch + action type)
 *   2. Batch güncellemeler doğal (tek dispatch ile birden fazla alan değişir)
 *   3. Reducer pure function — test edilebilirlik yüksek
 *
 * Güvenlik:
 * → searchQuery HTML sanitize edilmez çünkü sadece string karşılaştırma
 *   için kullanılır, DOM'a dangerouslySetInnerHTML ile yansıtılmaz.
 *   Karşılaştırma sırasında normalizeName ile temizlenir.
 */
import {
  createContext,
  useContext,
  useReducer,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';

/* ─── State Tipi ─── */
export interface FilterState {
  /** Tüm alanlarda aranacak metin — case-insensitive */
  readonly searchQuery: string;
  /** Seçili veri kaynakları (checkins, messages vb.) — boş = hepsi aktif */
  readonly selectedSources: readonly string[];
  /** Seçili lokasyonlar — boş = hepsi aktif */
  readonly selectedLocations: readonly string[];
  /** Aciliyet filtresi — null = filtre yok */
  readonly urgencyFilter: string | null;
  /** Güvenilirlik filtresi — null = filtre yok */
  readonly confidenceFilter: string | null;
}

/* ─── Action Tipleri ─── */

/**
 * Discriminated union — her action tipi kendi payload'ını taşır.
 * Neden string literal type?
 * → switch-case ile exhaustive kontrol sağlar.
 *   Yanlış action type derleme zamanında yakalanır.
 */
type FilterAction =
  | { readonly type: 'SET_SEARCH'; readonly payload: string }
  | { readonly type: 'TOGGLE_SOURCE'; readonly payload: string }
  | { readonly type: 'TOGGLE_LOCATION'; readonly payload: string }
  | { readonly type: 'SET_URGENCY'; readonly payload: string | null }
  | { readonly type: 'SET_CONFIDENCE'; readonly payload: string | null }
  | { readonly type: 'RESET_ALL' };

/* ─── Başlangıç Durumu ─── */
const INITIAL_STATE: FilterState = {
  searchQuery: '',
  selectedSources: [],
  selectedLocations: [],
  urgencyFilter: null,
  confidenceFilter: null,
};

/**
 * Toggle helper — dizide varsa çıkar, yoksa ekle.
 * Immutable yaklaşım: her seferinde yeni dizi döner.
 * O(n) — dizi boyutu küçük (max ~10 eleman), performans sorun değil.
 */
function toggleArrayItem(arr: readonly string[], item: string): string[] {
  return arr.includes(item)
    ? arr.filter((i) => i !== item)
    : [...arr, item];
}

/**
 * Filter reducer — pure function, yan etkisiz.
 * Test: filterReducer(state, action) → yeni state.
 */
function filterReducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case 'SET_SEARCH':
      return { ...state, searchQuery: action.payload };

    case 'TOGGLE_SOURCE':
      return { ...state, selectedSources: toggleArrayItem(state.selectedSources, action.payload) };

    case 'TOGGLE_LOCATION':
      return { ...state, selectedLocations: toggleArrayItem(state.selectedLocations, action.payload) };

    case 'SET_URGENCY':
      /* Aynı değere tekrar tıklarsa filtre kaldırılır (toggle davranışı) */
      return {
        ...state,
        urgencyFilter: state.urgencyFilter === action.payload ? null : action.payload,
      };

    case 'SET_CONFIDENCE':
      return {
        ...state,
        confidenceFilter: state.confidenceFilter === action.payload ? null : action.payload,
      };

    case 'RESET_ALL':
      return INITIAL_STATE;

    default:
      return state;
  }
}

/* ─── Context Tanımı ─── */

/**
 * Context value tipi — state + dispatch fonksiyonları.
 * Neden ayrı fonksiyonlar (raw dispatch değil)?
 * → Tüketici bileşenler action type'larını bilmek zorunda kalmaz.
 *   Bu kapsülleme, context API'sini değiştirmeden reducer'ı refactor
 *   edebilmemizi sağlar (OCP).
 */
export interface FilterContextValue {
  readonly state: FilterState;
  readonly setSearch: (query: string) => void;
  readonly toggleSource: (source: string) => void;
  readonly toggleLocation: (location: string) => void;
  readonly setUrgency: (level: string | null) => void;
  readonly setConfidence: (level: string | null) => void;
  readonly resetAll: () => void;
}

/**
 * Context default value undefined — provider dışında kullanımı yakalar.
 * Neden undefined?
 * → Provider dışında context'e erişim sessiz bir bug kaynağıdır.
 *   undefined ile useFilterContext hook'u runtime hatası fırlatır.
 */
const FilterContext = createContext<FilterContextValue | undefined>(undefined);

/* ─── Provider Bileşeni ─── */

export function FilterProvider({ children }: { readonly children: ReactNode }) {
  const [state, dispatch] = useReducer(filterReducer, INITIAL_STATE);

  /* useCallback ile dispatch fonksiyonlarını memoize et —
     tüketici bileşenlerde gereksiz re-render'ı önler. */
  const setSearch = useCallback(
    (query: string) => dispatch({ type: 'SET_SEARCH', payload: query }),
    [],
  );

  const toggleSource = useCallback(
    (source: string) => dispatch({ type: 'TOGGLE_SOURCE', payload: source }),
    [],
  );

  const toggleLocation = useCallback(
    (location: string) => dispatch({ type: 'TOGGLE_LOCATION', payload: location }),
    [],
  );

  const setUrgency = useCallback(
    (level: string | null) => dispatch({ type: 'SET_URGENCY', payload: level }),
    [],
  );

  const setConfidence = useCallback(
    (level: string | null) => dispatch({ type: 'SET_CONFIDENCE', payload: level }),
    [],
  );

  const resetAll = useCallback(
    () => dispatch({ type: 'RESET_ALL' }),
    [],
  );

  /* useMemo ile context value nesnesini memoize et —
     state değişmediğinde yeni obje oluşturmaz, tüketici re-render'ını önler. */
  const value = useMemo<FilterContextValue>(() => ({
    state,
    setSearch,
    toggleSource,
    toggleLocation,
    setUrgency,
    setConfidence,
    resetAll,
  }), [state, setSearch, toggleSource, toggleLocation, setUrgency, setConfidence, resetAll]);

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
}

/* ─── Hook ─── */

/**
 * FilterContext'e güvenli erişim hook'u.
 * Provider dışında kullanım → açıklayıcı hata mesajı.
 *
 * @throws Error — FilterProvider bileşeni ağaçta yoksa
 */
export function useFilter(): FilterContextValue {
  const ctx = useContext(FilterContext);
  if (!ctx) {
    throw new Error(
      'useFilter hook\'u FilterProvider dışında kullanılamaz. ' +
      'Bileşen ağacında <FilterProvider> olduğundan emin olun.'
    );
  }
  return ctx;
}
