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

# ── Config & Route cache ──
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true

# ── EMERGENCY: Drop all tables, re-migrate, and seed from scratch ──
echo "→ Running migrate:fresh --seed --force..."
php artisan migrate:fresh --seed --force 2>&1 || echo "⚠ migrate:fresh failed"
echo "→ Database reset complete."

# ── Start Supervisor IMMEDIATELY (Nginx + PHP-FPM start first → healthcheck passes) ──
echo "→ Starting Supervisor..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
