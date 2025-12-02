# Multi-stage Dockerfile for the Laravel `xpos` app
# Build context: the `xpos` directory. Run `docker build -t xpos-app .` from that folder.

### Stage 1: Build frontend assets using Node
FROM node:20-alpine AS node-builder
WORKDIR /var/www

# Install dependencies and build assets
COPY package.json package-lock.json* ./
RUN npm ci --silent || npm install --silent
COPY . .
RUN npm run build

### Stage 2: Prepare PHP environment & Composer install
FROM php:8.3-fpm-alpine AS php-builder
WORKDIR /var/www

# System dependencies for common PHP extensions and building
RUN apk add --no-cache --virtual .build-deps \
    $PHPIZE_DEPS \
    autoconf \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    zlib-dev \
    libpng-dev \
    libjpeg-turbo-dev \
    freetype-dev \
    gcc \
    g++ \
    make \
    curl \
    git \
    bash \
  && apk add --no-cache ca-certificates

# Configure and install PHP extensions required by the app
RUN docker-php-ext-configure gd --with-freetype --with-jpeg \
  && docker-php-ext-install -j$(nproc) pdo pdo_mysql zip gd bcmath intl mbstring pcntl opcache

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Copy composer files and install PHP dependencies (no-dev for production)
COPY composer.json composer.lock* ./
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader --no-scripts || composer install --no-interaction

# Copy full project for any scripts that may run during final build
COPY . .

### Stage 3: Final image
FROM php:8.3-fpm-alpine
WORKDIR /var/www

# System runtime deps + Nginx + Supervisor
RUN apk add --no-cache bash ca-certificates openssl curl libzip zlib libpng libjpeg-turbo freetype \
    nginx supervisor

# Copy PHP extensions from builder
COPY --from=php-builder /usr/local/lib/php/extensions/ /usr/local/lib/php/extensions/
COPY --from=php-builder /usr/local/etc/php/conf.d/ /usr/local/etc/php/conf.d/

# Copy app files
COPY --from=php-builder /var/www /var/www

# Copy built frontend assets from node-builder
COPY --from=node-builder /var/www/public/build /var/www/public/build

# Copy environment file (will be provided during build)
COPY .env /var/www/.env

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/http.d/default.conf

# Create supervisor config
RUN mkdir -p /etc/supervisor.d && \
    echo '[supervisord]' > /etc/supervisor.d/supervisord.ini && \
    echo 'nodaemon=true' >> /etc/supervisor.d/supervisord.ini && \
    echo 'user=root' >> /etc/supervisor.d/supervisord.ini && \
    echo 'logfile=/dev/stdout' >> /etc/supervisor.d/supervisord.ini && \
    echo 'logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:php-fpm]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=php-fpm -F' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini && \
    echo '' >> /etc/supervisor.d/supervisord.ini && \
    echo '[program:nginx]' >> /etc/supervisor.d/supervisord.ini && \
    echo 'command=nginx -g "daemon off;"' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor.d/supervisord.ini && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor.d/supervisord.ini && \
    echo 'autorestart=true' >> /etc/supervisor.d/supervisord.ini

# Create directories and set permissions
RUN chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache || true && \
    mkdir -p /run/nginx && \
    chown -R www-data:www-data /var/lib/nginx /var/log/nginx

EXPOSE 80

# Start both PHP-FPM and Nginx via supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor.d/supervisord.ini"]
