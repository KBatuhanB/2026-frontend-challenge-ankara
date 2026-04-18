# Missing Podo: The Ankara Case — Implementation Plan

> Jotform Frontend Hackathon | 3 Saat | React + TypeScript + Vite | Atomic Design

---

## Tech Stack

| Araç | Neden |
|---|---|
| **Vite** | Hızlı bootstrap, zero-config, HMR |
| **React 18 + TypeScript** | Challenge gereksinimleri + tip güvenliği |
| **TanStack React Query** | API fetching, caching, loading/error states otomatik |
| **CSS Modules** | Scoped styling, ek kütüphane gerektirmez |
| **Leaflet + react-leaflet** | Bonus harita özelliği (hafif, ücretsiz) |

---

## Proje Yapısı (Atomic Design)

```
src/
├── api/
│   ├── config.ts                  ← API_KEY, BASE_URL, FORM_IDS sabitleri
│   ├── jotformClient.ts           ← Generic fetch wrapper + submission normalizer
│   └── hooks/
│       ├── useCheckins.ts         ← Checkins verisi hook
│       ├── useMessages.ts         ← Messages verisi hook
│       ├── useSightings.ts        ← Sightings verisi hook
│       ├── usePersonalNotes.ts    ← Personal Notes verisi hook
│       ├── useAnonymousTips.ts    ← Anonymous Tips verisi hook
│       └── useAllData.ts          ← Tüm veriyi birleştiren master hook
│
├── types/
│   ├── checkin.ts                 ← Checkin interface
│   ├── message.ts                 ← Message interface
│   ├── sighting.ts                ← Sighting interface
│   ├── personalNote.ts            ← PersonalNote interface
│   ├── anonymousTip.ts            ← AnonymousTip interface
│   └── person.ts                  ← Normalize edilmiş birleşik kişi tipi
│
├── utils/
│   ├── normalizeSubmission.ts     ← answers[qid].answer → flat object dönüştürme
│   ├── normalizeName.ts           ← Kağan/Kagan/Kağan A. → "kagan" fuzzy matching
│   ├── parseCoordinates.ts        ← "39.93,32.84" → {lat, lon}
│   ├── parseTimestamp.ts          ← "18-04-2026 19:05" → Date
│   └── buildPersonProfiles.ts     ← Tüm kaynaklardan kişi profilleri oluşturma
│
├── components/
│   ├── atoms/                     ← En küçük, tekrar kullanılabilir UI parçaları
│   │   ├── SearchInput/
│   │   │   ├── SearchInput.tsx
│   │   │   └── SearchInput.module.css
│   │   ├── Badge/                 ← urgency/confidence badge'leri (low/medium/high)
│   │   │   ├── Badge.tsx
│   │   │   └── Badge.module.css
│   │   ├── Tag/                   ← location/person tag'leri
│   │   │   ├── Tag.tsx
│   │   │   └── Tag.module.css
│   │   ├── Spinner/               ← Yükleniyor animasyonu
│   │   │   ├── Spinner.tsx
│   │   │   └── Spinner.module.css
│   │   ├── ErrorMessage/          ← Hata durumu gösterimi
│   │   │   └── ErrorMessage.tsx
│   │   └── EmptyState/            ← Boş veri durumu gösterimi
│   │       └── EmptyState.tsx
│   │
│   ├── molecules/                 ← Atom'ları birleştiren orta-seviye bileşenler
│   │   ├── RecordCard/            ← Tek bir kaydın özet kartı
│   │   │   ├── RecordCard.tsx
│   │   │   └── RecordCard.module.css
│   │   ├── PersonChip/            ← Kişi adı + avatar placeholder (tıklanabilir)
│   │   │   ├── PersonChip.tsx
│   │   │   └── PersonChip.module.css
│   │   ├── TimelineEntry/         ← Zaman çizelgesindeki tek olay
│   │   │   ├── TimelineEntry.tsx
│   │   │   └── TimelineEntry.module.css
│   │   ├── FilterBar/             ← Filtre seçenekleri row'u
│   │   │   ├── FilterBar.tsx
│   │   │   └── FilterBar.module.css
│   │   └── AccordionItem/         ← Açılır-kapanır liste öğesi
│   │       ├── AccordionItem.tsx
│   │       └── AccordionItem.module.css
│   │
│   ├── organisms/                 ← Tam fonksiyonel büyük bileşenler
│   │   ├── Header/                ← Podo fotoğrafı + başlık + açıklama
│   │   │   ├── Header.tsx
│   │   │   └── Header.module.css
│   │   ├── SearchBar/             ← SearchInput + filtre toggle
│   │   │   ├── SearchBar.tsx
│   │   │   └── SearchBar.module.css
│   │   ├── CategoryAccordion/     ← Bir form kategorisinin tüm kayıtları
│   │   │   ├── CategoryAccordion.tsx
│   │   │   └── CategoryAccordion.module.css
│   │   ├── PersonDetailModal/     ← Kişi seçildiğinde popup (tüm ilişkili kayıtlar)
│   │   │   ├── PersonDetailModal.tsx
│   │   │   └── PersonDetailModal.module.css
│   │   ├── RecordDetailModal/     ← Kayıt seçildiğinde popup (detay + ilişkiler)
│   │   │   ├── RecordDetailModal.tsx
│   │   │   └── RecordDetailModal.module.css
│   │   ├── Timeline/              ← Podo'nun kronolojik rotası (bonus)
│   │   │   ├── Timeline.tsx
│   │   │   └── Timeline.module.css
│   │   ├── SuspicionPanel/        ← "En şüpheli" / "Son görülme" özet (bonus)
│   │   │   ├── SuspicionPanel.tsx
│   │   │   └── SuspicionPanel.module.css
│   │   └── MapView/               ← Leaflet harita (bonus)
│   │       ├── MapView.tsx
│   │       └── MapView.module.css
│   │
│   ├── templates/                 ← Sayfa iskelet yapıları
│   │   └── DashboardLayout/       ← Grid layout: header + search + content
│   │       ├── DashboardLayout.tsx
│   │       └── DashboardLayout.module.css
│   │
│   └── pages/                     ← Tam sayfalar
│       └── InvestigationPage/     ← Ana sayfa
│           └── InvestigationPage.tsx
│
├── context/
│   └── FilterContext.tsx           ← Global search/filter state (React Context)
│
├── App.tsx                        ← QueryClientProvider + InvestigationPage
├── main.tsx                       ← ReactDOM.createRoot + App render
└── index.css                      ← CSS variables, reset, global styles
```

---

## Fazlar & Zaman Planı

### FAZ 1 — Setup (10 dk)

| Adım | Detay |
|---|---|
| 1 | Vite + React + TypeScript projesi oluştur |
| 2 | `npm install @tanstack/react-query react-leaflet leaflet` |
| 3 | Folder structure oluştur (yukarıdaki yapı) |
| 4 | `api/config.ts` — API_KEY, BASE_URL, FORM_IDS sabitleri |
| 5 | **Git commit:** `feat: initial project setup with Vite + React + TS` |

**`api/config.ts` içeriği:**
```ts
export const API_BASE = 'https://api.jotform.com';
export const API_KEY = '54a934fa20b1ccc3a5bd1d2076f90556';

export const FORM_IDS = {
  checkins:      '261065067494966',
  messages:      '261065765723966',
  sightings:     '261065244786967',
  personalNotes: '261065509008958',
  anonymousTips: '261065875889981',
} as const;
```

---

### FAZ 2 — Data Layer (25 dk)

#### 2.1 TypeScript Tipleri

```ts
// types/checkin.ts
export interface Checkin {
  id: string;
  personName: string;
  timestamp: string;
  location: string;
  coordinates: string;
  note: string;
}

// types/message.ts
export interface Message {
  id: string;
  senderName: string;
  recipientName: string;
  timestamp: string;
  location: string;
  coordinates: string;
  text: string;
  urgency: 'low' | 'medium' | 'high';
}

// types/sighting.ts
export interface Sighting {
  id: string;
  personName: string;
  seenWith: string;
  timestamp: string;
  location: string;
  coordinates: string;
  note: string;
}

// types/personalNote.ts
export interface PersonalNote {
  id: string;
  authorName: string;
  timestamp: string;
  location: string;
  coordinates: string;
  note: string;
  mentionedPeople: string;
}

// types/anonymousTip.ts
export interface AnonymousTip {
  id: string;
  submissionDate: string;
  timestamp: string;
  location: string;
  coordinates: string;
  suspectName: string;
  tip: string;
  confidence: 'low' | 'medium' | 'high';
}
```

#### 2.2 API Client — `jotformClient.ts`

Sorumlulukları:
1. `fetchFormSubmissions(formId)` → API'den veri çek
2. `answers[qid].answer` → flat object'e dönüştür (her submission için)
3. Error handling (try/catch, HTTP status)
4. `limit=1000` ile tüm kayıtları getir

**Dönüşüm mantığı:**
```
API yanıtı: response.content[i].answers[qid] = { name: "personName", answer: "Podo" }
Dönüştürülmüş: { id: submissionId, personName: "Podo", ... }
```

#### 2.3 React Query Hooks

Her form için ayrı hook + hepsini birleştiren `useAllData()`:

```ts
// useCheckins.ts
export const useCheckins = () => useQuery({
  queryKey: ['checkins'],
  queryFn: () => fetchFormSubmissions<Checkin>(FORM_IDS.checkins),
});

// useAllData.ts — master hook
export const useAllData = () => {
  const checkins = useCheckins();
  const messages = useMessages();
  const sightings = useSightings();
  const notes = usePersonalNotes();
  const tips = useAnonymousTips();

  return {
    checkins: checkins.data ?? [],
    messages: messages.data ?? [],
    sightings: sightings.data ?? [],
    notes: notes.data ?? [],
    tips: tips.data ?? [],
    isLoading: checkins.isLoading || messages.isLoading || ...,
    isError: checkins.isError || messages.isError || ...,
  };
};
```

#### 2.4 Utility Fonksiyonları

| Fonksiyon | Girdi | Çıktı | Amaç |
|---|---|---|---|
| `normalizeName("Kağan A.")` | string | `"kagan"` | Türkçe karakter normalize + trailing initial kaldır |
| `parseCoordinates("39.93,32.84")` | string | `{lat: 39.93, lon: 32.84}` | Harita için koordinat parse |
| `parseTimestamp("18-04-2026 19:05")` | string | `Date` | Sıralama ve karşılaştırma için |
| `buildPersonProfiles(allData)` | AllData | `Person[]` | Tüm kaynaklardan unique kişi profilleri |

**`normalizeName` detayı:**
```
"Kağan"    → "kagan"
"Kagan"    → "kagan"
"Kağan A." → "kagan"
"kağan a"  → "kagan"
```
Adımlar: lowercase → Türkçe karakter replace (ğ→g, ş→s, ç→c, ı→i, ö→o, ü→u) → trailing initials/nokta kaldır → trim

**`buildPersonProfiles` detayı:**
```ts
interface Person {
  name: string;           // Display adı (ilk karşılaşılan yazım)
  normalizedName: string; // Normalize edilmiş key
  checkins: Checkin[];
  sentMessages: Message[];
  receivedMessages: Message[];
  sightings: Sighting[];
  seenWithSightings: Sighting[];
  authoredNotes: PersonalNote[];
  mentionedInNotes: PersonalNote[];
  tips: AnonymousTip[];
}
```

#### 2.5 Git commit: `feat: data layer — API client, types, normalization`

---

### FAZ 3 — Core UI (45 dk) ← En Kritik Faz

#### 3.1 Atoms (10 dk)

| Atom | Props | Açıklama |
|---|---|---|
| `SearchInput` | `value, onChange, placeholder` | Debounced (300ms) text input |
| `Badge` | `level: 'low' \| 'medium' \| 'high', label?` | low=gri, medium=sarı, high=kırmızı |
| `Tag` | `text, onClick?, variant?` | Lokasyon veya kişi tag'i |
| `Spinner` | `size?` | CSS-only loading animasyonu |
| `ErrorMessage` | `message` | Kırmızı hata kutusu |
| `EmptyState` | `message` | İkon + açıklama metni |

#### 3.2 Molecules (10 dk)

| Molecule | Props | Açıklama |
|---|---|---|
| `AccordionItem` | `title, count, children, defaultOpen?` | Başlık + expand/collapse + child render |
| `RecordCard` | `record, type, onClick` | Kişi adı + zaman + lokasyon + badge + kısa not |
| `FilterBar` | `filters, onChange` | Form türü / lokasyon / urgency filtre butonları |
| `PersonChip` | `name, onClick` | Kişi adı + avatar placeholder, tıklanabilir |
| `TimelineEntry` | `time, location, description, icon` | Zaman çizelgesi tek satır |

#### 3.3 Organisms (15 dk)

| Organism | Açıklama |
|---|---|
| `Header` | Podo fotoğrafı + "Missing Podo: The Ankara Case" + kısa açıklama |
| `SearchBar` | `SearchInput` + `FilterBar` toggle butonu, sticky |
| `CategoryAccordion` | Bir form kategorisi açıldığında → lokasyona göre alt-grup → `RecordCard` listesi |

#### 3.4 Templates + Pages (10 dk)

**`DashboardLayout`:**
```
┌─────────────────────────────┐
│         HEADER              │
├─────────────────────────────┤
│       SEARCH BAR            │
├─────────────────────────────┤
│                             │
│       {children}            │  ← Ana content alanı
│                             │
└─────────────────────────────┘
```

**`InvestigationPage`:**
- `useAllData()` ile veri çek
- Loading → `Spinner`
- Error → `ErrorMessage`
- Data → 5 adet `CategoryAccordion` render et

#### 3.5 Git commit: `feat: core UI — dashboard layout, search, accordion lists`

---

### FAZ 4 — Detail Views & Linking (35 dk)

#### 4.1 RecordDetailModal (10 dk)

Bir kayda tıklandığında açılan modal:
```
┌──────────────────────────────────┐
│  ✕ Close                         │
│                                  │
│  📋 Sighting Record              │
│  ─────────────────               │
│  Person: Podo                    │
│  Seen With: Kağan    [→ Profile] │  ← Kişi adı tıklanabilir
│  Time: 21:11                     │
│  Location: Ankara Kalesi         │
│  📍 39.9408, 32.8639            │
│  Note: "Podo biraz tedirgin..."  │
│                                  │
│  ── Related Records ──           │
│  💬 Kağan→Podo 20:44 (HIGH)     │  ← İlişkili mesaj
│  📝 Kağan note: "planladığım.." │  ← İlişkili not
│  🔍 Tip: Ankara Kalesi (HIGH)   │  ← İlişkili ihbar
└──────────────────────────────────┘
```

İlişkili kayıtları bulma mantığı:
- Aynı kişi adı (normalize edilmiş) geçen tüm kayıtlar
- Aynı lokasyondaki diğer kayıtlar
- Yakın zamandaki (±15 dk) kayıtlar

#### 4.2 PersonDetailModal (10 dk)

Bir kişi adına tıklandığında açılan modal:
```
┌──────────────────────────────────┐
│  ✕ Close                         │
│                                  │
│  👤 Kağan                        │
│  ─────────────────               │
│                                  │
│  📍 Checkins (1)                 │
│    └── CerModern, 19:07          │
│                                  │
│  💬 Messages (3)                 │
│    ├── → Podo, 20:44 (HIGH)     │
│    ├── ← Podo, 20:45            │
│    └── → Eray, 21:02 (HIGH)     │
│                                  │
│  👁 Sightings (4)               │
│    ├── with Podo, 20:51 Atakule │
│    ├── with Podo, 21:05 Kalesi  │
│    ├── with Podo, 21:11 Kalesi  │
│    └── alone, 21:22 Hamamönü    │
│                                  │
│  📝 Notes (1)                    │
│    └── "Her şey planladığım..."  │
│                                  │
│  🔍 Tips about this person (3)  │
│    ├── Atakule (HIGH)            │
│    ├── Ankara Kalesi (HIGH)      │
│    └── Hamamönü (medium)         │
└──────────────────────────────────┘
```

#### 4.3 Search & Filter (10 dk)

**FilterContext** — Global React Context:
```ts
interface FilterState {
  searchQuery: string;          // Tüm alanlarda arama
  selectedSources: string[];    // Form türü filtresi (checkins, messages, vb.)
  selectedLocations: string[];  // Lokasyon filtresi
  urgencyFilter: string | null; // low / medium / high
  confidenceFilter: string | null;
}
```

Search mantığı:
- Case-insensitive
- Tüm text alanlarında arama (isim, lokasyon, not, mesaj, ihbar)
- Normalize edilmiş isimler üzerinden de eşleşme

#### 4.4 Hierarchical Expand (5 dk)

3 seviyeli drill-down:
```
▸ Sightings (9)                      ← Seviye 1: Kategori
  ├── ▸ Ankara Kalesi (2)            ← Seviye 2: Lokasyon grubu
  │    ├── [RecordCard] Podo+Kağan A. 21:05  ← Seviye 3: Kayıt
  │    └── [RecordCard] Podo+Kagan 21:11
  ├── ▸ Kuğulu Park (2)
  └── ...
```

#### 4.5 Git commit: `feat: detail modals, person profiles, search & filter`

---

### FAZ 5 — Bonus Özellikler (20 dk)

#### 5.1 Timeline (8 dk)

Podo'nun kronolojik rota görselleştirmesi — dikey timeline:

```
  ●─── 19:05 │ CerModern           │ Etkinliğe girdi (Checkin)
  │                                 │
  ●─── 20:02 │ CerModern           │ Aslı'ya mesaj attı
  │                                 │
  ●─── 20:10 │ Tunalı Hilmi        │ Aslı ile yürüdü (Sighting)
  │                                 │
  ●─── 20:29 │ Kuğulu Park         │ Fatih ile görüldü
  │                                 │
  ●─── 20:37 │ Seğmenler Parkı     │ Hami ile görüldü
  │                                 │
  ●─── 20:44 │ —                   │ Kağan'dan HIGH mesaj ⚠️
  │                                 │
  ●─── 20:51 │ Atakule             │ Kağan ile görüldü
  │                                 │
  ●─── 20:56 │ Atakule             │ Can'a mesaj attı
  │                                 │
  ●─── 21:05 │ Ankara Kalesi       │ Kağan A. ile görüldü
  │                                 │
  ●─── 21:11 │ Ankara Kalesi       │ Kagan ile görüldü (SON GÖRÜLME) ⚠️
  │                                 │
  ✕─── ???   │ ???                 │ KAYIP
```

Veri kaynağı: Podo'nun adının geçtiği tüm kayıtları `timestamp`'e göre sırala.

#### 5.2 Suspicion Panel (7 dk)

Özet kartlar:

```
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ 🕐 Son Görülme │  │ 🔴 En Şüpheli │  │ 📍 Son Konum  │
│                │  │                │  │                │
│ 21:11          │  │ Kağan          │  │ Ankara Kalesi  │
│ Ankara Kalesi  │  │ 3× high conf.  │  │ 39.94, 32.86  │
│ Kağan ile      │  │ 2× high urgency│  │                │
└────────────────┘  └────────────────┘  └────────────────┘
```

Hesaplama mantığı:
- **Son görülme:** Podo'nun son sighting veya mesaj timestamp'i
- **En şüpheli:** high confidence tip + high urgency mesaj sayısı en yüksek kişi
- **Son konum:** Son görülme kaydının koordinatları

#### 5.3 Harita (5 dk)

Leaflet ile Ankara haritası:
- Merkez: `39.925, 32.860` (Ankara merkez)
- Her sighting/checkin coordinate'i bir marker
- Marker renkleri: kırmızı=son görülme, mavi=normal, sarı=şüpheli kişi
- Marker'a tıklayınca tooltip: kişi adı + zaman + lokasyon
- Podo'nun rotası çizgi ile bağlı (polyline)

#### 5.4 Git commit: `feat: bonus — timeline, suspicion panel, map view`

---

### FAZ 6 — Polish & Submit (15 dk)

| Adım | Detay |
|---|---|
| 1 | Loading/error/empty state'lerin her component'te çalıştığını kontrol et |
| 2 | Responsive kontrol — mobile'da accordion'lar full-width, modal drawer |
| 3 | README.md güncelle — kurulum, çalıştırma komutu, mimari açıklaması |
| 4 | Temp dosyaları temizle (tmp_*.json) |
| 5 | `npm run build` — production build hatasız çalışıyor mu? |
| 6 | **Git commits:** `docs: README update`, `chore: final cleanup` |

---

## UI Akışı (Tam Ekran Wireframe)

```
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  🐾 [PODO FOTOĞRAFI]                                   │
│  Missing Podo: The Ankara Case                          │
│  "Help us find Podo — investigate the clues"            │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🔍 [Search across all records...]        [⚙ Filters]  │
│                                                         │
│  [Checkins] [Messages] [Sightings] [Notes] [Tips] [All] │ ← Kaynak filtre
│  [CerModern] [Atakule] [Kuğulu] [...lokasyonlar]       │ ← Lokasyon filtre
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ 🕐 Son       │ │ 🔴 En        │ │ 📍 Son       │    │
│  │ Görülme      │ │ Şüpheli      │ │ Konum        │    │
│  │ 21:11        │ │ Kağan        │ │ Ankara Kalesi│    │
│  │ Kağan ile    │ │ 5 ipucu      │ │              │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▸ Checkins (9)                                         │
│                                                         │
│  ▸ Messages (14)                                        │
│                                                         │
│  ▾ Sightings (9)                        ← Açık          │
│    ├── ▸ Tunalı Hilmi Caddesi (1)                       │
│    ├── ▾ Ankara Kalesi (2)              ← Alt-grup açık  │
│    │    ├── ┌─────────────────────────────────┐         │
│    │    │   │ 👁 Podo + Kağan A.   21:05     │         │
│    │    │   │ 📍 Ankara Kalesi    [HIGH] ⚠️  │ ← Kart  │
│    │    │   └─────────────────────────────────┘         │
│    │    └── ┌─────────────────────────────────┐         │
│    │        │ 👁 Podo + Kagan      21:11     │         │
│    │        │ 📍 Ankara Kalesi    [HIGH] ⚠️  │ ← Tıkla │
│    │        └─────────────────────────────────┘  → Modal│
│    ├── ▸ Kuğulu Park (2)                                │
│    ├── ▸ Seğmenler Parkı (1)                            │
│    ├── ▸ Atakule (1)                                    │
│    └── ▸ CerModern (1)                                  │
│                                                         │
│  ▸ Personal Notes (8)                                   │
│                                                         │
│  ▸ Anonymous Tips (5)                                   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🕐 TIMELINE — Podo'nun Rotası                         │
│                                                         │
│  ●── 19:05  CerModern — Etkinliğe girdi                │
│  │                                                      │
│  ●── 20:10  Tunalı Hilmi — Aslı ile                    │
│  │                                                      │
│  ●── 20:29  Kuğulu Park — Fatih ile                    │
│  │                                                      │
│  ●── 20:37  Seğmenler — Hami ile                       │
│  │                                                      │
│  ●── 20:51  Atakule — Kağan ile ⚠️                     │
│  │                                                      │
│  ●── 21:11  Ankara Kalesi — Kağan ile (SON) ⚠️         │
│  │                                                      │
│  ✕── ???    KAYIP                                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  📍 MAP VIEW                                            │
│  ┌─────────────────────────────────────────────┐        │
│  │           Ankara Haritası (Leaflet)         │        │
│  │    📌CerModern    📌Tunalı                  │        │
│  │            📌Kuğulu     📌Seğmenler         │        │
│  │       📌Atakule        🔴Ankara Kalesi      │        │
│  │                    📌Hamamönü                │        │
│  └─────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
```

---

## Dosya Öncelik Sırası

Hangi dosya önce yazılmalı (dependency order):

```
1. api/config.ts                    ← Sabitler (bağımlılık yok)
2. types/*.ts                       ← Tipler (bağımlılık yok)
3. utils/normalizeName.ts           ← Sadece string işlemi
4. utils/parseCoordinates.ts        ← Sadece string işlemi
5. utils/parseTimestamp.ts           ← Sadece string işlemi
6. utils/normalizeSubmission.ts      ← types'a bağlı
7. api/jotformClient.ts             ← config + normalizeSubmission'a bağlı
8. api/hooks/useCheckins.ts (vb.)   ← jotformClient'a bağlı
9. api/hooks/useAllData.ts          ← Tüm hook'lara bağlı
10. utils/buildPersonProfiles.ts    ← types + normalizeName'e bağlı
11. context/FilterContext.tsx        ← Bağımsız
12. components/atoms/*              ← Bağımsız
13. components/molecules/*          ← Atoms'a bağlı
14. components/organisms/*          ← Molecules + hooks'a bağlı
15. components/templates/*          ← Organisms'a bağlı
16. components/pages/*              ← Her şeye bağlı
17. App.tsx + main.tsx              ← Pages'a bağlı
```

---

## Kapsam Kararları

### ✅ Dahil (Core)
- 5 form'dan veri çekme ve normalize etme
- Hierarchical accordion UI (kategori → lokasyon → kayıt)
- Global search (tüm alanlarda full-text)
- Filtreler (form türü, lokasyon, urgency/confidence)
- RecordDetailModal (kayıt + ilişkili kayıtlar)
- PersonDetailModal (kişinin tüm kayıtları)
- Loading / Error / Empty states

### ⭐ Dahil (Bonus)
- Podo timeline (kronolojik rota)
- Suspicion panel (son görülme, en şüpheli, son konum)
- Harita view (Leaflet, marker'lar, Podo rotası polyline)
- Fuzzy name matching (Kağan/Kagan/Kağan A.)

### ❌ Hariç (Kapsam dışı)
- Backend / server
- Authentication UI (API key hardcoded)
- Veri düzenleme / kaydetme
- Dark/light mode toggle
- i18n / çoklu dil desteği
- Unit testler (zaman kısıtı)

---

## Verification Checklist

| # | Kontrol | Durum |
|---|---|---|
| 1 | `npm run dev` → uygulama hatasız açılır | ☐ |
| 2 | 5 form verisi yükleniyor → spinner → veriler | ☐ |
| 3 | Search'e "Kağan" yaz → Kağan/Kagan/Kağan A. kayıtları çıkar | ☐ |
| 4 | Accordion aç/kapa → düzgün animasyon | ☐ |
| 5 | RecordCard'a tıkla → modal açılır | ☐ |
| 6 | Modal'da ilişkili kayıtlar gösterilir | ☐ |
| 7 | Person adına tıkla → kişi profil modal'ı | ☐ |
| 8 | Filtreler çalışır (lokasyon, urgency, form türü) | ☐ |
| 9 | Hata durumunda → ErrorMessage | ☐ |
| 10 | Boş sonuç → EmptyState | ☐ |
| 11 | Timeline → Podo'nun rotası kronolojik görünür | ☐ |
| 12 | Suspicion panel → doğru bilgi gösterir | ☐ |
| 13 | `npm run build` → hatasız production build | ☐ |
| 14 | README.md → nasıl çalıştırılır açıkça yazılı | ☐ |
