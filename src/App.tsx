/**
 * Ana uygulama bileşeni — React Router ile 4 sayfalık SPA.
 *
 * Sayfa yapısı:
 *   /          → HomePage    (Sparkles + arama + navigasyon)
 *   /records   → RecordsPage (Kategori accordion'ları)
 *   /timeline  → TimelinePage (SuspicionPanel + Timeline)
 *   /map       → MapPage     (Leaflet harita)
 *
 * FloatingDock tüm sayfalarda görünür — Routes dışında render edilir.
 * FilterProvider tüm sayfaları sarar — RecordsPage filtre context'i kullanır.
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { FilterProvider } from './context/FilterContext';
import { FloatingDock } from './components/ui/FloatingDock/FloatingDock';
import { HomePage } from './components/pages/HomePage/HomePage';
import { RecordsPage } from './components/pages/RecordsPage/RecordsPage';
import { TimelinePage } from './components/pages/TimelinePage/TimelinePage';
import { MapPage } from './components/pages/MapPage/MapPage';
import {
  IconHome,
  IconFiles,
  IconTimeline,
  IconMap,
} from '@tabler/icons-react';

const DOCK_ITEMS = [
  { title: 'Home', icon: <IconHome size={20} stroke={1.5} />, href: '/' },
  { title: 'Records', icon: <IconFiles size={20} stroke={1.5} />, href: '/records' },
  { title: 'Timeline', icon: <IconTimeline size={20} stroke={1.5} />, href: '/timeline' },
  { title: 'Map', icon: <IconMap size={20} stroke={1.5} />, href: '/map' },
] as const;

function App() {
  return (
    <BrowserRouter>
      <FilterProvider>
        <div className="app">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/records" element={<RecordsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
          <FloatingDock items={DOCK_ITEMS} />
        </div>
      </FilterProvider>
    </BrowserRouter>
  );
}

export default App;
