#!/bin/bash
set -e

PHP=/opt/cpanel/ea-php84/root/usr/bin/php
REPO=/home/crointhe/repositories/tastespot
DEST=/home/crointhe/public_html/tastespot

echo "=== Step 1: Copia backend/ → public_html/tastespot/ ==="
find "$REPO/backend" -mindepth 1 -maxdepth 1 ! -name storage -exec cp -rf {} "$DEST/" \;

echo "=== Step 2: Laravel setup ==="
cd "$DEST"
$PHP artisan migrate --force
$PHP artisan optimize:clear
$PHP artisan config:cache
$PHP artisan route:cache
$PHP artisan storage:link 2>/dev/null || true

echo "=== Step 3: Permessi ==="
chmod -R 775 "$DEST/storage" "$DEST/bootstrap/cache"

echo "=== Deploy completato ==="

