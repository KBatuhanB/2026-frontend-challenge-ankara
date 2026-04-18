/**
 * MapView — Leaflet harita render bileşeni (Cluster Marker mimarisi).
 *
 * Neden organism?
 * → Leaflet kütüphanesinin React entegrasyonunu kapsüller.
 *   Cluster marker'lar, polyline, tile layer ve click handler'ları yönetir.
 *   Domain verisinden bağımsız — işlenmiş veri (clusters + route) alır.
 *
 * MapPage'den farkı:
 * → MapView sadece haritayı render eder. Detail panel, legend, stats gibi
 *   üst katman elemanları MapPage'in sorumluluğundadır (SRP).
 *
 * Teknik:
 * → react-leaflet ile deklaratif Leaflet kullanımı.
 *   DivIcon ile CSS-only glow marker'lar (harici ikon gerektirmez).
 *   Marker click → onLocationSelect callback ile parent'a bildirilir.
 *   Map background click → onMapClick ile panel kapatılır.
 *   Seçili marker'a smooth fly animasyonu (useMap).
 *
 * Marker tasarımı:
 *   - Dış halka (radial gradient glow)
 *   - İç nokta (solid renk + border + box-shadow)
 *   - Sağ üst köşede olay sayısı badge'i
 *   - Renk: kırmızı (son görülme), altın (Podo), mavi (normal)
 *   - Son görülme + seçili: nabız (pulse) animasyonu
 */
import { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { LocationCluster } from '../../../utils/buildLocationClusters';
import styles from './MapView.module.css';

/* ─── Props ─── */

export interface MapViewProps {
  /** Lokasyon kümeleri — her marker bir cluster */
  readonly clusters: readonly LocationCluster[];
  /** Podo'nun kronolojik rota noktaları — polyline için */
  readonly podoRoute: L.LatLngExpression[];
  /** Seçili lokasyon adı — aktif marker vurgusu için */
  readonly selectedLocationName: string | null;
  /** Marker tıklandığında çağrılır */
  readonly onLocationSelect: (cluster: LocationCluster) => void;
  /** Harita boşluğuna tıklandığında çağrılır (panel kapatma) */
  readonly onMapClick: () => void;
}

/* ─── Sabitler ─── */

/** Ankara merkez — tüm olaylar bu civarda */
const ANKARA_CENTER: L.LatLngExpression = [39.925, 32.860];
const DEFAULT_ZOOM = 13;

/** Marker pulse animasyonu CSS — DivIcon inline HTML için global inject */
const MARKER_KEYFRAMES_ID = 'mapview-marker-keyframes';
const MARKER_KEYFRAMES_CSS = `
  @keyframes mapview-pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(1.2); }
  }
`;

/* ─── Marker İkon Oluşturucu ─── */

/**
 * Cluster verisine göre özel DivIcon oluşturur.
 *
 * Neden DivIcon?
 * → Harici ikon dosyası gerektirmez. CSS ile tam kontrol.
 *   Vite/Webpack asset path sorunları ortadan kalkar.
 *   Her cluster için boyut, renk ve animasyon dinamik.
 *
 * @param cluster - Lokasyon cluster verisi
 * @param isSelected - Aktif seçili mi?
 */
function createClusterIcon(cluster: LocationCluster, isSelected: boolean): L.DivIcon {
  /* Renk seçimi — soruşturma önceliğine göre kademeli */
  const color = cluster.isLastSeen
    ? '#ef4444'       /* Kırmızı: son görülme — en kritik */
    : cluster.hasPodo
      ? '#c8a55a'     /* Altın: Podo bulunmuş — dikkat çekici */
      : '#3b82f6';    /* Mavi: normal aktivite noktası */

  /* Boyut — olay yoğunluğuna orantılı, min/max sınırlı */
  const baseSize = cluster.isLastSeen
    ? 22
    : Math.min(12 + cluster.totalEvents * 1.5, 24);
  const coreSize = isSelected ? baseSize + 6 : baseSize;
  const outerSize = coreSize + 22;

  /* Pulse animasyonu yalnızca dikkat gerektiren marker'larda */
  const shouldPulse = cluster.isLastSeen || isSelected;

  /* Badge boyutu */
  const badgeSize = 18;

  const html = `
    <div style="
      position:relative;
      width:${outerSize}px;
      height:${outerSize}px;
      display:flex;
      align-items:center;
      justify-content:center;
      cursor:pointer;
    ">
      <div style="
        position:absolute;
        width:${outerSize}px;
        height:${outerSize}px;
        border-radius:50%;
        background:radial-gradient(circle, ${color}30 0%, transparent 70%);
        ${shouldPulse ? 'animation:mapview-pulse 2s ease-in-out infinite;' : ''}
      "></div>
      <div style="
        position:relative;
        width:${coreSize}px;
        height:${coreSize}px;
        border-radius:50%;
        background:${color};
        border:2.5px solid rgba(255,255,255,${isSelected ? '0.9' : '0.5'});
        box-shadow:0 0 ${isSelected ? 16 : 8}px ${color}80, 0 2px 6px rgba(0,0,0,0.3);
        z-index:1;
      "></div>
      <div style="
        position:absolute;
        top:-3px;
        right:0;
        width:${badgeSize}px;
        height:${badgeSize}px;
        border-radius:50%;
        background:rgba(10,14,23,0.92);
        border:1.5px solid ${color};
        color:${color};
        font-size:9px;
        font-weight:700;
        font-family:'JetBrains Mono',Consolas,monospace;
        display:flex;
        align-items:center;
        justify-content:center;
        z-index:2;
        line-height:1;
      ">${cluster.totalEvents}</div>
    </div>
  `;

  return L.divIcon({
    className: '',
    html,
    iconSize: [outerSize, outerSize],
    iconAnchor: [outerSize / 2, outerSize / 2],
  });
}

/* ─── Yardımcı Bileşenler (MapContainer children olmalı) ─── */

/**
 * Seçili lokasyona smooth fly animasyonu.
 * Neden ayrı bileşen?
 * → useMap() hook'u MapContainer'ın child'ı içinde çağrılmalı.
 *   React render tree'sinde MapContainer dışında kullanılamaz.
 */
function FlyToSelected({ lat, lon }: { lat: number; lon: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([lat, lon], 15, { duration: 0.8 });
  }, [lat, lon, map]);

  return null;
}

/**
 * Harita boşluğuna tıklama yakalayıcı.
 * Neden ayrı bileşen?
 * → useMapEvents hook'u MapContainer child'ı gerektirir.
 *   Marker click'leri Leaflet seviyesinde propagation'ı durdurur,
 *   bu yüzden map click yalnızca boşluğa tıklandığında ateşlenir.
 */
function MapClickHandler({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick });
  return null;
}

/* ─── Ana Bileşen ─── */

export function MapView({
  clusters,
  podoRoute,
  selectedLocationName,
  onLocationSelect,
  onMapClick,
}: MapViewProps) {
  /**
   * Marker pulse animasyonu CSS'ini document head'e inject et.
   * Neden useEffect?
   * → DivIcon inline HTML, CSS Modules class'larına erişemez.
   *   Global @keyframes tanımı gerekli. Bir kez inject, unmount'ta temizle.
   */
  useEffect(() => {
    if (document.getElementById(MARKER_KEYFRAMES_ID)) return;
    const style = document.createElement('style');
    style.id = MARKER_KEYFRAMES_ID;
    style.textContent = MARKER_KEYFRAMES_CSS;
    document.head.appendChild(style);
    return () => { document.getElementById(MARKER_KEYFRAMES_ID)?.remove(); };
  }, []);

  /* Seçili cluster'ı bul — FlyTo koordinatları için */
  const selectedCluster = selectedLocationName
    ? clusters.find(c => c.locationName === selectedLocationName) ?? null
    : null;

  return (
    <div className={styles.mapWrapper}>
      <MapContainer
        center={ANKARA_CENTER}
        zoom={DEFAULT_ZOOM}
        className={styles.map}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
      >
        {/* Koyu tema tile — Case File Noir uyumlu */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Podo'nun rotası — altın kesikli polyline */}
        {podoRoute.length > 1 && (
          <Polyline
            positions={podoRoute}
            pathOptions={{
              color: '#c8a55a',
              weight: 3,
              opacity: 0.65,
              dashArray: '10, 6',
            }}
          />
        )}

        {/* Lokasyon cluster marker'ları */}
        {clusters.map((cluster) => (
          <Marker
            key={cluster.locationName}
            position={[cluster.lat, cluster.lon]}
            icon={createClusterIcon(
              cluster,
              cluster.locationName === selectedLocationName,
            )}
            eventHandlers={{
              click: () => onLocationSelect(cluster),
            }}
          />
        ))}

        {/* Seçili konuma fly animasyonu */}
        {selectedCluster && (
          <FlyToSelected lat={selectedCluster.lat} lon={selectedCluster.lon} />
        )}

        {/* Harita boşluğu tıklama — panel kapatma */}
        <MapClickHandler onClick={onMapClick} />
      </MapContainer>
    </div>
  );
}
