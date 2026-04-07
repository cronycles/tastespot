#!/bin/bash
set -e


PHP=/opt/cpanel/ea-php84/root/usr/bin/php
REPO=/home/crointhe/repositories/tastespot
DEST=/home/crointhe/public_html/tastespot

echo "=== Step 0: Clean repo ==="
cd "$REPO"
rm -f error_log
git reset --hard
git clean -fd
git pull || { echo "[ERRORE] git pull fallito"; exit 1; }
cd -

echo "=== Step 1: Copia backend/ → public_html/tastespot/ ==="
find "$REPO/backend" -mindepth 1 -maxdepth 1 ! -name storage -exec cp -rf {} "$DEST/" \;

echo "=== Step 2: Laravel setup ==="
cd "$DEST"
$PHP artisan migrate --force
$PHP artisan optimize:clear || true
$PHP artisan config:cache
$PHP artisan route:cache
rm -f "$DEST/public/storage"
$PHP artisan storage:link 2>/dev/null || true

echo "=== Step 3: Permessi ==="
chmod -R 775 "$DEST/storage" "$DEST/bootstrap/cache"

echo "=== Step 4: Build e publish web SPA ==="
if ! command -v npm >/dev/null 2>&1; then
	echo "[ERRORE] npm non trovato sul server. Impossibile buildare la web app."
	exit 1
fi

cd "$REPO/web"
npm ci
npm run build

mkdir -p "$DEST/public/assets"
rm -rf "$DEST/public/assets"/*
cp -rf "$REPO/web/dist"/* "$DEST/public/"

echo "=== Deploy completato ==="

