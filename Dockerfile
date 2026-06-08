# syntax=docker/dockerfile:1

# =====================================================================
# Nelayar GIS — multi-stage build
#   stage "assets"  : build the Vite/React frontend  -> public/build
#   stage "vendor"  : install PHP dependencies        -> vendor/
#   stage "app"     : final PHP-FPM image + Python microservice venv
#   stage "web"     : nginx image serving public/ (built from "app")
# =====================================================================

# ---------------------------------------------------------------------
# 1. PHP dependencies (composer)
# ---------------------------------------------------------------------
FROM composer:2 AS vendor
WORKDIR /app

COPY composer.json composer.lock ./
# Scripts run artisan, which needs the full app + a key; defer them to runtime.
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-interaction \
        --prefer-dist \
        --optimize-autoloader


# ---------------------------------------------------------------------
# 2. Frontend assets (Vite build)
#    Needs PHP too: the Wayfinder Vite plugin shells out to `php artisan`
#    to generate route helpers during the build.
# ---------------------------------------------------------------------
FROM php:8.4-cli-bookworm AS assets

# Node 22 (copied from the official image) alongside PHP.
COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node
COPY --from=node:22-bookworm-slim /usr/local/lib/node_modules /usr/local/lib/node_modules
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm \
    && ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx

WORKDIR /app

# Install JS deps first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Full project + vendor so `php artisan` (Wayfinder) can boot during the build.
COPY . .
COPY --from=vendor /app/vendor ./vendor

# Minimal env + dummy key so the artisan kernel boots for route generation.
RUN cp .env.example .env \
    && php artisan key:generate --force \
    && npm run build


# ---------------------------------------------------------------------
# 3. Application image (PHP-FPM + Python microservices)
# ---------------------------------------------------------------------
FROM php:8.4-fpm-bookworm AS app

# --- System packages: build deps for PHP extensions + Python runtime ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        libpq-dev \
        libzip-dev \
        libicu-dev \
        libpng-dev \
        libjpeg-dev \
        libfreetype6-dev \
        libgdal-dev \
        zip unzip git \
        python3 python3-venv python3-dev python3-pip \
        gdal-bin \
    && rm -rf /var/lib/apt/lists/*

# --- PHP extensions ---
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        pdo_pgsql \
        pgsql \
        bcmath \
        intl \
        zip \
        gd \
        pcntl \
        opcache \
    && pecl install redis \
    && docker-php-ext-enable redis

# --- Composer binary (for runtime artisan/composer scripts if needed) ---
COPY --from=vendor /usr/bin/composer /usr/bin/composer

# --- PHP config ---
COPY docker/php/php.ini /usr/local/etc/php/conf.d/zz-nelayar.ini

WORKDIR /var/www/html

# --- Application code, vendor, and built assets ---
COPY . .
COPY --from=vendor /app/vendor ./vendor
# Full public/ from the assets stage carries the Vite build plus the
# PWA service worker (public/sw.js) and manifest emitted at the web root.
COPY --from=assets /app/public ./public

# --- Python microservice venv at the path PYTHON_PATH expects ---
# OceanService / FishPriceService / RouteService all resolve
# `microservice/.venv/bin/python` correctly (relative to project root).
RUN python3 -m venv microservice/.venv \
    && microservice/.venv/bin/pip install --no-cache-dir --upgrade pip \
    && microservice/.venv/bin/pip install --no-cache-dir \
        numpy \
        scipy \
        matplotlib \
        shapely \
        rasterio \
        searoute \
        copernicusmarine \
        requests \
        beautifulsoup4

# --- Ensure Laravel's writable dirs exist, then fix permissions ---
RUN mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/framework/testing \
        storage/logs \
        storage/app/public \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R ug+rwX storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint
RUN chmod +x /usr/local/bin/entrypoint

ENTRYPOINT ["entrypoint"]
CMD ["php-fpm"]


# ---------------------------------------------------------------------
# 4. Nginx image (serves static assets, proxies PHP to the app service)
# ---------------------------------------------------------------------
FROM nginx:1.27-alpine AS web

COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
# Public dir (incl. built assets) so nginx can serve static files directly.
COPY --from=app /var/www/html/public /var/www/html/public
