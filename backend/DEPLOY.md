---
description: This document contains procedure to deploy the backend application.
alwaysApply: false
---

# Deploy TasteSpot Backend - SupportHost (cPanel)

## Current Status (Infrastructure Already Configured)

| Component      | Value                                                                    |
| -------------- | ------------------------------------------------------------------------ |
| Production URL | `https://tastespot.crointhemorning.com`                                  |
| Server IP      | `144.76.85.27`                                                           |
| cPanel host    | `crointhemorning.com:2083`                                               |
| cPanel user    | `crointhe`                                                               |
| Repo on server | `/home/crointhe/repositories/tastespot`                                  |
| Web root       | `/home/crointhe/public_html/tastespot/`                                  |
| Document root  | `/home/crointhe/public_html/tastespot/public`                            |
| PHP CLI        | `/opt/cpanel/ea-php84/root/usr/bin/php` (8.4)                            |
| Database       | MySQL `crointhe_tastespot`, user `crointhe_ts`                           |
| Composer       | `/home/crointhe/bin/composer` (NOT used - `vendor/` is committed to git) |

---

## How Automatic Deployment Works

Every push to `main` that touches files in `backend/`, `web/`, `scripts/deploy.sh`, `.cpanel.yml`, or `.github/workflows/deploy.yml`:

```
git push origin main
    -> GitHub Actions (.github/workflows/deploy.yml)
        1. calls cPanel UAPI: VersionControl/update
        2. sleep 15 seconds
        3. calls cPanel UAPI: VersionControlDeployment/create -> runs .cpanel.yml
            -> bash scripts/deploy.sh
                Step 0: rm -f error_log + git reset --hard + git clean -fd + git pull
                Step 1: find+cp: copy backend/ -> public_html/tastespot/ (excluding storage/)
                Step 2: php artisan migrate --force
                        php artisan optimize:clear (|| true - does not block if it fails)
                        php artisan config:cache
                        php artisan route:cache
                        rm -f public/storage          <- remove possible wrong symlink
                        php artisan storage:link      <- recreate correct symlink on server
                Step 3: chmod -R 775 storage/ bootstrap/cache/
               Step 4: copy web/dist/* -> public/ (SPA root already built locally)
```

**`deploy.sh` performs `git pull` on its own** - even if cPanel does not update the repo, the script updates it before copying files.

**Automatic deploy only from `main`** - `develop` never triggers production deployment.

**`optimize:clear` does not block deploy** - it uses `|| true` because the `cache` table is missing on the server (it uses MySQL, not SQLite cache table).

**`.env` on the server is never touched** - it exists only on the server and is not tracked in git.

**`vendor/` is committed in the repository** - no `composer install` on the server (the server has `allow_url_fopen=0`, which would block downloads from the internet).

**`storage/` is never overwritten** - deployment explicitly excludes that folder.

---

## Initial Setup (Already Done - For Reference or Rebuilding from Scratch)

### Infrastructure Checklist (Current Status: Fully Completed)

- [x] Subdomain `tastespot.crointhemorning.com` -> document root `/home/crointhe/public_html/tastespot/public`
- [x] DNS: A record `tastespot` -> `144.76.85.27` on **Cloudflare** (not cPanel Zone Editor)
- [x] MySQL database `crointhe_tastespot` + user `crointhe_ts` with all privileges
- [x] PHP 8.4 set in MultiPHP Manager for the subdomain
- [x] Required PHP extensions enabled: `pdo_mysql`, `mysqli`, `fileinfo`, `exif`
- [x] Git repo cloned to `/home/crointhe/repositories/tastespot` via cPanel Git Version Control
- [x] `.env` created in `/home/crointhe/public_html/tastespot/` with production credentials
- [x] `storage/` created manually the first time (then maintained automatically)
- [x] Migrations applied with `php artisan migrate --force`
- [x] GitHub Actions secrets configured: `CPANEL_USER` and `CPANEL_TOKEN`

---

## Configure from Scratch on Another Server

If you need to start from scratch (for example, hosting migration), follow these steps in order.

### Step 1 - Create the Repo in cPanel Git Version Control

1. cPanel -> **Git(TM) Version Control** -> **Create**
2. Clone URL: `https://github.com/cronycles/tastespot.git`
3. Repository Path: `/home/crointhe/repositories/tastespot`
4. After creation, click **Manage** -> **Update** to run the first git pull

### Step 2 - Configure the Web Root

1. cPanel -> **Subdomains** -> create `tastespot`
2. Document root: `/home/crointhe/public_html/tastespot/public`

### Step 3 - Create Production `.env` on Server

From **cPanel Terminal** (or via SSH):

```bash
cp /home/crointhe/public_html/tastespot/.env.example \
   /home/crointhe/public_html/tastespot/.env
```

Edit the file with real credentials:

```
APP_NAME=TasteSpot
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...         # generate with: php artisan key:generate --show
APP_URL=https://tastespot.crointhemorning.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=crointhe_tastespot
DB_USERNAME=crointhe_ts
DB_PASSWORD=...

FILESYSTEM_DISK=public
```

> The `.env.production` file in the local repo (not committed) contains the full values.

### Step 4 - Create Storage Directories (First Time Only)

```bash
PHP=/opt/cpanel/ea-php84/root/usr/bin/php
DEST=/home/crointhe/public_html/tastespot

mkdir -p "$DEST/storage/app/public" \
         "$DEST/storage/framework/cache" \
         "$DEST/storage/framework/sessions" \
         "$DEST/storage/framework/views" \
         "$DEST/storage/logs" \
         "$DEST/bootstrap/cache"

chmod -R 775 "$DEST/storage" "$DEST/bootstrap/cache"
```

### Step 5 - Run the First Manual Deployment

```bash
# Runs the same script used by automatic deployment
bash /home/crointhe/repositories/tastespot/scripts/deploy.sh
```

This copies files, applies migrations, and builds cache.

### Step 6 - Configure GitHub Actions Secrets

In GitHub repo -> **Settings** -> **Secrets and variables** -> **Actions** -> **New repository secret**:

- `CPANEL_USER` = `crointhe`
- `CPANEL_TOKEN` = cPanel API token (cPanel -> **Manage API Tokens** -> Create)

---

## Daily Operations

### Deploy a Backend Change

```bash
# From local monorepo root
git add backend/
git commit -m "Change description"
git push origin main
# -> GitHub Actions handles the rest automatically (~30 seconds)
```

### Deploy a Frontend Web Change

```bash
# From local monorepo root
npm run build:prod
git add web/src web/public web/index.html web/dist
git commit -m "Web change description"
git push origin main
```

**Important:** the server does not run `npm install`, `npm ci`, or `npm run build`. If you do not run `npm run build:prod` and commit `web/dist/` before pushing, production will keep an old build even if `web/src/` has new source files.

### Verify Deployment Succeeded

1. GitHub -> **Actions** -> open the latest workflow -> check that it is green.
2. Check health endpoint:
    ```bash
    curl -s https://tastespot.crointhemorning.com/api/v1/ping
    # Expected response: {"status":"ok","version":"1.0.5"}
    ```
3. Check web homepage:
    ```bash
    curl -I https://tastespot.crointhemorning.com/
    ```
    It should return SPA HTML, not Laravel JSON.
4. Or test login endpoint:
    ```bash
    curl -s https://tastespot.crointhemorning.com/api/v1/auth/login
    # Expected response: {"message":"The email field is required.",...}
    ```

### View Server Error Logs

From **cPanel Terminal**:

```bash
tail -100 /home/crointhe/public_html/tastespot/storage/logs/laravel.log
```

### Add/Modify a Migration

```bash
# Local: create and test migration
php artisan make:migration add_column_to_table
php artisan migrate

# Then commit and push - deploy automatically applies migrate --force
git add database/migrations/
git commit -m "Add migration: add column X"
git push origin main
```

---

## Gotchas and Known Issues

### DNS Managed by Cloudflare, Not cPanel

Domain `crointhemorning.com` uses **Cloudflare nameservers** (NS: `chase.ns.cloudflare.com`, `kia.ns.cloudflare.com`). Any DNS record must be added in **Cloudflare** - cPanel Zone Editor is ignored.

To add or modify the subdomain:

1. [dash.cloudflare.com](https://dash.cloudflare.com) -> `crointhemorning.com` -> **DNS** -> **Records**
2. Type: `A`, Name: `tastespot`, IPv4: `144.76.85.27`
3. **Proxy status: gray (DNS only)** - NOT orange. Orange proxy puts Cloudflare in front and breaks cPanel/SSL.

Cloudflare propagation is almost instant (30 seconds - 2 minutes).

---

### SSL Certificate (Browser Privacy Warning)

After adding DNS record on Cloudflare, browser may show SSL warning because cPanel does not yet have a valid certificate for `tastespot.crointhemorning.com`.

**Solution - cPanel AutoSSL (free Let's Encrypt):**

1. cPanel -> search for **"SSL/TLS Status"**
2. Click **Run AutoSSL** - it auto-detects subdomains and generates certificates
3. Wait 1-2 minutes -> reload the page in browser

Alternative: cPanel -> **SSL/TLS** -> **Manage SSL Sites** -> select subdomain -> install certificate generated by AutoSSL.

---

### `error_log` Appears in Server Repo

After cPanel operations (for example, "Update From Remote"), an `error_log` file can appear in repo folder.

**This is automatically handled by `deploy.sh`** - script runs `rm -f error_log` + `git reset --hard` + `git clean -fd` before every pull.

If you run manual deployment and find a dirty repo:

```bash
cd /home/crointhe/repositories/tastespot
rm -f error_log
git reset --hard
git pull origin main
bash scripts/deploy.sh
```

### `allow_url_fopen=0` on Server

SupportHost has `allow_url_fopen=0` at system level - this prevents PHP CLI from making HTTP requests (for example, downloading `composer.phar`). Because of this:

- **`vendor/` is committed in the repository** (`vendor/` line in `backend/.gitignore` is commented)
- Never run `composer install` on server - it will fail

### PHP Path on Server

System PHP (`/usr/bin/php`) may point to an old version. Always use:

```bash
/opt/cpanel/ea-php84/root/usr/bin/php
```

This is what `scripts/deploy.sh` already does.

### Missing `storage/` on First Deploy

Deployment does not create `storage/` if it does not exist (`find+cp` explicitly excludes it to avoid overwriting uploaded files). Create it manually the first time only (see Step 4 above).

---

## Troubleshooting

### 500 Internal Server Error

```bash
tail -50 /home/crointhe/public_html/tastespot/storage/logs/laravel.log
```

### "could not find driver" (PHP MySQL)

cPanel -> **Select PHP Extensions** -> enable `mysqli` and `pdo_mysql`

### Photos Not Loading / Broken URL

```bash
ls -la /home/crointhe/public_html/tastespot/public/storage
# Should show: storage -> /home/crointhe/public_html/tastespot/storage/app/public
```

If symlink points to local Mac path (for example, `/Users/cronycles/...`) or is missing:

```bash
rm /home/crointhe/public_html/tastespot/public/storage
ln -s /home/crointhe/public_html/tastespot/storage/app/public \
      /home/crointhe/public_html/tastespot/public/storage
```

> `deploy.sh` already runs `rm -f public/storage` + `artisan storage:link` on every deploy, so this issue should not reappear. The symlink is **not tracked in git** (`backend/public/.gitignore` excludes it).

### "Class not found" or Autoload Errors

```bash
cd /home/crointhe/public_html/tastespot
/opt/cpanel/ea-php84/root/usr/bin/php artisan config:clear
/opt/cpanel/ea-php84/root/usr/bin/php artisan cache:clear
/opt/cpanel/ea-php84/root/usr/bin/php artisan optimize:clear
```

### GitHub Actions Fails with 401

Regenerate cPanel API token: cPanel -> **Manage API Tokens** -> Create new -> update `CPANEL_TOKEN` secret on GitHub.

### Workflow Does Not Trigger on Push

Check that the push touched at least one configured workflow path:

- `backend/**`
- `.cpanel.yml`
- `.github/workflows/deploy.yml`

If you want to force deployment without changes: GitHub -> **Actions** -> select workflow -> **Run workflow**.
