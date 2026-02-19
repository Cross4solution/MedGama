#!/bin/bash
# Do NOT use set -e — container must start even if DB/migrations fail

echo "╔══════════════════════════════════════════════╗"
echo "║  MedGama Backend — Starting...               ║"
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

# ── Start Supervisor IMMEDIATELY (Nginx + PHP-FPM start first → healthcheck passes) ──
echo "→ Starting Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
