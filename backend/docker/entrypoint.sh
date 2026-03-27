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

# ── 7. Run database migrations (FRESH — nuclear option to rebuild from scratch) ──
echo "════════════════════════════════════════════════════════════════"
echo "  ⚠️  DATABASE RECONSTRUCTION STARTED — DROPPING ALL TABLES"
echo "════════════════════════════════════════════════════════════════"
echo "→ Running migrate:fresh --seed (this WIPES and rebuilds DB)..."
if php artisan migrate:fresh --force --seed 2>&1; then
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✅ DATABASE RECONSTRUCTION COMPLETED SUCCESSFULLY"
    echo "════════════════════════════════════════════════════════════════"
    echo "✔ Tables created: users, posts, appointments, clinics, hospitals"
    echo "✔ Seeded: 5 hospitals, 5 clinics, 5 doctors, 5 patients, 10 posts"
else
    MIGRATE_FRESH_EXIT=$?
    echo "════════════════════════════════════════════════════════════════"
    echo "  ✖ DATABASE RECONSTRUCTION FAILED (exit code: $MIGRATE_FRESH_EXIT)"
    echo "════════════════════════════════════════════════════════════════"
    echo "⚠️  DB may be in partial state — manual intervention needed"
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
