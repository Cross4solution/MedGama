#!/bin/sh
set -e

PORT="${PORT:-8080}"
echo "→ MedaGama port=$PORT"

# ── 1. Force safe defaults FIRST — before any PHP command ──
export CACHE_STORE=file
export QUEUE_CONNECTION=sync
export SESSION_DRIVER=file
export BROADCAST_CONNECTION=log

# ── 2. Nginx port injection ──
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# ── 3. Create required directories ──
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache public
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── 4. Storage symlink ──
ln -sfn ../storage/app/public public/storage

# ── 5. FORCE CLEAR ALL CACHES — kill stale route/config cache from Docker build ──
echo "→ Clearing all caches..."
rm -f bootstrap/cache/routes-v7.php 2>/dev/null || true
rm -f bootstrap/cache/config.php 2>/dev/null || true
rm -f bootstrap/cache/events.php 2>/dev/null || true
rm -f bootstrap/cache/services.php 2>/dev/null || true
php artisan route:clear 2>&1 || true
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true
php artisan view:clear 2>&1 || true
echo "→ Cache cleared."

# ── 6. Run database migrations ──
echo "→ Running migrations..."
php artisan migrate --force 2>&1 || echo "⚠ Migration failed (DB may not be ready yet)"

# ── 7. List registered routes (debug — check Railway logs) ──
echo "→ Registered routes containing 'init':"
php artisan route:list 2>&1 | grep -i init || echo "(none found)"
echo "→ Registered routes containing 'ping':"
php artisan route:list 2>&1 | grep -i ping || echo "(none found)"

# ── 8. Start supervisor (nginx + php-fpm) ──
echo "→ Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
