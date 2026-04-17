# 🎨 Online Sanat Galerisi ve Atölye Rezervasyon Sistemi

Veritabanı Yönetim Sistemleri dersi proje ödevi kapsamında geliştirilmiş full-stack web uygulaması.

---

## 📋 İçindekiler

- [Proje Hakkında](#-proje-hakkında)
- [Teknoloji Yığını](#-teknoloji-yığını)
- [Proje Yapısı](#-proje-yapısı)
- [Kurulum](#-kurulum)
- [Çalıştırma](#-çalıştırma)
- [Veritabanı Şeması](#-veritabanı-şeması)
- [API Endpointleri](#-api-endpointleri)
- [Test Kullanıcıları](#-test-kullanıcıları)
- [Sistem Gereksinimleri Karşılama](#-sistem-gereksinimleri-karşılama)

---

## 🖼️ Proje Hakkında

Sanat eserlerinin sergilendiği, atölye ve etkinlik rezervasyonlarının yapılabildiği, kullanıcıların yorum ve değerlendirme bırakabildiği kapsamlı bir online galeri platformu.

### Temel Özellikler

| # | Özellik |
|---|---------|
| 1 | Sanat eserlerini inceleme, görsel ve açıklama görüntüleme |
| 2 | Atölye ve etkinlikleri listeleme, detay görüntüleme |
| 3 | Eserleri favorilere ekleme / çıkarma |
| 4 | Atölye ve etkinlik rezervasyonu oluşturma |
| 5 | Rezervasyon güncelleme ve iptal etme |
| 6 | Eser satın alma ve ödeme işlemleri |
| 7 | Kullanıcı kaydı, girişi ve profil yönetimi |
| 8 | Sipariş ve rezervasyon takibi |
| 9 | İndirim kuponu ve kampanya sistemi |
| 10 | Müşteri destek talebi ve mesajlaşma |
| 11 | Eser ve etkinlik karşılaştırma |
| 12 | Eser ve etkinliklere yorum ekleme |
| 13 | Yorumları puanlama ve filtreleme |
| 14 | Yorumlara galeri yöneticisi yanıtı |
| 15 | Doğrulanmış satın alım / katılım bazlı yorum sistemi |
| 16 | İstatistik ve raporlama (görüntülenme, doluluk, puan) |

---

## 🛠️ Teknoloji Yığını

### Backend
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| Python | 3.14 | Ana programlama dili |
| Django | 6.0.4 | Web framework |
| Django REST Framework | 3.17.1 | REST API |
| djangorestframework-simplejwt | 5.5.1 | JWT kimlik doğrulama |
| psycopg2-binary | 2.9.11 | PostgreSQL adaptörü |
| django-cors-headers | 4.9.0 | CORS yönetimi |
| Pillow | 12.2.0 | Görsel işleme |
| python-decouple | 3.8 | Ortam değişkenleri |

### Frontend
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| React | 19 | UI framework |
| TypeScript | 5 | Tip güvenliği |
| Vite | 8 | Build aracı |
| React Router | 6 | Sayfa yönlendirme |
| Axios | - | HTTP istemcisi |
| Zustand | - | State yönetimi |
| react-hot-toast | - | Bildirimler |

### Veritabanı & Altyapı
| Teknoloji | Versiyon | Açıklama |
|-----------|----------|----------|
| PostgreSQL | 16 | İlişkisel veritabanı |
| Docker | - | Konteyner (DB için) |

---

## 📁 Proje Yapısı

```
art-gallery/
├── docker-compose.yml          # PostgreSQL servisi
├── .gitignore
├── README.md
│
├── backend/                    # Django REST API
│   ├── manage.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .env                    # Ortam değişkenleri
│   │
│   ├── sanat_galerisi/         # Proje ayarları
│   │   ├── settings.py
│   │   └── urls.py
│   │
│   ├── users/                  # Kullanıcı yönetimi
│   ├── artworks/               # Eserler, sanatçılar, kategoriler
│   ├── events/                 # Atölye ve etkinlikler
│   ├── reservations/           # Rezervasyon sistemi
│   ├── orders/                 # Sipariş ve ödeme
│   ├── campaigns/              # Kampanya ve kuponlar
│   ├── reviews/                # Yorum sistemi
│   └── support/                # Müşteri desteği
│
└── frontend/                   # React TypeScript
    ├── src/
    │   ├── lib/
    │   │   └── axios.ts         # API istemcisi + interceptor
    │   ├── store/
    │   │   └── authStore.ts     # Zustand auth state
    │   ├── services/            # API servis katmanı
    │   ├── types/               # TypeScript tipleri
    │   ├── components/          # Paylaşılan bileşenler
    │   └── pages/               # Sayfa bileşenleri
    └── package.json
```

---

## ⚙️ Kurulum

### Gereksinimler

- Python 3.14+
- Node.js 20+
- Docker Desktop

### 1. Repoyu klonla

```bash
git clone <repo-url>
cd art-gallery
```

### 2. PostgreSQL'i başlat (Docker)

```bash
docker compose up -d db
```

### 3. Backend kurulumu

```bash
cd backend

# Sanal ortam oluştur
python -m venv venv

# Aktif et (Windows)
.\venv\Scripts\activate

# Aktif et (macOS/Linux)
source venv/bin/activate

# Bağımlılıkları kur
pip install -r requirements.txt

# Ortam değişkenlerini ayarla
copy .env.example .env   # Windows
cp .env.example .env     # macOS/Linux
```

`.env` dosyasını düzenle:

```env
DEBUG=True
SECRET_KEY=django-insecure-change-this-in-production

DB_NAME=sanat_galerisi
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
```

```bash
# Veritabanı tablolarını oluştur
python manage.py migrate

# Admin kullanıcısı oluştur
python manage.py createsuperuser

# Örnek verileri yükle
python manage.py seed
```

### 4. Frontend kurulumu

```bash
cd frontend
npm install
```

---

## 🚀 Çalıştırma

### Backend

```bash
cd backend
.\venv\Scripts\activate      # Windows
source venv/bin/activate     # macOS/Linux

python manage.py runserver
# → http://localhost:8000
```

### Frontend

```bash
cd frontend
npm run dev
# → http://localhost:5173
```

### Django Admin Paneli

```
http://localhost:8000/admin
```

---

## 🗄️ Veritabanı Şeması

### Tablolar

| Tablo | Açıklama |
|-------|----------|
| `users` | Kullanıcılar (AbstractUser) |
| `artists` | Sanatçı bilgileri |
| `categories` | Eser kategorileri |
| `artworks` | Sanat eserleri |
| `artwork_images` | Eser görselleri |
| `favorites` | Kullanıcı favorileri |
| `artwork_comparisons` | Eser karşılaştırmaları |
| `event_categories` | Etkinlik kategorileri |
| `events` | Atölye ve etkinlikler |
| `event_comparisons` | Etkinlik karşılaştırmaları |
| `reservations` | Rezervasyonlar |
| `reservation_history` | Rezervasyon değişiklik geçmişi |
| `orders` | Siparişler |
| `order_items` | Sipariş kalemleri |
| `payments` | Ödeme kayıtları |
| `campaigns` | Kampanyalar |
| `coupons` | İndirim kuponları |
| `reservation_discounts` | Rezervasyona uygulanan kuponlar |
| `artwork_reviews` | Eser yorumları |
| `event_reviews` | Etkinlik yorumları |
| `review_replies` | Yorum yanıtları |
| `review_votes` | Yorum oyları |
| `support_tickets` | Destek talepleri |
| `support_messages` | Destek mesajları |

### PostgreSQL Optimizasyonları

- **BrinIndex** → Tarih alanlarında (`created_at`, `start_datetime`) büyük tablolarda verimli arama
- **GinIndex** → `search_vector` alanlarında full-text search
- **Composite Index** → `(user, status)`, `(event, status)` gibi sık sorgulanan çiftler
- **SearchVectorField** → Eser ve etkinliklerde Türkçe full-text arama

---

## 📡 API Endpointleri

### Kimlik Doğrulama

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/api/auth/register/` | Kayıt ol |
| POST | `/api/auth/login/` | Giriş yap (JWT) |
| POST | `/api/auth/token/refresh/` | Token yenile |
| GET/PATCH | `/api/auth/profile/` | Profil görüntüle / güncelle |
| POST | `/api/auth/change-password/` | Şifre değiştir |

### Eserler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/artworks/` | Eser listesi (filtre, arama, sıralama) |
| GET | `/api/artworks/{id}/` | Eser detayı |
| GET | `/api/artists/` | Sanatçı listesi |
| GET | `/api/categories/` | Kategori listesi |
| GET/POST | `/api/favorites/` | Favoriler |
| DELETE | `/api/favorites/{id}/` | Favoriden çıkar |
| GET/POST | `/api/comparisons/` | Eser karşılaştırma |
| GET | `/api/artworks/stats/` | İstatistikler (yönetici) |

### Etkinlikler

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/events/` | Etkinlik listesi |
| GET | `/api/events/{id}/` | Etkinlik detayı |
| GET/POST | `/api/event-comparisons/` | Etkinlik karşılaştırma |

### Rezervasyonlar

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET/POST | `/api/reservations/` | Rezervasyon listesi / oluştur |
| PATCH | `/api/reservations/{id}/` | Rezervasyon güncelle |
| POST | `/api/reservations/{id}/cancel/` | Rezervasyon iptal |
| GET | `/api/reservations/{id}/history/` | Değişiklik geçmişi |

### Siparişler & Ödeme

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET/POST | `/api/orders/` | Sipariş listesi / oluştur |
| POST | `/api/orders/{id}/pay/` | Ödeme yap |
| GET | `/api/payments/` | Ödeme geçmişi |

### Kampanyalar

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/campaigns/` | Kampanya listesi |
| POST | `/api/campaigns/validate_coupon/` | Kupon doğrula |

### Yorumlar

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET/POST | `/api/artwork-reviews/` | Eser yorumları |
| POST | `/api/artwork-reviews/{id}/vote/` | Faydalı oy ver |
| POST | `/api/artwork-reviews/{id}/reply/` | Yoruma yanıt (yönetici) |
| GET/POST | `/api/event-reviews/` | Etkinlik yorumları |
| POST | `/api/event-reviews/{id}/vote/` | Faydalı oy ver |

### Destek

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET/POST | `/api/support/` | Destek talepleri |
| GET | `/api/support/{id}/` | Talep detayı |
| POST | `/api/support/{id}/send_message/` | Mesaj gönder |
| POST | `/api/support/{id}/resolve/` | Talebi çöz (yönetici) |

---

## 👥 Test Kullanıcıları

Seed komutu (`python manage.py seed`) çalıştırıldıktan sonra aşağıdaki kullanıcılar oluşur:

| E-posta | Şifre | Rol |
|---------|-------|-----|
| `ahmet@test.com` | `Test1234!` | Müşteri |
| `zeynep@test.com` | `Test1234!` | Müşteri |
| `mehmet@test.com` | `Test1234!` | Müşteri |
| `elif@test.com` | `Test1234!` | Müşteri |
| `can@test.com` | `Test1234!` | Müşteri |
| `galeri@test.com` | `Test1234!` | Galeri Yöneticisi |
| `admin@gallery.com` | *(kurulum sırasında belirlenir)* | Admin |

### Örnek Kuponlar

| Kod | İndirim | Açıklama |
|-----|---------|----------|
| `SANAT15` | %15 | Tüm eser ve etkinlikler |
| `YENIMÜŞTERI` | %20 | Yeni müşteri indirimi |
| `OGRENCI10` | %10 | Öğrenci indirimi |

---

## ✅ Sistem Gereksinimleri Karşılama

| Gereksinim | Durum | Notlar |
|------------|-------|--------|
| 1. Eserleri İnceleme | ✅ | Görsel, açıklama, sanatçı bilgisi |
| 2. Atölye/Etkinlik Görüntüleme | ✅ | Tarih, saat, kontenjan, ücret |
| 3. Favorilere Ekleme | ✅ | Ekleme, listeleme, çıkarma |
| 4. Rezervasyon Oluşturma | ✅ | Katılımcı sayısı, tarih seçimi |
| 5. Rezervasyon Güncelleme | ✅ | Güncelleme, iptal, geçmiş |
| 6. Satın Alma ve Ödeme | ✅ | Ödeme yöntemi seçimi, onay |
| 7. Hesap Yönetimi | ✅ | Kayıt, giriş, profil, şifre |
| 8. Sipariş/Rezervasyon Takibi | ✅ | Durum, geçmiş listeleme |
| 9. İndirim ve Kampanyalar | ✅ | Kupon, kampanya, özel fırsatlar |
| 10. Müşteri Destek | ✅ | Form, mesajlaşma, durum takibi |
| 11. Karşılaştırma | ✅ | Eser ve etkinlik karşılaştırma |
| 12. Yorum Ekleme | ✅ | Eser ve etkinlik yorumları |
| 13. Yorum Filtreleme | ✅ | Puan, tarih, faydalı sıralama |
| 14. Yorumlara Yanıt | ✅ | Galeri yöneticisi yanıtı |
| 15. Doğrulama | ✅ | Giriş zorunluluğu, katılım kontrolü |
| 16. İstatistik ve Raporlama | ✅ | Görüntülenme, doluluk, puan |

---

## 📝 Notlar

- Ödeme sistemi simülasyon amaçlıdır, gerçek ödeme entegrasyonu içermez.
- Görsel yükleme için `backend/media/` klasörü kullanılır.
- Docker sadece PostgreSQL için kullanılmaktadır; backend ve frontend yerel ortamda çalışır.
- `DB_HOST=localhost` yerel geliştirme içindir. Docker Compose ile tam deployment'ta `db` olarak değiştirilmelidir.
