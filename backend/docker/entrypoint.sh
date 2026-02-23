#!/bin/sh
# NO set -e — we must NEVER let a cache/migration failure prevent nginx from starting

PORT="${PORT:-8080}"
echo "════════════════════════════════════════════════"
echo "  MedaGama Backend — Railway Entrypoint"
echo "  PORT=$PORT  (Railway must route traffic here)"
echo "════════════════════════════════════════════════"

# ── 1. Force safe defaults FIRST — before any PHP command ──
export CACHE_STORE=file
export QUEUE_CONNECTION=sync
export SESSION_DRIVER=file
export BROADCAST_CONNECTION=log

# ── 2. Inject PORT into nginx.conf (the MAIN config, not an include) ──
sed -i "s/__PORT__/$PORT/g" /etc/nginx/nginx.conf
echo "→ Nginx will listen on port $PORT"

# ── 3. Verify nginx config is valid ──
echo "→ Testing nginx config..."
nginx -t -c /etc/nginx/nginx.conf 2>&1
if [ $? -ne 0 ]; then
    echo "✖ NGINX CONFIG INVALID — dumping full config:"
    cat -n /etc/nginx/nginx.conf
    echo "────────────────────────────────────────"
else
    echo "✔ nginx config test passed"
fi

# Show CORS-critical lines to confirm headers are in place
echo "→ Nginx listen line:"
grep -n "listen" /etc/nginx/nginx.conf
echo "→ Nginx CORS lines:"
grep -n "Access-Control" /etc/nginx/nginx.conf
echo "→ Nginx location lines:"
grep -n "location" /etc/nginx/nginx.conf

# ── 4. Create required directories ──
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache public
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── 5. Storage symlink ──
ln -sfn ../storage/app/public public/storage

# ── 6. FORCE CLEAR ALL CACHES ──
echo "→ Clearing caches..."
rm -f bootstrap/cache/routes-v7.php bootstrap/cache/config.php bootstrap/cache/events.php bootstrap/cache/services.php 2>/dev/null
php artisan route:clear 2>&1 || true
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true
php artisan view:clear 2>&1 || true
echo "→ Caches cleared."

# ── 7. Run database migrations ──
echo "→ Running migrations..."
php artisan migrate --force 2>&1 || echo "⚠ Migration failed (DB may not be ready yet)"

# ── 8. Debug: show registered routes ──
echo "→ Registered routes (init/ping/health):"
php artisan route:list 2>&1 | grep -iE "init|ping|health" || echo "(none matched)"

# ── 9. Start supervisor (nginx + php-fpm) — THIS MUST ALWAYS RUN ──
echo "════════════════════════════════════════════════"
echo "  Starting supervisord (nginx + php-fpm)..."
echo "  Nginx listening on 0.0.0.0:$PORT"
echo "════════════════════════════════════════════════"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
