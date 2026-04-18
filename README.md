# Jotform Frontend Challenge Project

## User Information
Please fill in your information after forking this repository:

- **Name**: Kelami Batuhan Bölükbaşı

## Project Description

**Missing Podo — The Ankara Case** kayıp bir kedinin (Podo) izini süren interaktif bir dedektif panosu uygulamasıdır. Jotform API'sinden çekilen 5 farklı veri kaynağını (check-in'ler, mesajlar, görgü tanıklıkları, kişisel notlar, anonim ihbarlar) görselleştirerek kullanıcının ipuçlarını takip etmesini, şüphelileri analiz etmesini ve Podo'nun son rotasını harita üzerinde izlemesini sağlar.

Uygulama 4 sayfalı bir SPA olarak tasarlanmıştır:
- **Home** — Sinematik giriş sayfası, altın parçacık animasyonu ve Google tarzı arama
- **Records (Investigation Board)** — Dedektif ağı / bilgi grafiği: kök düğümden kategorilere, oradan kayıtlara uzanan ağaç yapısı, SVG bağlantı çizgileri ve 3D kart efektleri
- **Timeline** — Podo'nun kronolojik olay çizelgesi, scroll-beam animasyonu ve şüphe analiz paneli
- **Map** — Ankara üzerinde tam ekran Leaflet harita, konum kümeleri, Podo'nun rota çizgisi ve detay paneli

## Getting Started

### Gereksinimler
- **Node.js** ≥ 18
- **npm** ≥ 9

### Kurulum ve Çalıştırma

```bash
# 1. Repoyu klonlayın
git clone https://github.com/KBatuhanB/2026-frontend-challenge-ankara.git
cd 2026-frontend-challenge-ankara

# 2. Bağımlılıkları yükleyin
npm install

# 3. Geliştirme sunucusunu başlatın
npm run dev
```

Uygulama varsayılan olarak `http://localhost:5173` adresinde açılır.

### Diğer Komutlar

```bash
# Production build
npm run build

# Build önizleme
npm run preview
```

---

# 🔍 Proje Detayları — Ne Yaptım, Neden Yaptım, Nasıl Yaptım

## Teknoloji Tercihleri

| Teknoloji | Tercih Sebebi |
|---|---|
| **React 18 + TypeScript** | Tip güvenliği ile büyük veri modellerinde (5 farklı kayıt tipi) hataları derleme zamanında yakalamak için. `readonly` tipler ile immutability garanti altında. |
| **Vite** | Hızlı HMR ve minimal konfigürasyon. Hackathon tempona uygun. |
| **React Router v7** | 4 sayfalı SPA navigasyonu. Sayfa bazlı code-splitting imkanı. |
| **TanStack React Query** | Jotform API çağrılarını cache'leyip gereksiz tekrarları önlemek, paralel fetching ve otomatik retry (2 deneme, 5 dk staleTime). |
| **Framer Motion** | Sayfa geçişleri, ağaç düğüm animasyonları, harita paneli slide-in efektleri — deklaratif API ile temiz kod. |
| **Leaflet + React Leaflet** | Hafif, açık kaynak harita kütüphanesi. Google Maps API key gerektirmez, hackathon için ideal. |
| **CSS Modules** | Tailwind yerine CSS Modules tercih ettim çünkü her bileşenin stili izole, class çakışması yok ve tasarım token'ları (`--color-*`, `--space-*`) ile tutarlı tema yönetimi sağlıyor. |
| **Context + useReducer** | ~45 kayıt için Redux/Zustand gereksiz karmaşıklık olurdu. useReducer ile discriminated union action'lar ve type-safe dispatch yeterli. |

## Mimari Kararlar

### Atomic Design Yapısı
Projeyi **atoms → molecules → organisms → pages → templates** katmanlarıyla organize ettim:
- **Atoms**: Badge, Spinner, Modal, SearchInput, Tag, EmptyState, ErrorMessage
- **Molecules**: RecordCard, FilterBar, PersonChip, TimelineEntry
- **Organisms**: InvestigationBoard, MapView, SuspicionPanel, SearchResults, Timeline
- **Pages**: HomePage, RecordsPage, TimelinePage, MapPage

Bu sayede her bileşen tek bir sorumluluğa sahip (SRP), tekrar kullanılabilir ve bağımsız test edilebilir.

### Smart / Dumb Component Ayrımı
Veri çekme ve state yönetimi **page** seviyesinde, render **organism** seviyesinde. Örneğin `MapPage` (smart) tüm state'i yönetir, `MapView` (dumb) sadece props alıp Leaflet render eder. Bu ayrım test edilebilirliği ve bakım kolaylığını artırır.

### Aceternity UI Adaptasyonu
SparklesCore, FloatingDock, ThreeDCard ve AceternityTimeline bileşenlerini Aceternity UI'dan alıp **Tailwind → CSS Modules** dönüşümü yaptım. Böylece projenin mevcut tasarım token sistemiyle uyumlu hale geldi.

## Öne Çıkan Özellikler

### 🕵️ Investigation Board (Dedektif Ağı)
Accordion tabanlı klasik listeleme yerine **ağaç yapısı bilgi grafiği** tasarladım. Kök düğüm ("Missing Podo") → 5 kategori düğümü → bireysel kayıt kartları. SVG quadratic bézier eğrileri ile bağlantılar, tıklanabilir 3D kartlar, genişletilebilir kategori düğümleri. Filtre çubuğu ile kaynak türüne göre anlık filtreleme.

### 🗺️ İnteraktif Harita
Leaflet haritası üzerinde konum kümeleri (location clusters), Podo'nun GPS rotası (polyline) ve tıklanabilir marker'lar. Her marker'a tıklayınca slide-in detay paneli açılır: o konumdaki kişiler, kronolojik aktivite logu, istatistikler. Son görülme noktasında pulse animasyonu.

### 📊 Şüphe Analiz Paneli
`computeSuspicionData` utility fonksiyonu ile tüm kaynaklardan otomatik hesaplama: Son Görülme (zaman + konum + yanındaki kişi), En Şüpheli Kişi (yüksek güvenilirlik ihbarları + yüksek aciliyet mesajları → skor), Son Konum (GPS).

### 🔎 Global Arama ve Filtreleme
FilterContext ile tüm sayfalarda geçerli arama ve filtreleme. Kaynak türü, konum, aciliyet seviyesi ve güvenilirlik seviyesine göre çapraz filtreleme. Arama tüm metin alanlarında (isim, not, mesaj, ihbar) eşleşme yapar.

### ⏱️ Scroll-Beam Timeline
Aceternity Timeline adaptasyonu ile scroll-based ilerleme çubuğu. Sticky başlıklar, kronolojik sıralama. Sonunda "KAYIP" (Missing) hayalet girişi ile dramatik son.

## Veri Yönetimi

- **Jotform REST API** üzerinden 5 ayrı formdan paralel veri çekme
- **normalizeSubmissions** ile Jotform'un `answers[qid].answer` yapısını düz, tipli nesnelere dönüştürme
- **buildPersonProfiles** ile 5 kaynak üzerinden çapraz referans: aynı kişinin tüm check-in, mesaj, tanıklık ve notlarını birleştirme
- **normalizeName** ile Türkçe karakter desteği (ğ→g, ş→s vb.) — "Kağan", "Kagan", "Kağan A." hepsi aynı kişi olarak eşleşir
- Tüm tipler `readonly` — derleme zamanında veri mutasyonu engellenir

## Tasarım Felsefesi — "Case File Noir"

Koyu arka plan (`#0a0e17`), altın aksanlar (`#c8a55a`), kırmızı uyarı vurguları — bir dedektif dosyası estetiği. Üç font katmanı: **Playfair Display** (başlıklar), **DM Sans** (gövde metin), **JetBrains Mono** (veri/zaman damgaları). 8px grid sistemi ile tutarlı boşluklar. Katmanlı gölgeler ve glow efektleri ile derinlik hissi.

---

# 🚀 Challenge Duyurusu

## 📅 Tarih ve Saat
Cumartesi günü başlama saatinden itibaren üç saattir.

## 🎯 Challenge Konsepti
Bu challenge'da, size özel hazırlanmış bir senaryo üzerine web uygulaması geliştirmeniz istenecektir. Challenge başlangıcında senaryo detayları paylaşılacaktır.Katılımcılar, verilen GitHub reposunu fork ederek kendi geliştirme ortamlarını oluşturacaklardır.

## 📦 GitHub Reposu
Challenge için kullanılacak repo: https://github.com/cemjotform/2026-frontend-challenge-ankara

## 🛠️ Hazırlık Süreci
1. GitHub reposunu fork edin
2. Tercih ettiğiniz framework ile geliştirme ortamınızı hazırlayın
3. Hazırladığınız setup'ı fork ettiğiniz repoya gönderin

## 💡 Önemli Notlar
- Katılımcılar kendi tercih ettikleri framework'leri kullanabilirler
