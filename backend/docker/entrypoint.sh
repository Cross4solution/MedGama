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
NGINX_TEST=$?
if [ $NGINX_TEST -ne 0 ]; then
    echo "✖ NGINX CONFIG TEST FAILED (exit=$NGINX_TEST)"
else
    echo "✔ NGINX CONFIG TEST PASSED"
fi

# ALWAYS dump the full config to Railway logs for debugging
echo "╔══ FULL NGINX CONFIG START ══╗"
cat -n /etc/nginx/nginx.conf
echo "╚══ FULL NGINX CONFIG END ════╝"

# ── 4. Create required directories (including avatar upload target) ──
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache public
mkdir -p storage/app/public/avatars storage/app/public/medstream
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── 5. Storage symlink ──
rm -f public/storage
ln -sfn "$(pwd)/storage/app/public" public/storage

# ── 6. FORCE CLEAR ALL CACHES ──
echo "→ Clearing caches..."
rm -f bootstrap/cache/routes-v7.php bootstrap/cache/config.php bootstrap/cache/events.php bootstrap/cache/services.php 2>/dev/null
php artisan route:clear 2>&1 || true
php artisan config:clear 2>&1 || true
php artisan cache:clear 2>&1 || true
php artisan view:clear 2>&1 || true
echo "→ Caches cleared."

# ── 7. Run database migrations ──
echo "════════════════════════════════════════════════════════════════"
echo "  DATABASE INIT — Connection details:"
echo "  DB_CONNECTION : ${DB_CONNECTION:-not set}"
echo "  DB_HOST       : ${DB_HOST:-not set}"
echo "  DB_PORT       : ${DB_PORT:-not set}"
echo "  DB_DATABASE   : ${DB_DATABASE:-not set}"
echo "  DB_USERNAME   : ${DB_USERNAME:-not set}"
echo "  MYSQL_ATTR_SSL_CA: ${MYSQL_ATTR_SSL_CA:-not set}"
echo "════════════════════════════════════════════════════════════════"

echo "→ Testing DB connection..."
php artisan db:show 2>&1 || echo "⚠ db:show failed — proceeding anyway"

echo ""
echo "→ Running incremental migrations (production mode)..."
if php artisan migrate --force 2>&1; then
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✅ MIGRATIONS COMPLETED SUCCESSFULLY"
    echo "════════════════════════════════════════════════════════════════"
else
    MIGRATE_EXIT=$?
    echo "════════════════════════════════════════════════════════════════"
    echo "  ⚠ MIGRATIONS FAILED (exit: $MIGRATE_EXIT)"
    echo "  Note: If this is the FIRST deployment, use init-db endpoint:"
    echo "  GET /api/system/init-db?key=MedaGama2026SecretInit&fresh=1"
    echo "════════════════════════════════════════════════════════════════"
fi

# ── 8. Debug: show registered routes ──
echo "→ Registered routes (init/ping/health):"
php artisan route:list 2>&1 | grep -iE "init|ping|health" || echo "(none matched)"

# ── 9. Start supervisor (nginx + php-fpm) — THIS MUST ALWAYS RUN ──
echo "════════════════════════════════════════════════"
echo "  Starting supervisord (nginx + php-fpm)..."
echo "  Nginx listening on 0.0.0.0:$PORT"
echo "════════════════════════════════════════════════"
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
