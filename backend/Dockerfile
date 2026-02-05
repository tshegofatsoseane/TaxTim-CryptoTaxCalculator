# PHP 8.4 FPM base
FROM php:8.4-fpm

WORKDIR /var/www

# Install system dependencies + nginx
RUN apt-get update && apt-get install -y \
    git unzip curl zip bash nginx libzip-dev \
    && docker-php-ext-install zip \
    && rm -rf /var/lib/apt/lists/*

# Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy Laravel app
COPY . .

# Install dependencies
RUN composer install --no-dev --optimize-autoloader

# Permissions
RUN chown -R www-data:www-data /var/www \
    && chmod -R 775 storage bootstrap/cache

# Copy nginx config + start script
COPY docker/nginx/render.conf /etc/nginx/sites-available/default

COPY docker/nginx/start.sh /start.sh
RUN chmod +x /start.sh

# Render will route traffic to $PORT (usually 10000)
EXPOSE 10000

CMD ["/start.sh"]
