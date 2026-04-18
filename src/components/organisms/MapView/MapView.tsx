/**
 * MapView — Leaflet harita görselleştirmesi.
 *
 * Neden organism?
 * → Birden fazla veri kaynağından koordinat, rota ve marker bilgisini alır.
 *   Leaflet kütüphanesinin konfigürasyonu + domain verisi dönüşümü = organism.
 *
 * Harita içeriği:
 *   1. Marker'lar — Her sighting/checkin noktası (koordinat mevcut ise)
 *   2. Polyline — Podo'nun kronolojik rotası (timeline sırasıyla)
 *   3. Son görülme noktası — kırmızı marker ile vurgulanır
 *
 * Leaflet CSS:
 * → Leaflet node_modules'dan CSS import gerektirir. Vite bunu otomatik handle eder.
 *
 * Performans:
 * → Marker ve polyline verileri useMemo ile memoize edilir.
 *   ~45 kayıt için hesaplama ihmal edilebilir.
 *
 * Edge case'ler:
 *   - Koordinatı olmayan kayıtlar → atlanır (parseCoordinates null döner)
 *   - Podo ile ilgili kayıt yoksa → polyline çizilmez
 *   - Harita yüklenmezse → CSS background fallback
 */
import { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { parseCoordinates } from '../../../utils/parseCoordinates';
import { buildPodoTimeline } from '../../../utils/buildPodoTimeline';
import type { FilterableData } from '../../../utils/filterRecords';
import type { Checkin, Message, Sighting, BaseRecord, RecordType } from '../../../types';
import { normalizeName } from '../../../utils/normalizeName';
import styles from './MapView.module.css';

export interface MapViewProps {
  /** Tüm form verileri */
  readonly data: FilterableData;
}

/**
 * Ankara merkez koordinatları.
 * Neden sabit?
 * → Tüm olaylar Ankara'da geçiyor. Harita her zaman buradan başlar.
 */
const ANKARA_CENTER: L.LatLngExpression = [39.925, 32.860];
const DEFAULT_ZOOM = 13;

/** Podo'nun normalize edilmiş adı */
const PODO_NORMALIZED = normalizeName('Podo');

/**
 * Marker ikonları — Leaflet default marker'ları CDN'den gelir ama
 * bundle'da kaybolabilir. Divicon ile CSS-only marker oluşturuyoruz.
 *
 * Neden DivIcon?
 * → Harici ikon dosyası gerektirmez. CSS ile tamamen kontrol edilir.
 *   Webpack/Vite asset path sorunları ortadan kalkar.
 */
function createIcon(color: string, size = 12): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;
      height:${size}px;
      background:${color};
      border:2px solid rgba(255,255,255,0.8);
      border-radius:50%;
      box-shadow:0 0 6px ${color}80;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ICON_NORMAL = createIcon('#3b82f6', 10);
const ICON_LAST_SEEN = createIcon('#ef4444', 16);
const ICON_SUSPECT = createIcon('#f59e0b', 12);

/** Harita marker verisi */
interface MapMarker {
  readonly id: string;
  readonly lat: number;
  readonly lon: number;
  readonly label: string;
  readonly time: string;
  readonly location: string;
  readonly icon: L.DivIcon;
}

export function MapView({ data }: MapViewProps) {
  /**
   * Podo'nun rotası — polyline noktaları.
   * buildPodoTimeline'dan zaten kronolojik sıralı olaylar geliyor.
   * Koordinatı geçerli olanları filtrele ve LatLng'ye dönüştür.
   */
  const podoRoute = useMemo(() => {
    const events = buildPodoTimeline(data);
    const points: L.LatLngExpression[] = [];
    for (const ev of events) {
      const coord = parseCoordinates(ev.coordinates);
      if (coord) {
        points.push([coord.lat, coord.lon]);
      }
    }
    return points;
  }, [data]);

  /**
   * Tüm noktalardan marker verisi oluştur.
   * Checkins + Sightings koordinatlı kayıtlardan marker çıkar.
   */
  const markers = useMemo(() => {
    const result: MapMarker[] = [];
    const seen = new Set<string>();

    /* Podo timeline'dan son olay ID'sini al — kırmızı marker için */
    const timeline = buildPodoTimeline(data);
    const lastEventId = timeline.length > 0 ? timeline[timeline.length - 1].id : null;

    const addMarker = (
      record: BaseRecord,
      label: string,
      type: RecordType,
    ) => {
      if (seen.has(record.id)) return;
      const coord = parseCoordinates(record.coordinates);
      if (!coord) return;
      seen.add(record.id);

      /* İkon seçimi: son görülme → kırmızı, şüpheli → sarı, normal → mavi */
      let icon = ICON_NORMAL;
      if (record.id === lastEventId) {
        icon = ICON_LAST_SEEN;
      } else if (type === 'sighting') {
        const s = record as Sighting;
        const withNorm = normalizeName(s.seenWith);
        /* Kağan ile ilgili sighting'ler sarı */
        if (withNorm && withNorm !== PODO_NORMALIZED && withNorm !== 'unknown') {
          icon = ICON_SUSPECT;
        }
      }

      /* Timestamp'ten "HH:mm" çıkar */
      const timeParts = record.timestamp.trim().split(/\s+/);
      const time = timeParts.length >= 2 ? timeParts[1] : '';

      result.push({
        id: record.id,
        lat: coord.lat,
        lon: coord.lon,
        label,
        time,
        location: record.location,
        icon,
      });
    };

    /* Checkins */
    for (const r of data.checkins) {
      addMarker(r, (r as Checkin).personName, 'checkin');
    }

    /* Sightings */
    for (const r of data.sightings) {
      const s = r as Sighting;
      const label = s.seenWith && s.seenWith !== 'Unknown'
        ? `${s.personName} + ${s.seenWith}`
        : s.personName;
      addMarker(r, label, 'sighting');
    }

    return result;
  }, [data]);

  return (
    <section className={styles.container} aria-label="Soruşturma Haritası">
      {/* Bölüm başlığı */}
      <div className={styles.header}>
        <span className={styles.headerIcon}>🗺</span>
        <h2 className={styles.title}>Investigation Map</h2>
        <span className={styles.markerCount}>{markers.length} points</span>
      </div>

      {/* Leaflet Harita */}
      <div className={styles.mapWrapper}>
        <MapContainer
          center={ANKARA_CENTER}
          zoom={DEFAULT_ZOOM}
          className={styles.map}
          scrollWheelZoom={true}
          attributionControl={true}
        >
          {/* Tile Layer — koyu tema (Case File Noir ile uyumlu) */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* Podo'nun rotası — sarımsı polyline */}
          {podoRoute.length > 1 && (
            <Polyline
              positions={podoRoute}
              pathOptions={{
                color: '#c8a55a',
                weight: 3,
                opacity: 0.7,
                dashArray: '8, 4',
              }}
            />
          )}

          {/* Marker'lar */}
          {markers.map((m) => (
            <Marker
              key={m.id}
              position={[m.lat, m.lon]}
              icon={m.icon}
            >
              <Popup>
                <div className={styles.popup}>
                  <strong>{m.label}</strong>
                  <span>{m.time} — {m.location}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Lejant */}
      <div className={styles.legend}>
        <LegendItem color="#3b82f6" label="Normal" />
        <LegendItem color="#f59e0b" label="With others" />
        <LegendItem color="#ef4444" label="Last seen" />
        <LegendItem color="#c8a55a" label="Podo's route" isDashed />
      </div>
    </section>
  );
}

/* ─── Yardımcı Bileşenler ─── */

function LegendItem({
  color,
  label,
  isDashed,
}: {
  color: string;
  label: string;
  isDashed?: boolean;
}) {
  return (
    <div className={styles.legendItem}>
      {isDashed ? (
        <span
          className={styles.legendLine}
          style={{ borderColor: color }}
        />
      ) : (
        <span
          className={styles.legendDot}
          style={{ background: color }}
        />
      )}
      <span className={styles.legendLabel}>{label}</span>
    </div>
  );
}
