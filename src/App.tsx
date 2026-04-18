/**
 * Ana uygulama bileşeni.
 *
 * Neden App seviyesinde FilterProvider?
 * → FilterContext tüm sayfa ve modal'lar tarafından paylaşılır.
 *   Provider en üst seviyede olmalı ki alt bileşenler erişebilsin.
 *   React Query Provider main.tsx'te, domain context'ler App'te.
 */
import { FilterProvider } from './context/FilterContext';
import { InvestigationPage } from './components/pages/InvestigationPage/InvestigationPage';

function App() {
  return (
    <FilterProvider>
      <div className="app">
        <InvestigationPage />
      </div>
    </FilterProvider>
  );
}

export default App;
