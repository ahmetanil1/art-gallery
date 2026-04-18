import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "sanat_galerisi.settings")
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

email    = "admin@sanatgalerisi.com"
username = "superadmin"
password = "Admin1234!"

if User.objects.filter(email=email).exists():
    u = User.objects.get(email=email)
    u.set_password(password)
    u.is_staff = True
    u.is_superuser = True
    u.role = "admin"
    u.save()
    print(f"✅ Mevcut kullanıcı güncellendi: {email}")
else:
    u = User.objects.create_superuser(
        username=username,
        email=email,
        password=password,
        first_name="Super",
        last_name="Admin",
        role="admin",
        is_verified=True,
    )
    print(f"✅ Admin kullanıcı oluşturuldu: {email}")

print()
print("=" * 40)
print("  ADMİN GİRİŞ BİLGİLERİ")
print("=" * 40)
print(f"  E-posta : {email}")
print(f"  Şifre   : {password}")
print(f"  Panel   : http://localhost:8000/admin")
print("=" * 40)
