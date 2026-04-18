# Missing Podo: The Ankara Case — Veri Analizi

> Bu döküman, challenge kapsamında kullanılacak 5 Jotform formunun yapısını, içeriğini ve birbirleriyle olan ilişkilerini detaylı biçimde açıklamaktadır.

---

## API Bilgileri

| Bilgi | Değer |
|---|---|
| Base URL | `https://api.jotform.com` |
| API Key (aktif) | `54a934fa20b1ccc3a5bd1d2076f90556` |
| Submissions endpoint | `GET /form/{formID}/submissions?apiKey={key}` |
| Sorgu parametresi | `?limit=1000` tüm kayıtları getirir |

---

## Formlar & Kayıt Sayıları

| Form Adı | Form ID | Kayıt Sayısı |
|---|---|---|
| Checkins | `261065067494966` | **9** |
| Messages | `261065765723966` | **14** |
| Sightings | `261065244786967` | **9** |
| Personal Notes | `261065509008958` | **8** |
| Anonymous Tips | `261065875889981` | **5** |
| **TOPLAM** | | **45** |

---

## Form Yapıları

### 1. Checkins (`261065067494966`) — 9 kayıt
Bir kişinin belirli bir lokasyona check-in yaptığını gösteren kayıtlar.

| qid | Alan Adı (`name`) | Etiket | Tür |
|---|---|---|---|
| 2 | `personName` | Person Name | textbox |
| 3 | `timestamp` | Timestamp | textbox |
| 4 | `location` | Location | textbox |
| 5 | `coordinates` | Coordinates | textbox |
| 6 | `note` | Note | textbox |

**Gerçek Veriler:**
```
Podo   | 18-04-2026 19:05 | CerModern
Can    | 18-04-2026 19:08 | CerModern
Cem    | 18-04-2026 19:10 | CerModern
Hami   | 18-04-2026 19:11 | CerModern
Gülşah | 18-04-2026 19:13 | CerModern
Aslı   | 18-04-2026 19:14 | CerModern
Kağan  | 18-04-2026 19:07 | CerModern
Fatih  | 18-04-2026 19:16 | CerModern
```
**Çıkarım:** Tüm karakterler etkinliğe CerModern'de yaklaşık aynı saatte (19:05–19:16) giriş yapmış. Podo 19:05'te ilk giren kişi.

---

### 2. Messages (`261065765723966`) — 14 kayıt
İki kişi arasında gönderilen mesajları tutar.

| qid | Alan Adı (`name`) | Etiket | Tür |
|---|---|---|---|
| 2 | `senderName` | Sender Name | textbox |
| 3 | `recipientName` | Recipient Name | textbox |
| 4 | `timestamp` | Timestamp | textbox |
| 5 | `location` | Location | textbox |
| 6 | `coordinates` | Coordinates | textbox |
| 7 | `text` | Text | textbox |
| 8 | `urgency` | Urgency | textbox (`low` / `medium` / `high`) |

**Gerçek Veriler:**
```
Podo   → Aslı   | 20:02 | CerModern           | urgency: low
Aslı   → Podo   | 20:04 | CerModern           | urgency: low
Podo   → Cem    | 20:18 | Tunalı Hilmi        | urgency: low
Cem    → Podo   | 20:19 | CerModern           | urgency: medium
Podo   → Fatih  | 20:31 | Kuğulu Park         | urgency: low
Fatih  → Podo   | 20:32 | Kuğulu Park         | urgency: medium
Kağan  → Podo   | 20:44 | Seğmenler Parkı     | urgency: HIGH ⚠️
Podo   → Kağan  | 20:45 | Seğmenler Parkı     | urgency: medium
Gülşah → Aslı   | 20:53 | Atakule             | urgency: HIGH ⚠️
Aslı   → Gülşah | 20:54 | Atakule             | urgency: medium
Podo   → Can    | 20:56 | Atakule             | urgency: medium
Can    → Podo   | 20:57 | Tunalı Hilmi        | urgency: medium
Kagan  → Eray   | 21:02 | Atakule             | urgency: HIGH ⚠️
Eray   → Kagan  | 21:03 | Atakule             | urgency: medium
```
**Çıkarım:** Kağan→Podo (20:44, `high`) ve Kagan→Eray (21:02, `high`) mesajları kritik. Kağan birden fazla kişiyle yüksek aciliyetli mesajlaşıyor. Not: "Kağan" ve "Kagan" yazım farkı var → fuzzy matching gerekebilir.

---

### 3. Sightings (`261065244786967`) — 9 kayıt
Podo'nun (ya da başka birinin) kiminle, nerede görüldüğünü kaydeder.

| qid | Alan Adı (`name`) | Etiket | Tür |
|---|---|---|---|
| 2 | `personName` | Person Name | textbox |
| 3 | `seenWith` | Seen With | textbox |
| 4 | `timestamp` | Timestamp | textbox |
| 5 | `location` | Location | textbox |
| 6 | `coordinates` | Coordinates | textbox |
| 7 | `note` | Note | textbox |

**Gerçek Veriler:**
```
Podo  seenWith: Aslı      | 20:10 | Tunalı Hilmi Caddesi
Podo  seenWith: Fatih     | 20:29 | Kuğulu Park
Podo  seenWith: Hami      | 20:37 | Seğmenler Parkı
Podo  seenWith: Kağan     | 20:51 | Atakule
Podo  seenWith: Kağan A.  | 21:05 | Ankara Kalesi
Kağan seenWith: Unknown   | 21:22 | Hamamönü          ← Podo yok, Kağan tek başına
Cem   seenWith: Event Staff| 20:50 | CerModern
Fatih seenWith: Aslı      | 20:48 | Kuğulu Park
Podo  seenWith: Kagan     | 21:11 | Ankara Kalesi     ← tekrar Kağan (farklı yazım)
```
**Çıkarım:** Podo'nun **son görüldüğü yer 21:11'de Ankara Kalesi** (Kağan ile). Ardından Kağan 21:22'de Hamamönü'nde **yalnız** görülüyor — Podo yok. Bu kayboluş noktasının kanıtı.

---

### 4. Personal Notes (`261065509008958`) — 8 kayıt
Karakterlerin kendi gözlemlerini/notlarını kaydettiği form.

| qid | Alan Adı (`name`) | Etiket | Tür |
|---|---|---|---|
| 2 | `authorName` | Author Name | textbox |
| 3 | `timestamp` | Timestamp | textbox |
| 4 | `location` | Location | textbox |
| 5 | `coordinates` | Coordinates | textbox |
| 6 | `note` | Note | textbox |
| 7 | `mentionedPeople` | Mentioned People | textbox |

**Gerçek Veriler:**
```
Aslı   | 20:22 | Tunalı Hilmi    | mentioned: Podo
                 → "Podo ile kısa yürüdük. Gayet rahattı."

Fatih  | 20:34 | Kuğulu Park     | mentioned: Podo, Aslı
                 → "Herkes çantayı yanlış anladı. İçindeki sadece sürpriz konfetiydi."

Hami   | 20:39 | Seğmenler Parkı | mentioned: Podo, Kağan
                 → "Podo iyi görünüyordu ama Kağan'ın ona sonradan bir şey gösterdiğini duydum."

Gülşah | 20:55 | Atakule         | mentioned: Podo, Kağan
                 → "Podo'yu Kağan'la birlikte gördüm. Kağan sürekli 'son durak' diyordu."

Can    | 21:00 | Tunalı Hilmi    | mentioned: Podo, Kağan
                 → "Podo mesaj attı. Kağan'la bir yere geçeceğini söyledi."

Eray   | 21:06 | Atakule         | mentioned: Kağan
                 → "Kağan bana biri sorarsa Hamamönü'nde dedi dememi söyledi." ⚠️

Cem    | 20:52 | CerModern       | —
                 → "Ben hâlâ teknik taraftayım. Eğer birazdan biri kaybolursa yine ben de haberim olmayacak."

Kağan  | 20:58 | Atakule         | mentioned: Podo
                 → "Birazdan her şey planladığım gibi olursa gecenin en büyük olayı olacak." ⚠️⚠️
```
**Çıkarım:** Kağan'ın notu açıkça bir şeyler planladığını ima ediyor. Eray'ın notu, Kağan'ın yanlış yön verdiğini gösteriyor.

---

### 5. Anonymous Tips (`261065875889981`) — 5 kayıt
Güvenilirliği değişen anonim ihbarlar.

| qid | Alan Adı (`name`) | Etiket | Tür |
|---|---|---|---|
| 1 | `submissionDate` | Submission Date | textbox |
| 2 | `timestamp` | Timestamp | textbox |
| 3 | `location` | Location | textbox |
| 4 | `coordinates` | Coordinates | textbox |
| 5 | `suspectName` | Suspect Name | textbox |
| 6 | `tip` | Tip | textbox |
| 7 | `confidence` | Confidence | textbox (`low` / `medium` / `high`) |

**Gerçek Veriler:**
```
Fatih    | Seğmenler Parkı | confidence: medium
          → "Yanındaki çanta şüpheliydi ama sadece sürpriz konfetiymiş."

Kağan    | Atakule         | confidence: HIGH ⚠️
          → "Podo ile en son uzun süre yalnız kalan kişi oydu."

Kagan    | Ankara Kalesi   | confidence: HIGH ⚠️
          → "Kaleye çıkan tarafta Podo ile birlikteydi. Podo biraz tedirgin gibiydi."

Kağan A. | Hamamönü        | confidence: medium
          → "Telefonunda birine 'hallettim' dediğini duydum." ⚠️

Cem      | CerModern       | confidence: low
          → "Sürekli ekipmanlarla uğraşıyordu ama şehirde gezmiyordu gibi geldi."
```

---

## Karakterler

| İsim | Rol |
|---|---|
| **Podo** | Kaybolan kişi / maskot |
| **Kağan** | En çok şüphe işaret eden kişi (farklı yazımlar: Kağan, Kagan, Kağan A.) |
| **Aslı** | Podo ile birlikte görülmüş, mesajlaşmış |
| **Fatih** | Podo ile birlikte görülmüş, ihbarda adı geçmiş |
| **Hami** | Podo ile Seğmenler'de görülmüş |
| **Cem** | CerModern'de kalmış, teknik ekip |
| **Gülşah** | Kağan ve Podo'yu Atakule'de birlikte görmüş |
| **Can** | Podo'dan mesaj almış, Atakule'deydi |
| **Eray** | Kağan'dan yanlış yön bilgisi almış |

---

## Podo'nun Kronolojik Rotası

```
19:05  CerModern          → Etkinliğe girdi (Checkin)
20:02  CerModern          → Aslı'ya mesaj attı
20:10  Tunalı Hilmi       → Aslı ile yürüdü (Sighting)
20:18  Tunalı Hilmi       → Cem'e mesaj attı
20:29  Kuğulu Park        → Fatih ile görüldü (Sighting)
20:31  Kuğulu Park        → Fatih'e mesaj attı
20:37  Seğmenler Parkı    → Hami ile görüldü (Sighting)
20:44                     → Kağan'dan HIGH urgency mesaj aldı ⚠️
20:51  Atakule            → Kağan ile görüldü (Sighting)
20:56  Atakule            → Can'a mesaj attı
21:05  Ankara Kalesi      → Kağan A. ile görüldü (Sighting)
21:11  Ankara Kalesi      → Kagan ile görüldü (son görülme) ⚠️
???    ???                → KAYIP
```

---

## Formlar Arası İlişki Haritası

```
┌─────────────┐     personName     ┌─────────────────┐
│  Checkins   │◄───────────────────│    Sightings    │
│ personName  │                    │ personName      │
└─────────────┘                    │ seenWith        │
                                   └─────────────────┘
                                            │
                ┌──────────────────────────►│
                │                           │
┌─────────────┐ │  senderName/recipientName ▼
│  Messages   │─┘───────────────────────────────
│ senderName  │                    ┌─────────────────┐
│ recipientName│◄──────────────────│ Personal Notes  │
└─────────────┘  authorName        │ authorName      │
                                   │ mentionedPeople │
                                   └─────────────────┘
                                            │
                                   ┌─────────────────┐
                                   │ Anonymous Tips  │
                                   │ suspectName     │◄── suspectName ile bağlan
                                   └─────────────────┘

ORTAK BAĞLANTI ALANLARI (tüm formlarda mevcut):
  timestamp    ──► Zaman bazlı sıralama & timeline
  location     ──► Mekan bazlı gruplama
  coordinates  ──► Harita üzerinde pin (lat,lon formatında parse et)
```

---

## Linking Stratejisi (Uygulamada Nasıl Bağlanır)

### İsim bazlı bağlantı
Şu alanlardaki isimler birbiriyle eşleştirilmeli:
- `Checkins.personName`
- `Sightings.personName` + `Sightings.seenWith`
- `Messages.senderName` + `Messages.recipientName`
- `PersonalNotes.authorName` + `PersonalNotes.mentionedPeople`
- `AnonymousTips.suspectName`

> ⚠️ **Dikkat:** "Kağan", "Kagan", "Kağan A." aynı kişi olabilir — fuzzy matching veya normalize etme gerekli.

### Zaman + Mekan bazlı bağlantı
- Aynı `timestamp` + `location` kombinasyonuna sahip kayıtlar büyük ihtimalle aynı olayı temsil eder.
- `coordinates` alanı `"39.93159,32.84967"` formatında gelir → `lat = parseFloat(split[0])`, `lon = parseFloat(split[1])`

---

## Dikkat Edilmesi Gereken Teknik Detaylar

| Konu | Detay |
|---|---|
| API yanıt yapısı | `response.content` → submission array |
| Her submission'da | `answers[qid].answer` → gerçek değer |
| `answers[qid].name` | field adı (örn. `personName`) |
| coordinates parse | `"39.93159,32.84967"` → `.split(',').map(Number)` |
| Fuzzy name matching | Kağan / Kagan / Kağan A. aynı kişi olabilir |
| Urgency değerleri | `low`, `medium`, `high` |
| Confidence değerleri | `low`, `medium`, `high` |
| Timestamp formatı | `"18-04-2026 19:05"` (DD-MM-YYYY HH:mm) |
| submissionDate (Tips) | `"Apr 6, 2026"` — timestamp'tan farklı format |
