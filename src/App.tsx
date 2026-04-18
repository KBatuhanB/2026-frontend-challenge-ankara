/**
 * Ana uygulama bileşeni.
 *
 * Şu an minimal bir iskelet yapısı — FAZ 3'te InvestigationPage ile değiştirilecek.
 * Neden ayrı bir App bileşeni?
 * → React Query Provider main.tsx'te kalırken, sayfa yönlendirme ve
 *   global context provider'lar bu seviyede yönetilecek.
 */
function App() {
  return (
    <div className="app">
      <h1>🐾 Missing Podo: The Ankara Case</h1>
      <p>Soruşturma panosu yükleniyor...</p>
    </div>
  );
}

export default App;
