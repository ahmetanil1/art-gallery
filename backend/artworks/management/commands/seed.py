"""
python manage.py seed
Tüm tabloları gerçekçi verilerle doldurur.
Ana kullanıcılar: amtyrgnc@gmail.com ve ahmetyorganci61@gmail.com (şifre: ahmet123ahmet)
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = "Veritabanını gerçekçi verilerle doldurur"

    def handle(self, *args, **kwargs):
        self.stdout.write("🌱 Seed başlıyor...\n")
        self._users()
        self._categories()
        self._artists()
        self._artworks()
        self._favorites()
        self._event_categories()
        self._events()
        self._campaigns()
        self._reservations()
        self._orders()
        self._reviews()
        self._support()
        self.stdout.write(self.style.SUCCESS("\n✅ Seed tamamlandı!"))

    # ── USERS ──────────────────────────────────────────────────────────────
    def _users(self):
        from users.models import User as U

        # Ana kullanıcılar — amtyrgnc ve ahmetyorganci61
        main_users = [
            dict(
                username="amtyrgnc",
                email="amtyrgnc@gmail.com",
                first_name="Ahmet",
                last_name="Yorgancı",
                phone="05301234567",
                address="Kadıköy, İstanbul",
                role="customer",
                is_verified=True,
            ),
            dict(
                username="ahmetyorganci61",
                email="ahmetyorganci61@gmail.com",
                first_name="Ahmet",
                last_name="Yorgancı",
                phone="05309876543",
                address="Beşiktaş, İstanbul",
                role="customer",
                is_verified=True,
            ),
        ]
        for d in main_users:
            if not U.objects.filter(email=d["email"]).exists():
                u = U(**d)
                u.set_password("ahmet123ahmet")
                u.save()
                self.stdout.write(f"  ✅ Ana kullanıcı oluşturuldu: {d['email']}")
            else:
                # Şifreyi güncelle, bilgileri tazele
                u = U.objects.get(email=d["email"])
                for k, v in d.items():
                    setattr(u, k, v)
                u.set_password("ahmet123ahmet")
                u.save()
                self.stdout.write(f"  🔄 Ana kullanıcı güncellendi: {d['email']}")

        # Yardımcı kullanıcılar
        extra_users = [
            dict(username="zeynep_d",  email="zeynep@test.com",  first_name="Zeynep",  last_name="Demir",    phone="05322223344", role="customer",         is_verified=True),
            dict(username="mehmet_y",  email="mehmet@test.com",  first_name="Mehmet",  last_name="Yılmaz",   phone="05333334455", role="customer",         is_verified=True),
            dict(username="elif_s",    email="elif@test.com",    first_name="Elif",    last_name="Şahin",    phone="05344445566", role="customer",         is_verified=True),
            dict(username="can_o",     email="can@test.com",     first_name="Can",     last_name="Öztürk",   phone="05355556677", role="customer",         is_verified=True),
            dict(username="galeri_mgr",email="galeri@test.com",  first_name="Galeri",  last_name="Yönetici", phone="05366667788", role="gallery_manager",  is_verified=True),
        ]
        created = 0
        for d in extra_users:
            if not U.objects.filter(email=d["email"]).exists():
                u = U(**d)
                u.set_password("Test1234!")
                u.save()
                created += 1
        self.stdout.write(f"  👤 {created} yardımcı kullanıcı eklendi  (şifre: Test1234!)")

    # ── CATEGORIES ─────────────────────────────────────────────────────────
    def _categories(self):
        from artworks.models import Category
        cats = [
            ("Yağlı Boya",    "yagliboy",  "Tuval üzerine yağlı boya tekniğiyle üretilmiş eserler."),
            ("Suluboya",      "suluboya",  "Kağıt veya tuval üzerine suluboya tekniğiyle üretilmiş eserler."),
            ("Heykel",        "heykel",    "Bronz, mermer, taş veya karma malzemeden üretilmiş üç boyutlu eserler."),
            ("Fotoğraf",      "fotograf",  "Sanatsal fotoğraf baskıları ve fine art fotoğrafçılık."),
            ("Dijital Sanat", "dijital",   "Dijital ortamda üretilmiş ve baskıya alınmış çağdaş eserler."),
            ("Soyut",         "soyut",     "Soyut ekspresyonizm ve non-figüratif çalışmalar."),
            ("Karma Teknik",  "karma",     "Birden fazla malzeme ve tekniğin bir arada kullanıldığı eserler."),
        ]
        created = 0
        for name, slug, desc in cats:
            _, ok = Category.objects.get_or_create(slug=slug, defaults={"name": name, "description": desc})
            if ok:
                created += 1
        self.stdout.write(f"  🏷️  {created} kategori eklendi")

    # ── ARTISTS ────────────────────────────────────────────────────────────
    def _artists(self):
        from artworks.models import Artist
        # İki ana kullanıcıya bağlı sanatçı profilleri dahil
        artists_data = [
            dict(
                name="Ahmet Yorgancı",
                nationality="Türk",
                birth_year=1990,
                bio=(
                    "İstanbul doğumlu çağdaş ressam. Yağlı boya ve karma teknik üzerine "
                    "yoğunlaşan Yorgancı, eserlerinde Boğaz'ın siluetini ve Anadolu'nun "
                    "renklerini empresyonist bir yorumla aktarır. Mimar Sinan Güzel Sanatlar "
                    "Üniversitesi Resim Bölümü mezunu."
                ),
                website="https://ahmetyorganci.art",
            ),
            dict(
                name="A. Yorgancı (61)",
                nationality="Türk",
                birth_year=1985,
                bio=(
                    "Beşiktaş'ta atölyesi bulunan soyut ekspresyonist. Büyük formatlı tuval "
                    "çalışmaları ve heykel projeleriyle tanınan sanatçı, son yıllarda dijital "
                    "sanat alanında da üretimler vermektedir. Galeri Nev ve Pilot Galeri'de "
                    "kişisel sergiler açmıştır."
                ),
                website="https://yorganci61.com",
            ),
            dict(name="Leyla Çiçek",     nationality="Türk",     birth_year=1982, bio="Suluboya ve karma teknik üzerine çalışmalar yapan İzmir doğumlu sanatçı.", website=""),
            dict(name="Marco Rossi",     nationality="İtalyan",  birth_year=1968, bio="Floransa'da yetişmiş, klasik İtalyan tekniğini çağdaş konularla harmanlayan ressam.", website=""),
            dict(name="Yuki Tanaka",     nationality="Japon",    birth_year=1990, bio="Tokyo merkezli minimalist dijital sanat eserleri ve fine art baskılarıyla tanınan sanatçı.", website=""),
            dict(name="Fatma Arslan",    nationality="Türk",     birth_year=1979, bio="Soyut ekspresyonizm ve heykel alanında çalışan, Ankara doğumlu sanatçı.", website=""),
            dict(name="Carlos Mendez",   nationality="Meksikalı",birth_year=1985, bio="Meksika City'den dünyaya açılan, renkli sokak sanatı ve tuval çalışmalarıyla bilinen sanatçı.", website=""),
        ]
        created = 0
        for d in artists_data:
            _, ok = Artist.objects.get_or_create(name=d["name"], defaults=d)
            if ok:
                created += 1
        self.stdout.write(f"  🎨 {created} sanatçı eklendi")

    # ── ARTWORKS ───────────────────────────────────────────────────────────
    def _artworks(self):
        from artworks.models import Artwork, Artist, Category

        # (title, artist_name, category_slug, price, medium, dimensions, year, status, description, view_count)
        artworks_data = [
            # ── Ahmet Yorgancı eserleri (amtyrgnc@gmail.com) ──────────────
            dict(
                title="Boğaz'da Gün Batımı",
                artist="Ahmet Yorgancı", category="yagliboy",
                price=12500, medium="Yağlı Boya / Tuval", dimensions="80x60 cm",
                year_created=2021, status="available", view_count=342,
                description=(
                    "İstanbul Boğazı'nın büyüleyici gün batımını empresyonist bir yorumla "
                    "aktaran bu eser, turuncu ve mor tonların su yüzeyindeki yansımasını "
                    "canlı fırça darbeleriyle betimler. Sanatçının en çok ilgi gören çalışmalarından."
                ),
            ),
            dict(
                title="Anadolu Kadını",
                artist="Ahmet Yorgancı", category="yagliboy",
                price=18000, medium="Yağlı Boya / Tuval", dimensions="70x90 cm",
                year_created=2020, status="available", view_count=289,
                description=(
                    "Geleneksel Anadolu kıyafetleriyle bir kadın portresini konu alan bu eser, "
                    "kültürel belleği ve kadın kimliğini güçlü bir renk paleti eşliğinde sunar."
                ),
            ),
            dict(
                title="Kapadokya Sabahı",
                artist="Ahmet Yorgancı", category="yagliboy",
                price=22000, medium="Yağlı Boya / Tuval", dimensions="100x80 cm",
                year_created=2022, status="available", view_count=415,
                description=(
                    "Kapadokya'nın peri bacaları ve sıcak hava balonlarının sabah sisinde "
                    "yükselişini konu alan büyük format çalışma. Altın sarısı ve toprak tonları hâkim."
                ),
            ),
            dict(
                title="İstanbul Silueti",
                artist="Ahmet Yorgancı", category="karma",
                price=9800, medium="Akrilik + Kolaj / Tuval", dimensions="90x60 cm",
                year_created=2023, status="reserved", view_count=178,
                description=(
                    "Eski İstanbul fotoğrafları ve akrilik boya kullanılarak oluşturulan karma "
                    "teknik eser. Tarihi yarımadanın silueti kolaj parçalarıyla zenginleştirilmiş."
                ),
            ),
            dict(
                title="Mavi Yolculuk",
                artist="Ahmet Yorgancı", category="yagliboy",
                price=7500, medium="Yağlı Boya / Kağıt", dimensions="50x40 cm",
                year_created=2019, status="sold", view_count=521,
                description=(
                    "Ege kıyılarından ilham alan bu küçük format çalışma, mavi tonların "
                    "sonsuz varyasyonunu keşfeder. Sanatçının erken dönem eserlerinden."
                ),
            ),

            # ── A. Yorgancı (61) eserleri (ahmetyorganci61@gmail.com) ─────
            dict(
                title="Sonsuzluk #1",
                artist="A. Yorgancı (61)", category="soyut",
                price=35000, medium="Akrilik / Tuval", dimensions="150x150 cm",
                year_created=2021, status="available", view_count=634,
                description=(
                    "Büyük formatlı soyut ekspresyonist çalışma. Siyah, beyaz ve kırmızının "
                    "dramatik karşıtlığı üzerine kurulu kompozisyon, izleyiciyi varoluşsal "
                    "bir sorgulamaya davet eder."
                ),
            ),
            dict(
                title="Sonsuzluk #2",
                artist="A. Yorgancı (61)", category="soyut",
                price=38000, medium="Akrilik / Tuval", dimensions="150x150 cm",
                year_created=2021, status="available", view_count=589,
                description=(
                    "Sonsuzluk serisinin ikinci eseri. Birinci çalışmanın renk paletini "
                    "tersine çevirerek beyaz zemin üzerine siyah ve kırmızı lekeler kullanır."
                ),
            ),
            dict(
                title="Özgürlük Heykeli",
                artist="A. Yorgancı (61)", category="heykel",
                price=55000, medium="Bronz", dimensions="60x25x25 cm",
                year_created=2020, status="available", view_count=312,
                description=(
                    "Döküm bronzdan üretilen bu heykel, insan bedeninin soyutlanmış formunu "
                    "özgürlük kavramıyla ilişkilendirir. Sınırlı sayıda (3/5) üretilmiştir."
                ),
            ),
            dict(
                title="Dijital Kaos",
                artist="A. Yorgancı (61)", category="dijital",
                price=8500, medium="Dijital Baskı / Arşiv Kağıdı", dimensions="70x100 cm",
                year_created=2023, status="available", view_count=267,
                description=(
                    "Algoritmik süreçlerle üretilen bu dijital eser, modern dünyanın bilgi "
                    "bombardımanını görsel bir kaosa dönüştürür. 10 adet imzalı baskı."
                ),
            ),
            dict(
                title="Kırmızı Oda",
                artist="A. Yorgancı (61)", category="soyut",
                price=28000, medium="Yağlı Boya / Tuval", dimensions="120x100 cm",
                year_created=2019, status="not_for_sale", view_count=445,
                description=(
                    "Sanatçının kişisel koleksiyonunda yer alan bu eser, kırmızının tüm "
                    "tonlarını tek bir tuvalde buluşturur. Sergileme amaçlı, satışa kapalı."
                ),
            ),

            # ── Diğer sanatçıların eserleri ───────────────────────────────
            dict(
                title="Bahar Rüzgarı",
                artist="Leyla Çiçek", category="suluboya",
                price=4800, medium="Suluboya / Kağıt", dimensions="50x40 cm",
                year_created=2022, status="available", view_count=198,
                description="Baharın tazeliğini suluboya tekniğiyle aktaran narin bir çalışma.",
            ),
            dict(
                title="Kar Yağışı",
                artist="Leyla Çiçek", category="suluboya",
                price=3200, medium="Suluboya / Kağıt", dimensions="40x30 cm",
                year_created=2023, status="available", view_count=143,
                description="Kış sabahının sessizliğini suluboya tekniğiyle aktaran küçük format çalışma.",
            ),
            dict(
                title="Venedik Kanalları",
                artist="Marco Rossi", category="yagliboy",
                price=28000, medium="Yağlı Boya / Tuval", dimensions="100x80 cm",
                year_created=2019, status="available", view_count=387,
                description="Venedik'in tarihi kanallarını klasik İtalyan tekniğiyle betimleyen eser.",
            ),
            dict(
                title="Akdeniz Kıyısı",
                artist="Marco Rossi", category="fotograf",
                price=2800, medium="Fine Art Baskı", dimensions="60x40 cm",
                year_created=2022, status="available", view_count=156,
                description="Akdeniz'in kristal sularını ve kıyısını belgeleyen sanatsal fotoğraf.",
            ),
            dict(
                title="Dijital Evren",
                artist="Yuki Tanaka", category="dijital",
                price=6500, medium="Dijital Baskı", dimensions="70x70 cm",
                year_created=2023, status="available", view_count=224,
                description="Minimalist çizgiler ve geometrik formlarla oluşturulan dijital kompozisyon.",
            ),
            dict(
                title="Şehir Işıkları",
                artist="Yuki Tanaka", category="dijital",
                price=5500, medium="Dijital Baskı", dimensions="60x80 cm",
                year_created=2023, status="available", view_count=189,
                description="Gece şehrinin ışıklarını minimalist dijital teknikle yorumlayan eser.",
            ),
            dict(
                title="Toprak Ana",
                artist="Fatma Arslan", category="heykel",
                price=42000, medium="Bronz", dimensions="50x30x30 cm",
                year_created=2020, status="available", view_count=278,
                description="Anadolu mitolojisinden ilham alan, toprak ve bereket temasını işleyen bronz heykel.",
            ),
            dict(
                title="Renklerin Dansı",
                artist="Carlos Mendez", category="soyut",
                price=9200, medium="Akrilik / Tuval", dimensions="90x70 cm",
                year_created=2022, status="available", view_count=301,
                description="Canlı renkler ve dinamik fırça darbeleriyle oluşturulan soyut kompozisyon.",
            ),
            dict(
                title="Fiesta",
                artist="Carlos Mendez", category="soyut",
                price=11500, medium="Yağlı Boya / Tuval", dimensions="100x100 cm",
                year_created=2020, status="available", view_count=267,
                description="Meksika festivallerinin coşkusunu yansıtan renkli soyut eser.",
            ),
        ]

        created = 0
        for d in artworks_data:
            artist_name = d.pop("artist")
            cat_slug    = d.pop("category")
            artist = Artist.objects.get(name=artist_name)
            cat    = Category.objects.get(slug=cat_slug)
            _, ok  = Artwork.objects.get_or_create(
                title=d["title"],
                defaults={**d, "artist": artist, "category": cat},
            )
            if ok:
                created += 1
        self.stdout.write(f"  🖼️  {created} eser eklendi")

    # ── FAVORITES ──────────────────────────────────────────────────────────
    def _favorites(self):
        from artworks.models import Artwork, Favorite

        amtyrgnc      = User.objects.filter(email="amtyrgnc@gmail.com").first()
        ahmet61       = User.objects.filter(email="ahmetyorganci61@gmail.com").first()
        zeynep        = User.objects.filter(email="zeynep@test.com").first()

        fav_data = []
        if amtyrgnc:
            # amtyrgnc, ahmet61'in eserlerini favorilessin
            for title in ["Sonsuzluk #1", "Özgürlük Heykeli", "Dijital Kaos", "Venedik Kanalları"]:
                aw = Artwork.objects.filter(title=title).first()
                if aw:
                    fav_data.append((amtyrgnc, aw))
        if ahmet61:
            # ahmet61, amtyrgnc'nin eserlerini favorilessin
            for title in ["Boğaz'da Gün Batımı", "Kapadokya Sabahı", "Anadolu Kadını", "Renklerin Dansı"]:
                aw = Artwork.objects.filter(title=title).first()
                if aw:
                    fav_data.append((ahmet61, aw))
        if zeynep:
            for title in ["Bahar Rüzgarı", "Dijital Evren", "Boğaz'da Gün Batımı"]:
                aw = Artwork.objects.filter(title=title).first()
                if aw:
                    fav_data.append((zeynep, aw))

        created = 0
        for user, artwork in fav_data:
            _, ok = Favorite.objects.get_or_create(user=user, artwork=artwork)
            if ok:
                created += 1
        self.stdout.write(f"  ❤️  {created} favori eklendi")

    # ── EVENT CATEGORIES ───────────────────────────────────────────────────
    def _event_categories(self):
        from events.models import EventCategory
        cats = ["Resim Atölyesi", "Heykel Atölyesi", "Fotoğrafçılık", "Dijital Sanat", "Sanat Tarihi"]
        created = 0
        for name in cats:
            _, ok = EventCategory.objects.get_or_create(name=name)
            if ok: created += 1
        self.stdout.write(f"  📂 {created} etkinlik kategorisi eklendi")

    # ── EVENTS ─────────────────────────────────────────────────────────────
    def _events(self):
        from events.models import Event, EventCategory
        organizer = User.objects.filter(role="gallery_manager").first()
        now = timezone.now()
        events_data = [
            dict(title="Yağlı Boya Başlangıç Atölyesi", event_type="workshop", category="Resim Atölyesi",
                 location="Galeri Ana Salon, İstanbul", price=850, capacity=12,
                 start=now + timedelta(days=5, hours=10), end=now + timedelta(days=5, hours=14),
                 description="Yağlı boya tekniklerini sıfırdan öğrenmek isteyenler için 4 saatlik yoğun atölye. Tüm malzemeler dahildir."),
            dict(title="Suluboya Manzara Atölyesi", event_type="workshop", category="Resim Atölyesi",
                 location="Galeri B Salonu, İstanbul", price=650, capacity=15,
                 start=now + timedelta(days=8, hours=14), end=now + timedelta(days=8, hours=17),
                 description="Doğa manzaralarını suluboya ile resmetmeyi öğreneceğiniz keyifli bir atölye."),
            dict(title="Modern Heykel Teknikleri", event_type="workshop", category="Heykel Atölyesi",
                 location="Atölye Katı, İstanbul", price=1200, capacity=8,
                 start=now + timedelta(days=12, hours=10), end=now + timedelta(days=12, hours=16),
                 description="Kil ve alçı ile modern heykel oluşturma teknikleri. Usta sanatçı rehberliğinde."),
            dict(title="Sanat Fotoğrafçılığı Semineri", event_type="seminar", category="Fotoğrafçılık",
                 location="Konferans Salonu, İstanbul", price=400, capacity=30,
                 start=now + timedelta(days=3, hours=18), end=now + timedelta(days=3, hours=20),
                 description="Sanat eserlerini ve sergileri profesyonelce fotoğraflamayı öğreneceğiniz seminer."),
            dict(title="Dijital İllüstrasyon Atölyesi", event_type="workshop", category="Dijital Sanat",
                 location="Dijital Lab, İstanbul", price=950, capacity=10,
                 start=now + timedelta(days=15, hours=13), end=now + timedelta(days=15, hours=17),
                 description="Tablet ve yazılım kullanarak dijital illüstrasyon oluşturma. Ekipman sağlanır."),
            dict(title="Empresyonizm: Monet'den Günümüze", event_type="seminar", category="Sanat Tarihi",
                 location="Konferans Salonu, İstanbul", price=300, capacity=50,
                 start=now + timedelta(days=7, hours=15), end=now + timedelta(days=7, hours=17),
                 description="Empresyonizm akımının tarihsel gelişimini ve günümüz sanatına etkisini inceleyen seminer."),
            dict(title="Portre Resim Atölyesi", event_type="workshop", category="Resim Atölyesi",
                 location="Galeri Ana Salon, İstanbul", price=750, capacity=10,
                 start=now + timedelta(days=20, hours=10), end=now + timedelta(days=20, hours=14),
                 description="İnsan yüzünü ve ifadelerini tuval üzerine aktarma teknikleri."),
            dict(title="Galeri Turu: Çağdaş Türk Sanatı", event_type="tour", category="Sanat Tarihi",
                 location="Galeri Tüm Katlar, İstanbul", price=150, capacity=20,
                 start=now + timedelta(days=2, hours=11), end=now + timedelta(days=2, hours=13),
                 description="Uzman rehber eşliğinde çağdaş Türk sanatçıların eserlerini keşfedin."),
            # Geçmiş etkinlikler (tamamlandı) — yorum yazılabilsin diye
            dict(title="Soyut Sanat Atölyesi", event_type="workshop", category="Resim Atölyesi",
                 location="Galeri Ana Salon, İstanbul", price=900, capacity=10,
                 start=now - timedelta(days=20, hours=10), end=now - timedelta(days=20, hours=6),
                 description="Soyut ekspresyonizm tekniklerini keşfeden yoğun atölye çalışması.", status_override="completed"),
            dict(title="Çağdaş Heykel Sergisi Turu", event_type="tour", category="Heykel Atölyesi",
                 location="Galeri Tüm Katlar, İstanbul", price=200, capacity=25,
                 start=now - timedelta(days=10, hours=11), end=now - timedelta(days=10, hours=9),
                 description="Çağdaş Türk heykel sanatının öne çıkan isimlerini tanıtan rehberli tur.", status_override="completed"),
        ]
        created = 0
        for d in events_data:
            cat = EventCategory.objects.get(name=d.pop("category"))
            start = d.pop("start")
            end = d.pop("end")
            status = d.pop("status_override", "upcoming")
            _, ok = Event.objects.get_or_create(
                title=d["title"],
                defaults={**d, "category": cat, "organizer": organizer,
                          "start_datetime": start, "end_datetime": end, "status": status},
            )
            if ok:
                created += 1
        self.stdout.write(f"  🎭 {created} etkinlik eklendi")

    # ── CAMPAIGNS ──────────────────────────────────────────────────────────
    def _campaigns(self):
        from campaigns.models import Campaign, Coupon
        from artworks.models import Artwork
        now = timezone.now()

        camp, ok = Campaign.objects.get_or_create(
            name="Yaz Sanat Festivali",
            defaults=dict(
                description="Tüm atölye ve eserlerde %15 indirim! Yaz boyunca geçerli.",
                discount_type="percentage", discount_rate=15,
                target="all", start_date=now, end_date=now + timedelta(days=30), is_active=True,
            ),
        )
        if ok:
            camp.artworks.set(Artwork.objects.filter(status="available")[:8])
            Coupon.objects.get_or_create(
                code="SANAT15",
                defaults=dict(campaign=camp, discount_rate=15, max_uses=100,
                              valid_from=now, valid_until=now + timedelta(days=30), is_active=True),
            )
            Coupon.objects.get_or_create(
                code="YENIMÜŞTERI",
                defaults=dict(campaign=camp, discount_rate=20, max_uses=50,
                              valid_from=now, valid_until=now + timedelta(days=15), is_active=True),
            )

        camp2, ok2 = Campaign.objects.get_or_create(
            name="Öğrenci İndirimi",
            defaults=dict(
                description="Öğrencilere özel %10 indirim. Öğrenci belgesi gereklidir.",
                discount_type="percentage", discount_rate=10,
                target="specific_users", start_date=now, end_date=now + timedelta(days=60), is_active=True,
            ),
        )
        if ok2:
            Coupon.objects.get_or_create(
                code="OGRENCI10",
                defaults=dict(campaign=camp2, discount_rate=10, max_uses=200,
                              valid_from=now, valid_until=now + timedelta(days=60), is_active=True),
            )

        camp3, ok3 = Campaign.objects.get_or_create(
            name="Koleksiyoner Kampanyası",
            defaults=dict(
                description="3 ve üzeri eser alımlarında %25 indirim.",
                discount_type="percentage", discount_rate=25,
                target="all", start_date=now, end_date=now + timedelta(days=45), is_active=True,
            ),
        )
        if ok3:
            Coupon.objects.get_or_create(
                code="KOLEKSIYON25",
                defaults=dict(campaign=camp3, discount_rate=25, max_uses=30,
                              valid_from=now, valid_until=now + timedelta(days=45), is_active=True),
            )

        self.stdout.write("  🎟️  Kampanyalar ve kuponlar eklendi  (SANAT15 / YENIMÜŞTERI / OGRENCI10 / KOLEKSIYON25)")

    # ── RESERVATIONS ───────────────────────────────────────────────────────
    def _reservations(self):
        from reservations.models import Reservation
        from events.models import Event

        amtyrgnc = User.objects.filter(email="amtyrgnc@gmail.com").first()
        ahmet61  = User.objects.filter(email="ahmetyorganci61@gmail.com").first()
        zeynep   = User.objects.filter(email="zeynep@test.com").first()
        mehmet   = User.objects.filter(email="mehmet@test.com").first()
        elif_u   = User.objects.filter(email="elif@test.com").first()
        can      = User.objects.filter(email="can@test.com").first()

        def get_event(title):
            return Event.objects.filter(title=title).first()

        # (user, event_title, participant_count, status, notes)
        pairs = []
        if amtyrgnc:
            pairs += [
                (amtyrgnc, "Yağlı Boya Başlangıç Atölyesi",    2, "confirmed",  "İki kişilik rezervasyon, eşimle birlikte katılacağız."),
                (amtyrgnc, "Empresyonizm: Monet'den Günümüze",  1, "confirmed",  ""),
                (amtyrgnc, "Soyut Sanat Atölyesi",              1, "completed",  "Harika bir deneyimdi!"),
            ]
        if ahmet61:
            pairs += [
                (ahmet61, "Suluboya Manzara Atölyesi",          1, "confirmed",  ""),
                (ahmet61, "Modern Heykel Teknikleri",            1, "pending",    "Ödeme onayı bekleniyor."),
                (ahmet61, "Çağdaş Heykel Sergisi Turu",         2, "completed",  ""),
            ]
        if zeynep:
            pairs += [
                (zeynep, "Sanat Fotoğrafçılığı Semineri",       1, "confirmed",  ""),
                (zeynep, "Galeri Turu: Çağdaş Türk Sanatı",     1, "confirmed",  ""),
            ]
        if mehmet:
            pairs += [
                (mehmet, "Dijital İllüstrasyon Atölyesi",       2, "pending",    ""),
            ]
        if elif_u:
            pairs += [
                (elif_u, "Portre Resim Atölyesi",               1, "confirmed",  ""),
            ]
        if can:
            pairs += [
                (can, "Yağlı Boya Başlangıç Atölyesi",          1, "confirmed",  ""),
            ]

        created = 0
        for user, event_title, count, status, notes in pairs:
            event = get_event(event_title)
            if not event:
                continue
            if not Reservation.objects.filter(user=user, event=event).exists():
                Reservation.objects.create(
                    user=user, event=event,
                    participant_count=count, status=status, notes=notes,
                )
                created += 1
        self.stdout.write(f"  📋 {created} rezervasyon eklendi")

    # ── ORDERS ─────────────────────────────────────────────────────────────
    def _orders(self):
        from orders.models import Order, OrderItem, Payment
        from artworks.models import Artwork
        from django.utils import timezone as tz

        amtyrgnc = User.objects.filter(email="amtyrgnc@gmail.com").first()
        ahmet61  = User.objects.filter(email="ahmetyorganci61@gmail.com").first()
        zeynep   = User.objects.filter(email="zeynep@test.com").first()
        mehmet   = User.objects.filter(email="mehmet@test.com").first()
        elif_u   = User.objects.filter(email="elif@test.com").first()

        def get_aw(title):
            return Artwork.objects.filter(title=title).first()

        # (user, artwork_title, method, status, shipping_address, notes)
        order_data = []
        if amtyrgnc:
            order_data += [
                # amtyrgnc, ahmet61'in eserini satın aldı
                (amtyrgnc, "Sonsuzluk #1",       "credit_card",   "paid",      "Kadıköy, İstanbul",  "Lütfen özenle paketleyin."),
                (amtyrgnc, "Dijital Kaos",        "credit_card",   "delivered", "Kadıköy, İstanbul",  ""),
                (amtyrgnc, "Venedik Kanalları",   "bank_transfer", "pending",   "Kadıköy, İstanbul",  "Havale yapıldı, onay bekleniyor."),
            ]
        if ahmet61:
            order_data += [
                # ahmet61, amtyrgnc'nin eserini satın aldı
                (ahmet61, "Boğaz'da Gün Batımı",  "credit_card",   "paid",      "Beşiktaş, İstanbul", ""),
                (ahmet61, "Kapadokya Sabahı",      "debit_card",    "shipped",   "Beşiktaş, İstanbul", "Kargo takip numarası bekliyorum."),
            ]
        if zeynep:
            order_data += [
                (zeynep, "Bahar Rüzgarı",          "credit_card",   "delivered", "Şişli, İstanbul",    ""),
            ]
        if mehmet:
            order_data += [
                (mehmet, "Dijital Evren",           "credit_card",   "paid",      "Ankara",             ""),
            ]
        if elif_u:
            order_data += [
                (elif_u, "Renklerin Dansı",         "bank_transfer", "pending",   "İzmir",              ""),
            ]

        created = 0
        for user, aw_title, method, status, address, notes in order_data:
            artwork = get_aw(aw_title)
            if not artwork:
                continue
            if Order.objects.filter(user=user, items__artwork=artwork).exists():
                continue
            order = Order.objects.create(
                user=user, status=status, payment_method=method,
                total_amount=artwork.price, discount_amount=0,
                shipping_address=address, notes=notes,
                paid_at=tz.now() if status in ("paid", "delivered", "shipped") else None,
            )
            OrderItem.objects.create(order=order, artwork=artwork, quantity=1, unit_price=artwork.price)
            if status in ("paid", "delivered", "shipped"):
                Payment.objects.create(
                    order=order, amount=artwork.price, method=method,
                    status="success", transaction_id=f"TXN-{order.id:08d}",
                    paid_at=tz.now(),
                )
            created += 1
        self.stdout.write(f"  🛒 {created} sipariş eklendi")

    # ── REVIEWS ────────────────────────────────────────────────────────────
    def _reviews(self):
        from reviews.models import ArtworkReview, EventReview
        from artworks.models import Artwork
        from reservations.models import Reservation

        amtyrgnc = User.objects.filter(email="amtyrgnc@gmail.com").first()
        ahmet61  = User.objects.filter(email="ahmetyorganci61@gmail.com").first()
        zeynep   = User.objects.filter(email="zeynep@test.com").first()
        mehmet   = User.objects.filter(email="mehmet@test.com").first()

        def get_aw(title):
            return Artwork.objects.filter(title=title).first()

        # Eser yorumları
        art_reviews = []
        if amtyrgnc:
            art_reviews += [
                (amtyrgnc, "Sonsuzluk #1",      5, True,  "Gerçekten etkileyici bir eser. Büyük formatlı çalışma evimin en güzel köşesini süslüyor. Sanatçının tekniği ve renk kullanımı mükemmel."),
                (amtyrgnc, "Dijital Kaos",       4, True,  "Dijital sanatın bu kadar güçlü bir ifade aracı olabileceğini bu eserle anladım. Baskı kalitesi de çok iyi."),
                (amtyrgnc, "Venedik Kanalları",  5, False, "Fotoğraftan çok daha güzel. Canlı görünce büyülendim, renk derinliği inanılmaz."),
            ]
        if ahmet61:
            art_reviews += [
                (ahmet61, "Boğaz'da Gün Batımı", 5, True,  "Boğaz'ı her gün görüyorum ama bu eser bambaşka bir perspektif sunuyor. Empresyonist yorumu çok başarılı."),
                (ahmet61, "Kapadokya Sabahı",    4, True,  "Renk paleti ve kompozisyon çok güçlü. Kapadokya'nın ruhunu yakalamış sanatçı."),
                (ahmet61, "Renklerin Dansı",     4, False, "Canlı ve enerjik bir eser. Atölyeme çok yakıştı."),
            ]
        if zeynep:
            art_reviews += [
                (zeynep, "Bahar Rüzgarı",        5, True,  "Suluboya tekniğinin inceliğini mükemmel yansıtıyor. Çok narin ve zarif bir çalışma."),
                (zeynep, "Dijital Evren",         4, False, "Minimalist ama çok derin. Her baktığımda farklı bir şey keşfediyorum."),
            ]
        if mehmet:
            art_reviews += [
                (mehmet, "Şehir Işıkları",        4, True,  "Gece şehrinin atmosferini çok iyi yakalamış. Ofisime harika bir enerji kattı."),
            ]

        created_art = 0
        for user, title, rating, verified, comment in art_reviews:
            aw = get_aw(title)
            if not aw:
                continue
            if not ArtworkReview.objects.filter(user=user, artwork=aw).exists():
                ArtworkReview.objects.create(
                    user=user, artwork=aw, rating=rating,
                    comment=comment, is_verified_purchase=verified, is_approved=True,
                )
                created_art += 1

        # Etkinlik yorumları — sadece completed rezervasyonlar için
        ev_reviews = []
        if amtyrgnc:
            res = Reservation.objects.filter(
                user=amtyrgnc, event__title="Soyut Sanat Atölyesi", status="completed"
            ).first()
            if res:
                ev_reviews.append((
                    amtyrgnc, res,
                    5, "Atölye inanılmaz verimli geçti. Hoca her katılımcıyla birebir ilgilendi. "
                       "Soyut sanatın temellerini çok iyi kavradım. Kesinlikle tavsiye ederim!"
                ))
        if ahmet61:
            res = Reservation.objects.filter(
                user=ahmet61, event__title="Çağdaş Heykel Sergisi Turu", status="completed"
            ).first()
            if res:
                ev_reviews.append((
                    ahmet61, res,
                    4, "Rehberimiz çok bilgiliydi ve eserleri çok güzel anlattı. "
                       "Türk heykel sanatının bu kadar zengin olduğunu fark ettim."
                ))

        created_ev = 0
        for user, res, rating, comment in ev_reviews:
            if not EventReview.objects.filter(user=user, event=res.event).exists():
                EventReview.objects.create(
                    user=user, event=res.event, reservation=res,
                    rating=rating, comment=comment, is_approved=True,
                )
                created_ev += 1

        self.stdout.write(f"  ⭐ {created_art} eser yorumu, {created_ev} etkinlik yorumu eklendi")

    # ── SUPPORT ────────────────────────────────────────────────────────────
    def _support(self):
        from support.models import SupportTicket, SupportMessage

        staff    = User.objects.filter(role="gallery_manager").first()
        amtyrgnc = User.objects.filter(email="amtyrgnc@gmail.com").first()
        ahmet61  = User.objects.filter(email="ahmetyorganci61@gmail.com").first()
        zeynep   = User.objects.filter(email="zeynep@test.com").first()
        mehmet   = User.objects.filter(email="mehmet@test.com").first()

        # (user, subject, category, status, user_msg, staff_msg)
        tickets_data = []
        if amtyrgnc:
            tickets_data += [
                (
                    amtyrgnc,
                    "Venedik Kanalları siparişim ne zaman kargoya verilecek?",
                    "order", "in_progress",
                    "Merhaba, banka havalesi yaptım ancak siparişim hâlâ 'Beklemede' görünüyor. "
                    "Ödeme onaylandı mı, kargoya ne zaman verilecek?",
                    "Merhaba Ahmet Bey, ödemeniz onaylandı. Siparişiniz 2 iş günü içinde kargoya verilecektir. "
                    "Kargo takip numarasını e-posta ile ileteceğiz.",
                ),
                (
                    amtyrgnc,
                    "Sonsuzluk #1 eseri için fatura talebi",
                    "order", "resolved",
                    "Satın aldığım 'Sonsuzluk #1' eseri için resmi fatura talep ediyorum.",
                    "Faturanız hazırlandı ve kayıtlı e-posta adresinize gönderildi. İyi günler dileriz.",
                ),
            ]
        if ahmet61:
            tickets_data += [
                (
                    ahmet61,
                    "Modern Heykel Teknikleri rezervasyonumu iptal etmek istiyorum",
                    "reservation", "open",
                    "Merhaba, 'Modern Heykel Teknikleri' atölyesine rezervasyon yaptırmıştım ancak "
                    "katılamayacağım. İptal ve iade süreci nasıl işliyor?",
                    None,
                ),
                (
                    ahmet61,
                    "Boğaz'da Gün Batımı eseri hasarlı teslim edildi",
                    "artwork", "in_progress",
                    "Sipariş ettiğim 'Boğaz'da Gün Batımı' eseri kargoda hasar görmüş olarak teslim edildi. "
                    "Çerçevede kırık var. Fotoğrafları ekte gönderiyorum.",
                    "Merhaba, durumu üzüntüyle öğrendik. Kargo sigortası kapsamında iade/değişim işlemi "
                    "başlatıldı. Lütfen eseri orijinal ambalajında saklayın, kurye 3 gün içinde alacak.",
                ),
            ]
        if zeynep:
            tickets_data += [
                (
                    zeynep,
                    "Kupon kodu çalışmıyor",
                    "payment", "resolved",
                    "SANAT15 kupon kodunu kullanmaya çalışıyorum ama 'geçersiz kupon' hatası alıyorum.",
                    "Merhaba Zeynep Hanım, kupon kodunuzu kontrol ettik. Büyük harf kullandığınızdan emin olun: SANAT15. "
                    "Sorun devam ederse lütfen tekrar yazın.",
                ),
            ]
        if mehmet:
            tickets_data += [
                (
                    mehmet,
                    "Hesap şifremi unuttum",
                    "account", "resolved",
                    "Şifremi sıfırlamak istiyorum ama sıfırlama maili gelmiyor.",
                    "Merhaba, spam klasörünüzü kontrol edin. Sorun devam ederse hesabınızı manuel olarak sıfırlayabiliriz.",
                ),
            ]

        created = 0
        for row in tickets_data:
            user, subject, category, status, user_msg, staff_msg = row
            if SupportTicket.objects.filter(user=user, subject=subject).exists():
                continue
            ticket = SupportTicket.objects.create(
                user=user, subject=subject, category=category, status=status
            )
            SupportMessage.objects.create(
                ticket=ticket, sender=user,
                message=user_msg, is_staff_reply=False,
            )
            if staff_msg and staff:
                SupportMessage.objects.create(
                    ticket=ticket, sender=staff,
                    message=staff_msg, is_staff_reply=True,
                )
            created += 1
        self.stdout.write(f"  🎧 {created} destek talebi eklendi")
