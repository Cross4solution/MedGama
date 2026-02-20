#!/bin/bash
# CRITICAL: No artisan commands here — they can hang/crash and block Nginx.
# Supervisor starts Nginx FIRST → healthcheck passes → then Laravel init runs.

PORT="${PORT:-8080}"
echo "→ MedaGama starting on port $PORT"

# Replace port placeholder in Nginx config
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

# Ensure writable dirs exist (pure filesystem, no PHP)
mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Start Supervisor NOW — Nginx answers /health immediately
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
