#!/bin/sh
set -e

# Render provides PORT env var at runtime
if [ -n "$PORT" ]; then
  sed -i "s/listen 10000;/listen ${PORT};/g" /etc/nginx/sites-available/default
fi

php-fpm -D
nginx -g "daemon off;"
