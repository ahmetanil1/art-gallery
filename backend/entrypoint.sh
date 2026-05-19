#!/bin/sh
set -e

echo "⏳ Veritabanı bekleniyor..."
while ! python -c "
import psycopg2, os
psycopg2.connect(
    host=os.environ.get('DB_HOST','db'),
    port=os.environ.get('DB_PORT','5432'),
    dbname=os.environ.get('DB_NAME','sanat_galerisi'),
    user=os.environ.get('DB_USER','postgres'),
    password=os.environ.get('DB_PASSWORD','postgres'),
)
" 2>/dev/null; do
  echo "  DB hazır değil, 2 saniye bekleniyor..."
  sleep 2
done
echo "✅ Veritabanı hazır."

echo "🔄 Migration çalıştırılıyor..."
python manage.py migrate --noinput

echo "📦 Static dosyalar toplanıyor..."
python manage.py collectstatic --noinput

echo "🚀 Daphne (ASGI) başlatılıyor..."
exec daphne \
  -b 0.0.0.0 \
  -p 8000 \
  --access-log - \
  sanat_galerisi.asgi:application
