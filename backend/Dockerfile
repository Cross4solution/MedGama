# ╔══════════════════════════════════════════════════════════════════╗
# ║  MedaGama Backend — Railway Production Dockerfile              ║
# ║  Single container: Nginx + PHP-FPM + Queue + Reverb            ║
# ║  Managed by Supervisor                                         ║
# ╚══════════════════════════════════════════════════════════════════╝

# ── Stage 1: Composer dependencies ──
FROM composer:2 AS vendor

WORKDIR /app
COPY composer.json composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-scripts \
    --prefer-dist \
    --optimize-autoloader \
    --ignore-platform-req=php

# ── Stage 2: Production image ──
FROM php:8.4-fpm-alpine

# Install system deps + PHP extensions + Nginx + Supervisor
RUN apk add --no-cache \
        nginx \
        supervisor \
        postgresql-dev \
        libpng-dev \
        libjpeg-turbo-dev \
        freetype-dev \
        libzip-dev \
        icu-dev \
        oniguruma-dev \
        linux-headers \
        bash \
        $PHPIZE_DEPS \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j$(nproc) \
        pdo_pgsql \
        pgsql \
        gd \
        zip \
        intl \
        mbstring \
        bcmath \
        opcache \
        pcntl \
    && pecl install redis \
    && docker-php-ext-enable redis \
    && apk del $PHPIZE_DEPS linux-headers \
    && rm -rf /var/cache/apk/* /tmp/*

# PHP production config
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# OPcache settings
COPY docker/php/opcache.ini /usr/local/etc/php/conf.d/opcache.ini

# Nginx config (Railway provides PORT env var)
# Remove ALL default nginx configs to avoid port conflicts
RUN rm -f /etc/nginx/http.d/*.conf 2>/dev/null || true
COPY docker/nginx/default.conf /etc/nginx/http.d/default.conf

# Supervisor config
COPY docker/supervisor/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# PHP-FPM: force unix socket (override any default TCP listener)
RUN rm -f /usr/local/etc/php-fpm.d/zz-docker.conf 2>/dev/null || true
COPY docker/php/php-fpm-pool.conf /usr/local/etc/php-fpm.d/zz-railway.conf

WORKDIR /var/www/html

# Copy vendor from stage 1
COPY --from=vendor /app/vendor ./vendor

# Copy application code
COPY . .

# Entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Create required directories & set permissions
RUN mkdir -p storage/logs storage/framework/cache storage/framework/sessions storage/framework/views \
        bootstrap/cache /var/run /var/log/supervisor \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && chown -R www-data:www-data /var/lib/nginx /var/log/nginx

# Railway uses PORT env var (default 8080)
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
