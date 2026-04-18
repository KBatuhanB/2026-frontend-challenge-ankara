/**
 * ============================================================
 * useAllData — Birleştirilmiş Veri Hook'u (Master Hook)
 * ============================================================
 *
 * Neden bir master hook?
 * → Soruşturma panosu, 5 farklı veri kaynağını aynı anda gösterir.
 *   Her component'in 5 ayrı hook çağırması yerine, tek bir hook
 *   üzerinden tüm veri + birleştirilmiş loading/error durumu sunulur.
 *   Bu yaklaşım:
 *   - Bileşen kodunu sadeleştirir (Facade pattern)
 *   - Loading state'leri merkezi yönetir (hepsi yüklendi mi?)
 *   - Error state'leri birleştirir (herhangi biri hata verdi mi?)
 *
 * React Query paralel fetch:
 * → Her useQuery hook'u bağımsız çalışır — 5 istek paralel gider.
 *   Sıralı (waterfall) çağrı yapılmaz, toplam bekleme süresi
 *   en yavaş isteğin süresi kadardır.
 *
 * Performans:
 * → useMemo ile dönüş değeri memoize edilir — gereksiz re-render önlenir.
 *   Dependency array'deki data referansları değişmediği sürece
 *   aynı obje döner.
 */
import { useMemo } from 'react';
import { useCheckins } from './useCheckins';
import { useMessages } from './useMessages';
import { useSightings } from './useSightings';
import { usePersonalNotes } from './usePersonalNotes';
import { useAnonymousTips } from './useAnonymousTips';
import type {
  Checkin,
  Message,
  Sighting,
  PersonalNote,
  AnonymousTip,
} from '../../types';

/**
 * useAllData hook'unun dönüş tipi.
 * Neden ayrı bir interface?
 * → Hook'un tüketicileri (component'ler) bu tipi bilmeli.
 *   Ayrıca test sırasında mock için açık bir kontrat sağlar.
 */
export interface AllData {
  readonly checkins: readonly Checkin[];
  readonly messages: readonly Message[];
  readonly sightings: readonly Sighting[];
  readonly personalNotes: readonly PersonalNote[];
  readonly anonymousTips: readonly AnonymousTip[];

  /** Herhangi bir veri kaynağı hâlâ yükleniyorsa true */
  readonly isLoading: boolean;

  /** Herhangi bir veri kaynağı hata verdiyse true */
  readonly isError: boolean;

  /** İlk hata objesi — UI'da gösterilmek üzere */
  readonly error: Error | null;
}

/**
 * 5 form verisini paralel olarak çeker ve birleştirilmiş bir yapıda sunar.
 *
 * @returns AllData — tüm veriler + yükleme/hata durumları
 *
 * @example
 * ```tsx
 * function InvestigationPage() {
 *   const { checkins, messages, isLoading, isError, error } = useAllData();
 *   if (isLoading) return <Spinner />;
 *   if (isError) return <ErrorMessage message={error?.message} />;
 *   return <Dashboard checkins={checkins} messages={messages} ... />;
 * }
 * ```
 */
export function useAllData(): AllData {
  const checkinsQuery = useCheckins();
  const messagesQuery = useMessages();
  const sightingsQuery = useSightings();
  const personalNotesQuery = usePersonalNotes();
  const anonymousTipsQuery = useAnonymousTips();

  /**
   * useMemo ile tüm sonuçları birleştir.
   * Neden useMemo?
   * → Her render'da yeni bir obje oluşturmak, tüketici component'lerde
   *   gereksiz re-render tetikler. useMemo ile referans stabilitesi sağlanır.
   *
   * Dependency array'de .data ve durum flag'leri izlenir —
   * sadece gerçek veri değişikliğinde yeni obje oluşur.
   */
  return useMemo<AllData>(() => ({
    /* Null coalescing ile boş dizi fallback — undefined kontrolü gereksiz hale gelir */
    checkins: checkinsQuery.data ?? [],
    messages: messagesQuery.data ?? [],
    sightings: sightingsQuery.data ?? [],
    personalNotes: personalNotesQuery.data ?? [],
    anonymousTips: anonymousTipsQuery.data ?? [],

    /* Herhangi biri yükleniyorsa genel loading true */
    isLoading:
      checkinsQuery.isLoading ||
      messagesQuery.isLoading ||
      sightingsQuery.isLoading ||
      personalNotesQuery.isLoading ||
      anonymousTipsQuery.isLoading,

    /* Herhangi biri hata verdiyse genel error true */
    isError:
      checkinsQuery.isError ||
      messagesQuery.isError ||
      sightingsQuery.isError ||
      personalNotesQuery.isError ||
      anonymousTipsQuery.isError,

    /* İlk bulunan hata objesi — kullanıcıya gösterilecek.
       Neden sadece ilki?
       → Birden fazla hata mesajı göstermek karmaşık ve kullanıcı dostu değil.
         İlk hata çözüldüğünde diğerleri de (genellikle aynı nedenle) çözülür. */
    error:
      (checkinsQuery.error ??
      messagesQuery.error ??
      sightingsQuery.error ??
      personalNotesQuery.error ??
      anonymousTipsQuery.error) as Error | null,
  }), [
    checkinsQuery.data,
    checkinsQuery.isLoading,
    checkinsQuery.isError,
    checkinsQuery.error,
    messagesQuery.data,
    messagesQuery.isLoading,
    messagesQuery.isError,
    messagesQuery.error,
    sightingsQuery.data,
    sightingsQuery.isLoading,
    sightingsQuery.isError,
    sightingsQuery.error,
    personalNotesQuery.data,
    personalNotesQuery.isLoading,
    personalNotesQuery.isError,
    personalNotesQuery.error,
    anonymousTipsQuery.data,
    anonymousTipsQuery.isLoading,
    anonymousTipsQuery.isError,
    anonymousTipsQuery.error,
  ]);
}
