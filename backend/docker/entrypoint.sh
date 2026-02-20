#!/bin/bash
# Do NOT use set -e — container must start even if DB/migrations fail

echo "╔══════════════════════════════════════════════╗"
echo "║  MedaGama Backend — Starting...              ║"
echo "╚══════════════════════════════════════════════╝"

# ── Railway provides PORT env var ──
PORT="${PORT:-8080}"
echo "→ Port: $PORT"
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# ── Storage directories ──
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# ── Storage link ──
php artisan storage:link 2>/dev/null || true

# ── Config & Route cache ──
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true

# ── Run pending migrations (safe — does NOT drop tables) ──
echo "→ Running pending migrations..."
php artisan migrate --force 2>&1 || echo "⚠ migrate failed (DB may not be ready yet)"

# ── Start Supervisor (Nginx + PHP-FPM + Queue) ──
echo "→ Starting Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
