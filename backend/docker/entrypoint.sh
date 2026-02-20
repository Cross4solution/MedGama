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

# ── Force safe defaults: no Redis dependency ──
# Override any Railway env vars that point to redis
export QUEUE_CONNECTION="${QUEUE_CONNECTION:-sync}"
export CACHE_STORE="${CACHE_STORE:-file}"
export SESSION_DRIVER="${SESSION_DRIVER:-file}"
export BROADCAST_CONNECTION="${BROADCAST_CONNECTION:-log}"

# If QUEUE/CACHE/SESSION is set to redis, check if Redis is actually reachable
if [ "$QUEUE_CONNECTION" = "redis" ] || [ "$CACHE_STORE" = "redis" ] || [ "$SESSION_DRIVER" = "redis" ]; then
    REDIS_HOST_CHECK="${REDIS_HOST:-127.0.0.1}"
    REDIS_PORT_CHECK="${REDIS_PORT:-6379}"
    if ! timeout 2 sh -c "echo > /dev/tcp/$REDIS_HOST_CHECK/$REDIS_PORT_CHECK" 2>/dev/null; then
        echo "⚠ Redis not reachable at $REDIS_HOST_CHECK:$REDIS_PORT_CHECK — falling back to safe defaults"
        export QUEUE_CONNECTION=sync
        export CACHE_STORE=file
        export SESSION_DRIVER=file
    else
        echo "✓ Redis reachable at $REDIS_HOST_CHECK:$REDIS_PORT_CHECK"
    fi
fi

echo "→ QUEUE=$QUEUE_CONNECTION CACHE=$CACHE_STORE SESSION=$SESSION_DRIVER"

# Start Supervisor NOW — Nginx answers /health immediately
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
