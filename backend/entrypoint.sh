#!/bin/bash
set -e

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "" ]; then
  php artisan key:generate --force
fi

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000
