"""
python manage.py seed
Tüm tabloları örnek verilerle doldurur.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
import random

User = get_user_model()


class Command(BaseCommand):
    help = "Veritabanını örnek verilerle doldurur"

    def handle(self, *args, **kwargs):
        self.stdout.write("🌱 Seed başlıyor...\n")
        self._users()
        self._categories()
        self._artists()
        self._artworks()
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
        users_data = [
            dict(username="ahmet_k",   email="ahmet@test.com",   first_name="Ahmet",   last_name="Kaya",    phone="05301112233", role="customer"),
            dict(username="zeynep_d",  email="zeynep@test.com",  first_name="Zeynep",  last_name="Demir",   phone="05322223344", role="customer"),
            dict(username="mehmet_y",  email="mehmet@test.com",  first_name="Mehmet",  last_name="Yılmaz",  phone="05333334455", role="customer"),
            dict(username="elif_s",    email="elif@test.com",    first_name="Elif",    last_name="Şahin",   phone="05344445566", role="customer"),
            dict(username="can_o",     email="can@test.com",     first_name="Can",     last_name="Öztürk",  phone="05355556677", role="customer"),
            dict(username="galeri_mgr",email="galeri@test.com",  first_name="Galeri",  last_name="Yönetici",phone="05366667788", role="gallery_manager"),
        ]
        created = 0
        for d in users_data:
            if not U.objects.filter(email=d["email"]).exists():
                u = U(**d)
                u.set_password("Test1234!")
                u.save()
                created += 1
        self.stdout.write(f"  👤 {created} kullanıcı eklendi  (şifre: Test1234!)")

    # ── CATEGORIES ─────────────────────────────────────────────────────────
    def _categories(self):
        from artworks.models import Category
        cats = [
            ("Yağlı Boya", "yagliboy"),
            ("Suluboya",   "suluboya"),
            ("Heykel",     "heykel"),
            ("Fotoğraf",   "fotograf"),
            ("Dijital Sanat", "dijital"),
            ("Soyut",      "soyut"),
        ]
        created = 0
        for name, slug in cats:
            _, ok = Category.objects.get_or_create(slug=slug, defaults={"name": name, "description": f"{name} kategorisi"})
            if ok: created += 1
        self.stdout.write(f"  🏷️  {created} kategori eklendi")

    # ── ARTISTS ────────────────────────────────────────────────────────────
    def _artists(self):
        from artworks.models import Artist
        artists_data = [
            dict(name="Ahmet Güneşli",   nationality="Türk",    birth_year=1975, bio="İstanbul doğumlu empresyonist ressam."),
            dict(name="Leyla Çiçek",     nationality="Türk",    birth_year=1982, bio="Suluboya ve karma teknik üzerine çalışmalar."),
            dict(name="Marco Rossi",     nationality="İtalyan", birth_year=1968, bio="Floransa'da yetişmiş klasik ressam."),
            dict(name="Yuki Tanaka",     nationality="Japon",   birth_year=1990, bio="Minimalist dijital sanat eserleri."),
            dict(name="Fatma Arslan",    nationality="Türk",    birth_year=1979, bio="Soyut ekspresyonizm ve heykel."),
            dict(name="Carlos Mendez",   nationality="Meksikalı",birth_year=1985,bio="Renkli sokak sanatı ve tuval çalışmaları."),
        ]
        created = 0
        for d in artists_data:
            _, ok = Artist.objects.get_or_create(name=d["name"], defaults=d)
            if ok: created += 1
        self.stdout.write(f"  🎨 {created} sanatçı eklendi")

    # ── ARTWORKS ───────────────────────────────────────────────────────────
    def _artworks(self):
        from artworks.models import Artwork, Artist, Category
        artworks_data = [
            dict(title="Boğaz'da Gün Batımı",   artist="Ahmet Güneşli", category="yagliboy", price=12500, medium="Yağlı Boya / Tuval", dimensions="80x60 cm",  year_created=2021, status="available",    description="İstanbul Boğazı'nın büyüleyici gün batımını yansıtan empresyonist bir eser."),
            dict(title="Bahar Rüzgarı",          artist="Leyla Çiçek",   category="suluboya", price=4800,  medium="Suluboya / Kağıt",   dimensions="50x40 cm",  year_created=2022, status="available",    description="Baharın tazeliğini suluboya tekniğiyle aktaran narin bir çalışma."),
            dict(title="Venedik Kanalları",      artist="Marco Rossi",   category="yagliboy", price=28000, medium="Yağlı Boya / Tuval", dimensions="100x80 cm", year_created=2019, status="available",    description="Venedik'in tarihi kanallarını klasik İtalyan tekniğiyle betimleyen eser."),
            dict(title="Dijital Evren",          artist="Yuki Tanaka",   category="dijital",  price=6500,  medium="Dijital Baskı",      dimensions="70x70 cm",  year_created=2023, status="available",    description="Minimalist çizgiler ve geometrik formlarla oluşturulan dijital kompozisyon."),
            dict(title="Sonsuzluk Heykeli",      artist="Fatma Arslan",  category="heykel",   price=35000, medium="Bronz",              dimensions="45x20x20 cm",year_created=2020,status="available",    description="Soyut formlarla insanın sonsuzluk arayışını simgeleyen bronz heykel."),
            dict(title="Renklerin Dansı",        artist="Carlos Mendez", category="soyut",    price=9200,  medium="Akrilik / Tuval",    dimensions="90x70 cm",  year_created=2022, status="available",    description="Canlı renkler ve dinamik fırça darbeleriyle oluşturulan soyut kompozisyon."),
            dict(title="Anadolu Kadını",         artist="Ahmet Güneşli", category="yagliboy", price=18000, medium="Yağlı Boya / Tuval", dimensions="70x90 cm",  year_created=2018, status="sold",         description="Geleneksel Anadolu kıyafetleriyle bir kadın portresini konu alan eser."),
            dict(title="Kar Yağışı",             artist="Leyla Çiçek",   category="suluboya", price=3200,  medium="Suluboya / Kağıt",   dimensions="40x30 cm",  year_created=2023, status="available",    description="Kış sabahının sessizliğini suluboya tekniğiyle aktaran küçük format çalışma."),
            dict(title="Şehir Işıkları",         artist="Yuki Tanaka",   category="dijital",  price=5500,  medium="Dijital Baskı",      dimensions="60x80 cm",  year_created=2023, status="available",    description="Gece şehrinin ışıklarını minimalist dijital teknikle yorumlayan eser."),
            dict(title="Akdeniz Kıyısı",         artist="Marco Rossi",   category="fotograf", price=2800,  medium="Fine Art Baskı",     dimensions="60x40 cm",  year_created=2022, status="available",    description="Akdeniz'in kristal sularını ve kıyısını belgeleyen sanatsal fotoğraf."),
            dict(title="Özgürlük",               artist="Fatma Arslan",  category="heykel",   price=22000, medium="Mermer",             dimensions="60x25x25 cm",year_created=2021,status="not_for_sale", description="Mermerden yontulmuş, özgürlüğü simgeleyen soyut heykel."),
            dict(title="Fiesta",                 artist="Carlos Mendez", category="soyut",    price=11500, medium="Yağlı Boya / Tuval", dimensions="100x100 cm",year_created=2020, status="available",    description="Meksika festivallerinin coşkusunu yansıtan renkli soyut eser."),
        ]
        created = 0
        for d in artworks_data:
            artist = Artist.objects.get(name=d.pop("artist"))
            cat    = Category.objects.get(slug=d.pop("category"))
            _, ok  = Artwork.objects.get_or_create(
                title=d["title"],
                defaults={**d, "artist": artist, "category": cat, "view_count": random.randint(10, 500)}
            )
            if ok: created += 1
        self.stdout.write(f"  🖼️  {created} eser eklendi")

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
                 location="Galeri Ana Salon, İstanbul", price=850,  capacity=12,
                 start=now + timedelta(days=5,  hours=10), end=now + timedelta(days=5,  hours=14),
                 description="Yağlı boya tekniklerini sıfırdan öğrenmek isteyenler için 4 saatlik yoğun atölye. Tüm malzemeler dahildir."),
            dict(title="Suluboya Manzara Atölyesi",      event_type="workshop", category="Resim Atölyesi",
                 location="Galeri B Salonu, İstanbul",   price=650,  capacity=15,
                 start=now + timedelta(days=8,  hours=14), end=now + timedelta(days=8,  hours=17),
                 description="Doğa manzaralarını suluboya ile resmetmeyi öğreneceğiniz keyifli bir atölye."),
            dict(title="Modern Heykel Teknikleri",       event_type="workshop", category="Heykel Atölyesi",
                 location="Atölye Katı, İstanbul",       price=1200, capacity=8,
                 start=now + timedelta(days=12, hours=10), end=now + timedelta(days=12, hours=16),
                 description="Kil ve alçı ile modern heykel oluşturma teknikleri. Usta sanatçı rehberliğinde."),
            dict(title="Sanat Fotoğrafçılığı Semineri",  event_type="seminar",  category="Fotoğrafçılık",
                 location="Konferans Salonu, İstanbul",  price=400,  capacity=30,
                 start=now + timedelta(days=3,  hours=18), end=now + timedelta(days=3,  hours=20),
                 description="Sanat eserlerini ve sergileri profesyonelce fotoğraflamayı öğreneceğiniz seminer."),
            dict(title="Dijital İllüstrasyon Atölyesi",  event_type="workshop", category="Dijital Sanat",
                 location="Dijital Lab, İstanbul",       price=950,  capacity=10,
                 start=now + timedelta(days=15, hours=13), end=now + timedelta(days=15, hours=17),
                 description="Tablet ve yazılım kullanarak dijital illüstrasyon oluşturma. Ekipman sağlanır."),
            dict(title="Empresyonizm: Monet'den Günümüze", event_type="seminar", category="Sanat Tarihi",
                 location="Konferans Salonu, İstanbul",  price=300,  capacity=50,
                 start=now + timedelta(days=7,  hours=15), end=now + timedelta(days=7,  hours=17),
                 description="Empresyonizm akımının tarihsel gelişimini ve günümüz sanatına etkisini inceleyen seminer."),
            dict(title="Portre Resim Atölyesi",          event_type="workshop", category="Resim Atölyesi",
                 location="Galeri Ana Salon, İstanbul",  price=750,  capacity=10,
                 start=now + timedelta(days=20, hours=10), end=now + timedelta(days=20, hours=14),
                 description="İnsan yüzünü ve ifadelerini tuval üzerine aktarma teknikleri."),
            dict(title="Galeri Turu: Çağdaş Türk Sanatı", event_type="tour",   category="Sanat Tarihi",
                 location="Galeri Tüm Katlar, İstanbul", price=150,  capacity=20,
                 start=now + timedelta(days=2,  hours=11), end=now + timedelta(days=2,  hours=13),
                 description="Uzman rehber eşliğinde çağdaş Türk sanatçıların eserlerini keşfedin."),
        ]
        created = 0
        for d in events_data:
            cat = EventCategory.objects.get(name=d.pop("category"))
            start = d.pop("start"); end = d.pop("end")
            _, ok = Event.objects.get_or_create(
                title=d["title"],
                defaults={**d, "category": cat, "organizer": organizer,
                          "start_datetime": start, "end_datetime": end, "status": "upcoming"}
            )
            if ok: created += 1
        self.stdout.write(f"  🎭 {created} etkinlik eklendi")

    # ── CAMPAIGNS ──────────────────────────────────────────────────────────
    def _campaigns(self):
        from campaigns.models import Campaign, Coupon
        from artworks.models import Artwork
        now = timezone.now()
        camp, ok = Campaign.objects.get_or_create(
            name="Yaz Sanat Festivali",
            defaults=dict(
                description="Tüm atölye ve eserlerde %15 indirim!",
                discount_type="percentage", discount_rate=15,
                target="all", start_date=now, end_date=now + timedelta(days=30), is_active=True,
            )
        )
        if ok:
            camp.artworks.set(Artwork.objects.filter(status="available")[:6])
            Coupon.objects.get_or_create(
                code="SANAT15",
                defaults=dict(campaign=camp, discount_rate=15, max_uses=100,
                              valid_from=now, valid_until=now + timedelta(days=30), is_active=True)
            )
            Coupon.objects.get_or_create(
                code="YENIMÜŞTERI",
                defaults=dict(campaign=camp, discount_rate=20, max_uses=50,
                              valid_from=now, valid_until=now + timedelta(days=15), is_active=True)
            )
        camp2, ok2 = Campaign.objects.get_or_create(
            name="Öğrenci İndirimi",
            defaults=dict(
                description="Öğrencilere özel %10 indirim.",
                discount_type="percentage", discount_rate=10,
                target="specific_users", start_date=now, end_date=now + timedelta(days=60), is_active=True,
            )
        )
        if ok2:
            Coupon.objects.get_or_create(
                code="OGRENCI10",
                defaults=dict(campaign=camp2, discount_rate=10, max_uses=200,
                              valid_from=now, valid_until=now + timedelta(days=60), is_active=True)
            )
        self.stdout.write(f"  🎟️  Kampanyalar ve kuponlar eklendi  (SANAT15 / YENIMÜŞTERI / OGRENCI10)")

    # ── RESERVATIONS ───────────────────────────────────────────────────────
    def _reservations(self):
        from reservations.models import Reservation
        from events.models import Event
        customers = list(User.objects.filter(role="customer"))
        events    = list(Event.objects.all())
        if not customers or not events:
            return
        created = 0
        pairs = [(customers[0], events[0], 2, "confirmed"),
                 (customers[1], events[1], 1, "confirmed"),
                 (customers[2], events[2], 3, "pending"),
                 (customers[3], events[3], 1, "confirmed"),
                 (customers[4], events[4], 2, "pending"),
                 (customers[0], events[5], 1, "completed"),
                 (customers[1], events[6], 2, "completed"),
                 (customers[2], events[7], 1, "confirmed"),]
        for user, event, count, status in pairs:
            if not Reservation.objects.filter(user=user, event=event).exists():
                Reservation.objects.create(user=user, event=event,
                                           participant_count=count, status=status)
                created += 1
        self.stdout.write(f"  📋 {created} rezervasyon eklendi")

    # ── ORDERS ─────────────────────────────────────────────────────────────
    def _orders(self):
        from orders.models import Order, OrderItem, Payment
        from artworks.models import Artwork
        from django.utils import timezone as tz
        customers = list(User.objects.filter(role="customer"))
        artworks  = list(Artwork.objects.filter(status__in=["available", "sold"]))
        if not customers or not artworks:
            return
        created = 0
        order_data = [
            (customers[0], artworks[0],  "credit_card",   "paid"),
            (customers[1], artworks[3],  "debit_card",    "paid"),
            (customers[2], artworks[5],  "bank_transfer", "pending"),
            (customers[3], artworks[7],  "credit_card",   "delivered"),
            (customers[4], artworks[9],  "credit_card",   "paid"),
        ]
        for user, artwork, method, status in order_data:
            if not Order.objects.filter(user=user, items__artwork=artwork).exists():
                order = Order.objects.create(
                    user=user, status=status, payment_method=method,
                    total_amount=artwork.price, discount_amount=0,
                    paid_at=tz.now() if status in ("paid", "delivered") else None,
                )
                OrderItem.objects.create(order=order, artwork=artwork,
                                         quantity=1, unit_price=artwork.price)
                if status in ("paid", "delivered"):
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
        from events.models import Event
        from reservations.models import Reservation
        customers = list(User.objects.filter(role="customer"))
        artworks  = list(Artwork.objects.all())
        comments_art = [
            "Muhteşem bir eser, renk uyumu mükemmel!",
            "Sanatçının tekniği gerçekten etkileyici.",
            "Evimin salonuna çok yakıştı, herkese tavsiye ederim.",
            "Fotoğraftan çok daha güzel, canlı görünce büyülendim.",
            "Kaliteli işçilik, hızlı teslimat. Teşekkürler!",
        ]
        created_art = 0
        for i, (user, artwork) in enumerate(zip(customers[:5], artworks[:5])):
            if not ArtworkReview.objects.filter(user=user, artwork=artwork).exists():
                ArtworkReview.objects.create(
                    user=user, artwork=artwork,
                    rating=random.randint(4, 5),
                    comment=comments_art[i],
                    is_verified_purchase=(i % 2 == 0),
                    is_approved=True,
                )
                created_art += 1

        comments_ev = [
            "Atölye çok verimli geçti, hocamız harikaydı!",
            "Küçük grup olduğu için herkese özel ilgi gösterildi.",
            "Seminer içeriği çok zengin ve bilgilendirici.",
            "Kesinlikle tekrar katılacağım, harika bir deneyim.",
        ]
        created_ev = 0
        completed_res = list(Reservation.objects.filter(status="completed").select_related("user", "event"))
        for i, res in enumerate(completed_res[:4]):
            if not EventReview.objects.filter(user=res.user, event=res.event).exists():
                EventReview.objects.create(
                    user=res.user, event=res.event, reservation=res,
                    rating=random.randint(4, 5),
                    comment=comments_ev[i % len(comments_ev)],
                    is_approved=True,
                )
                created_ev += 1
        self.stdout.write(f"  ⭐ {created_art} eser yorumu, {created_ev} etkinlik yorumu eklendi")

    # ── SUPPORT ────────────────────────────────────────────────────────────
    def _support(self):
        from support.models import SupportTicket, SupportMessage
        staff = User.objects.filter(role="gallery_manager").first()
        customers = list(User.objects.filter(role="customer"))
        tickets_data = [
            (customers[0], "Siparişim ne zaman gelecek?",    "order",       "resolved"),
            (customers[1], "Rezervasyon iptali hakkında",     "reservation", "in_progress"),
            (customers[2], "Ödeme iki kez çekildi",           "payment",     "open"),
            (customers[3], "Eser hasarlı geldi",              "artwork",     "open"),
        ]
        created = 0
        for user, subject, category, status in tickets_data:
            if not SupportTicket.objects.filter(user=user, subject=subject).exists():
                ticket = SupportTicket.objects.create(
                    user=user, subject=subject, category=category, status=status
                )
                SupportMessage.objects.create(
                    ticket=ticket, sender=user,
                    message=f"Merhaba, {subject.lower()} konusunda yardım almak istiyorum.",
                    is_staff_reply=False,
                )
                if status in ("resolved", "in_progress") and staff:
                    SupportMessage.objects.create(
                        ticket=ticket, sender=staff,
                        message="Merhaba, talebinizi aldık. En kısa sürede yardımcı olacağız.",
                        is_staff_reply=True,
                    )
                created += 1
        self.stdout.write(f"  🎧 {created} destek talebi eklendi")
