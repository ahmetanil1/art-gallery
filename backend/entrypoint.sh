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

echo "🚀 Gunicorn başlatılıyor..."
exec gunicorn sanat_galerisi.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers 3 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile - \
  --log-level info
