/**
 * Ana uygulama bileşeni.
 *
 * Neden ayrı bir App bileşeni?
 * → React Query Provider main.tsx'te kalırken, sayfa yönlendirme ve
 *   global context provider'lar (FAZ 4'te FilterContext) bu seviyede yönetilecek.
 *   Şu an tek sayfa var, ancak yapı genişlemeye açık.
 */
import { InvestigationPage } from './components/pages/InvestigationPage/InvestigationPage';

function App() {
  return (
    <div className="app">
      <InvestigationPage />
    </div>
  );
}

export default App;
