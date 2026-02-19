#!/bin/bash
# Do NOT use set -e — we want the container to start even if DB/migrations fail

echo "╔══════════════════════════════════════════════╗"
echo "║  MedGama Backend — Starting...               ║"
echo "╚══════════════════════════════════════════════╝"

# ── Railway provides PORT env var (default 8080) ──
PORT="${PORT:-8080}"
echo "→ Configuring Nginx on port $PORT"
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# ── Ensure storage directories exist ──
echo "→ Preparing storage directories..."
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── Create storage link ──
php artisan storage:link 2>/dev/null || true

# ── Optimize Laravel (before DB — doesn't need DB) ──
echo "→ Optimizing Laravel..."
php artisan config:cache 2>&1 || echo "⚠ config:cache failed"
php artisan route:cache 2>&1 || echo "⚠ route:cache failed"
php artisan view:cache 2>&1 || echo "⚠ view:cache failed"

# ── Wait for database to be ready ──
echo "→ Waiting for database..."
MAX_RETRIES=15
RETRY=0
DB_READY=false
while [ $RETRY -lt $MAX_RETRIES ]; do
    if php artisan tinker --execute="try { DB::connection()->getPdo(); echo 'ok'; } catch(\Exception \$e) { echo 'fail'; }" 2>/dev/null | grep -q "ok"; then
        DB_READY=true
        echo "  ✓ Database connected!"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "  Database not ready (attempt $RETRY/$MAX_RETRIES)..."
    sleep 2
done

if [ "$DB_READY" = false ]; then
    echo "⚠ Database connection timeout — starting services anyway..."
fi

# ── Run migrations (only if DB is ready) ──
if [ "$DB_READY" = true ]; then
    echo "→ Running migrations..."
    php artisan migrate --force --no-interaction 2>&1 || echo "⚠ Migration warning (may already be up to date)"
fi

echo "→ Starting Supervisor (Nginx + PHP-FPM + Queue + Reverb + Scheduler)"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
