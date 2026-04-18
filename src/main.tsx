import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

/**
 * React Query istemcisi — API isteklerinin önbellekleme, yeniden deneme
 * ve arka plan güncelleme stratejilerini merkezi olarak yönetir.
 *
 * Neden bu ayarlar?
 * - staleTime (5dk): Soruşturma verileri sık değişmez, gereksiz API çağrısını önler
 * - retry (2): Ağ hatalarında otomatik yeniden deneme, ancak sonsuz döngüyü önlemek için sınırlı
 * - refetchOnWindowFocus (false): Sekme değişimlerinde gereksiz istek atılmasını engeller
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Uygulamanın kök mount noktası.
 * StrictMode: Geliştirme ortamında potansiyel sorunları erken tespit eder.
 * QueryClientProvider: Tüm alt bileşenlerin React Query'ye erişmesini sağlar.
 */
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error(
    'Root element bulunamadı. index.html dosyasında id="root" olan bir div olmalıdır.'
  );
}

createRoot(rootElement).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
);
