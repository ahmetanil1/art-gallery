import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sanat_galerisi.settings")
django.setup()

from django.contrib.auth import get_user_model
from artworks.models import Artwork, Artist, Category
from events.models import Event
from reservations.models import Reservation
from orders.models import Order
from campaigns.models import Campaign, Coupon
from reviews.models import ArtworkReview, EventReview
from support.models import SupportTicket

User = get_user_model()

SEP = "=" * 60

print(f"\n{SEP}")
print("  KULLANICILAR")
print(SEP)
print(f"  {'ID':<4} {'Ad Soyad':<22} {'E-posta':<26} {'Rol'}")
print(f"  {'-'*4} {'-'*22} {'-'*26} {'-'*15}")
for u in User.objects.all().order_by("id"):
    print(f"  {u.id:<4} {u.get_full_name():<22} {u.email:<26} {u.role}")
print(f"  Şifre (test kullanıcıları): Test1234!")

print(f"\n{SEP}")
print("  KATEGORİLER")
print(SEP)
for c in Category.objects.all():
    count = c.artworks.count()
    print(f"  - {c.name:<20} ({count} eser)")

print(f"\n{SEP}")
print("  SANATÇILAR")
print(SEP)
print(f"  {'Ad':<24} {'Uyruk':<14} {'Doğum':<8} {'Eser Sayısı'}")
print(f"  {'-'*24} {'-'*14} {'-'*8} {'-'*11}")
for a in Artist.objects.all():
    print(f"  {a.name:<24} {a.nationality:<14} {a.birth_year or '-':<8} {a.artworks.count()}")

print(f"\n{SEP}")
print("  ESERLER")
print(SEP)
print(f"  {'ID':<4} {'Başlık':<36} {'Sanatçı':<18} {'Fiyat':<12} {'Durum'}")
print(f"  {'-'*4} {'-'*36} {'-'*18} {'-'*12} {'-'*12}")
for aw in Artwork.objects.select_related("artist", "category").all():
    print(f"  {aw.id:<4} {aw.title:<36} {aw.artist.name:<18} {str(aw.price)+' TL':<12} {aw.status}")

print(f"\n{SEP}")
print("  ETKİNLİKLER")
print(SEP)
print(f"  {'ID':<4} {'Başlık':<42} {'Fiyat':<10} {'Kap.':<6} {'Tür'}")
print(f"  {'-'*4} {'-'*42} {'-'*10} {'-'*6} {'-'*10}")
for ev in Event.objects.all():
    print(f"  {ev.id:<4} {ev.title:<42} {str(ev.price)+' TL':<10} {ev.capacity:<6} {ev.event_type}")

print(f"\n{SEP}")
print("  KAMPANYALAR & KUPONLAR")
print(SEP)
for camp in Campaign.objects.prefetch_related("coupons").all():
    print(f"  Kampanya: {camp.name}  (%{camp.discount_rate} indirim)  Aktif={camp.is_active}")
    for c in camp.coupons.all():
        print(f"    Kupon: {c.code:<16} %{c.discount_rate}  max_kullanim={c.max_uses}  gecerli={c.is_valid}")

print(f"\n{SEP}")
print("  REZERVASYONLAR")
print(SEP)
print(f"  {'ID':<4} {'Kullanıcı':<12} {'Etkinlik':<38} {'Kişi':<6} {'Durum'}")
print(f"  {'-'*4} {'-'*12} {'-'*38} {'-'*6} {'-'*12}")
for r in Reservation.objects.select_related("user", "event").all():
    print(f"  {r.id:<4} {r.user.first_name:<12} {r.event.title[:37]:<38} {r.participant_count:<6} {r.status}")

print(f"\n{SEP}")
print("  SİPARİŞLER")
print(SEP)
print(f"  {'ID':<4} {'Kullanıcı':<12} {'Eser':<36} {'Tutar':<12} {'Durum'}")
print(f"  {'-'*4} {'-'*12} {'-'*36} {'-'*12} {'-'*10}")
for o in Order.objects.select_related("user").prefetch_related("items__artwork").all():
    items = ", ".join(i.artwork.title for i in o.items.all())
    print(f"  {o.id:<4} {o.user.first_name:<12} {items[:35]:<36} {str(o.total_amount)+' TL':<12} {o.status}")

print(f"\n{SEP}")
print("  YORUMLAR")
print(SEP)
print("  [Eser Yorumları]")
for r in ArtworkReview.objects.select_related("user", "artwork").all():
    print(f"  {r.user.first_name:<12} -> {r.artwork.title[:32]:<33} {r.rating}★  dogrulandi={r.is_verified_purchase}")
print("  [Etkinlik Yorumları]")
for r in EventReview.objects.select_related("user", "event").all():
    print(f"  {r.user.first_name:<12} -> {r.event.title[:32]:<33} {r.rating}★")

print(f"\n{SEP}")
print("  DESTEK TALEPLERİ")
print(SEP)
print(f"  {'ID':<4} {'Kullanıcı':<12} {'Konu':<40} {'Durum':<14} {'Mesaj'}")
print(f"  {'-'*4} {'-'*12} {'-'*40} {'-'*14} {'-'*5}")
for t in SupportTicket.objects.select_related("user").prefetch_related("messages").all():
    print(f"  {t.id:<4} {t.user.first_name:<12} {t.subject[:39]:<40} {t.status:<14} {t.messages.count()} mesaj")

print(f"\n{SEP}")
print("  ÖZET İSTATİSTİKLER")
print(SEP)
print(f"  Toplam Kullanıcı  : {User.objects.count()}")
print(f"  Toplam Eser       : {Artwork.objects.count()}")
print(f"  Toplam Etkinlik   : {Event.objects.count()}")
print(f"  Toplam Rezervasyon: {Reservation.objects.count()}")
print(f"  Toplam Sipariş    : {Order.objects.count()}")
print(f"  Toplam Yorum      : {ArtworkReview.objects.count() + EventReview.objects.count()}")
print(f"  Toplam Destek     : {SupportTicket.objects.count()}")
print(f"  Toplam Kupon      : {Coupon.objects.count()}")
print()
