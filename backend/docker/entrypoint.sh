#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════╗"
echo "║  MedGama Backend — Starting...               ║"
echo "╚══════════════════════════════════════════════╝"

# ── Railway provides PORT env var (default 8080) ──
PORT="${PORT:-8080}"
echo "→ Configuring Nginx on port $PORT"
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# ── Ensure storage directories exist ──
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# ── Wait for database to be ready ──
echo "→ Waiting for database..."
MAX_RETRIES=30
RETRY=0
until php artisan db:monitor --databases=pgsql > /dev/null 2>&1 || [ $RETRY -ge $MAX_RETRIES ]; do
    RETRY=$((RETRY + 1))
    echo "  Database not ready (attempt $RETRY/$MAX_RETRIES)..."
    sleep 2
done

if [ $RETRY -ge $MAX_RETRIES ]; then
    echo "⚠ Database connection timeout — continuing anyway..."
fi

# ── Run migrations ──
echo "→ Running migrations..."
php artisan migrate --force --no-interaction 2>&1 || echo "⚠ Migration warning (may already be up to date)"

# ── Optimize Laravel ──
echo "→ Optimizing Laravel..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

# ── Generate APP_KEY if not set ──
if [ -z "$APP_KEY" ]; then
    echo "→ Generating APP_KEY..."
    php artisan key:generate --force
fi

# ── Create storage link ──
php artisan storage:link 2>/dev/null || true

echo "→ Starting Supervisor (Nginx + PHP-FPM + Queue + Reverb + Scheduler)"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
