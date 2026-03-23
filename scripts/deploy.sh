#!/bin/bash
set -e

PHP=/opt/cpanel/ea-php84/root/usr/bin/php
REPO=/home/crointhe/repositories/tastespot
DEST=/home/crointhe/public_html/tastespot
COMPOSER=~/bin/composer

echo "=== Step 1: Copia backend/ → public_html/tastespot/ ==="
find "$REPO/backend" -mindepth 1 -maxdepth 1 ! -name storage -exec cp -rf {} "$DEST/" \;

echo "=== Step 2: Installa Composer con PHP 8.4 ==="
rm -f ~/bin/composer
mkdir -p ~/bin
curl -sS https://getcomposer.org/installer | $PHP -d allow_url_fopen=On -- --install-dir=~/bin --filename=composer

echo "=== Step 3: composer install ==="
cd "$DEST"
$PHP $COMPOSER install --no-dev --optimize-autoloader --no-interaction

echo "=== Step 4: Laravel setup ==="
$PHP artisan migrate --force
$PHP artisan optimize:clear
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan storage:link 2>/dev/null || true

echo "=== Step 5: Permessi ==="
chmod -R 775 "$DEST/storage" "$DEST/bootstrap/cache"

echo "=== Deploy completato ==="
