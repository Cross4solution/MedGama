#!/bin/sh
# Absolute minimum: set PORT, create dirs, force safe env, start web server.
# Zero PHP commands. Zero Redis dependency. Nginx starts in < 1 second.

PORT="${PORT:-8080}"
echo "→ MedaGama port=$PORT"
sed -i "s/__PORT__/$PORT/g" /etc/nginx/http.d/default.conf

mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views bootstrap/cache
chmod -R 775 storage bootstrap/cache 2>/dev/null || true
chown -R www-data:www-data storage bootstrap/cache 2>/dev/null || true

# Ensure storage symlink exists (equivalent of `php artisan storage:link`)
mkdir -p public
ln -sfn ../storage/app/public public/storage

# Force safe defaults — no Redis, no external dependency
export CACHE_STORE=file
export QUEUE_CONNECTION=sync
export SESSION_DRIVER=file
export BROADCAST_CONNECTION=log

exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
