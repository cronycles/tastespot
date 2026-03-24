# Deploy TasteSpot Backend — SupportHost (cPanel)

## Stato attuale (infrastruttura già configurata)

| Componente | Valore |
|---|---|
| URL produzione | `https://tastespot.crointhemorning.com` |
| Server IP | `144.76.85.27` |
| cPanel host | `crointhemorning.com:2083` |
| cPanel user | `crointhe` |
| Repo sul server | `/home/crointhe/repositories/tastespot` |
| Web root | `/home/crointhe/public_html/tastespot/` |
| Document root | `/home/crointhe/public_html/tastespot/public` |
| PHP CLI | `/opt/cpanel/ea-php84/root/usr/bin/php` (8.4) |
| Database | MySQL `crointhe_tastespot`, utente `crointhe_ts` |
| Composer | `/home/crointhe/bin/composer` (ma NON usato — `vendor/` è in git) |

---

## Come funziona il deploy automatico

Ogni push su `main` che tocca file in `backend/`, `.cpanel.yml`, o `.github/workflows/deploy.yml`:

```
git push origin main
    → GitHub Actions (.github/workflows/deploy.yml)
        1. chiama cPanel UAPI: VersionControl/update
        2. sleep 15 secondi
        3. chiama cPanel UAPI: VersionControlDeployment/create → esegue .cpanel.yml
            → bash scripts/deploy.sh
                Step 0: rm -f error_log + git reset --hard + git clean -fd + git pull
                Step 1: find+cp: copia backend/ → public_html/tastespot/ (esclude storage/)
                Step 2: php artisan migrate --force
                        php artisan optimize:clear (|| true — non blocca se fallisce)
                        php artisan config:cache
                        php artisan route:cache
                        rm -f public/storage          ← rimuove eventuale symlink sbagliato
                        php artisan storage:link       ← ricrea symlink corretto sul server
                Step 3: chmod -R 775 storage/ bootstrap/cache/
```

**Il `deploy.sh` fa `git pull` da solo** — anche se cPanel non aggiorna il repo, lo script lo aggiorna lui prima di copiare i file.

**`optimize:clear` non blocca il deploy** — usa `|| true` perché sul server manca la tabella `cache` (usa MySQL, non ha la tabella di cache SQLite).

**`.env` sul server non viene mai toccato** — esiste solo sul server, non è in git.

**`vendor/` è committato nel repo** — nessun `composer install` sul server (il server ha `allow_url_fopen=0` che impedirebbe di scaricare roba da internet).

**`storage/` non viene mai sovrascritto** — il deploy esclude quella cartella.

---

## Setup iniziale (già fatto — per riferimento o per rifare da zero)

### Checklist infrastruttura (stato attuale: tutto completato)

- [x] Sottodominio `tastespot.crointhemorning.com` → document root `/home/crointhe/public_html/tastespot/public`
- [x] DNS: A record `tastespot` → `144.76.85.27` su **Cloudflare** (non cPanel Zone Editor!)
- [x] Database MySQL `crointhe_tastespot` + utente `crointhe_ts` con tutti i privilegi
- [x] PHP 8.4 impostato nel MultiPHP Manager per il sottodominio
- [x] Estensioni PHP abilitate: `pdo_mysql`, `mysqli`, `fileinfo`, `exif`
- [x] Repo Git clonato in `/home/crointhe/repositories/tastespot` via cPanel Git Version Control
- [x] `.env` creato in `/home/crointhe/public_html/tastespot/` con credenziali produzione
- [x] `storage/` creato manualmente la prima volta (poi mantenuto automaticamente)
- [x] Migrazioni applicate con `php artisan migrate --force`
- [x] GitHub Actions secrets configurati: `CPANEL_USER` e `CPANEL_TOKEN`

---

## Configurare da zero su un altro server

Se si dovesse ripartire da zero (es. migrazione hosting), questi sono i passi nell'ordine giusto.

### Step 1 — Crea il repo in cPanel Git Version Control

1. cPanel → **Git™ Version Control** → **Create**
2. Clone URL: `https://github.com/cronycles/tastespot.git`
3. Repository Path: `/home/crointhe/repositories/tastespot`
4. Dopo la creazione, clicca **Manage** → **Update** per fare il primo git pull

### Step 2 — Configura la web root

1. cPanel → **Subdomains** → crea `tastespot`
2. Document root: `/home/crointhe/public_html/tastespot/public`

### Step 3 — Crea il `.env` di produzione sul server

Dal **Terminale cPanel** (o via SSH):
```bash
cp /home/crointhe/public_html/tastespot/.env.example \
   /home/crointhe/public_html/tastespot/.env
```

Edita il file con le credenziali reali:
```
APP_NAME=TasteSpot
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...         # genera con: php artisan key:generate --show
APP_URL=https://tastespot.crointhemorning.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=crointhe_tastespot
DB_USERNAME=crointhe_ts
DB_PASSWORD=...

FILESYSTEM_DISK=public
```

> Il file `.env.production` nella repo locale (non in git) contiene i valori completi.

### Step 4 — Crea le directory storage (solo la primissima volta)

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

### Step 5 — Esegui il primo deploy manuale

```bash
# Esegue lo stesso script del deploy automatico
bash /home/crointhe/repositories/tastespot/scripts/deploy.sh
```

Questo copia i file, applica le migrazioni e builda la cache.

### Step 6 — Configura i GitHub Actions secrets

Nel repo GitHub → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**:
- `CPANEL_USER` = `crointhe`
- `CPANEL_TOKEN` = token API cPanel (cPanel → **Manage API Tokens** → Create)

---

## Operazioni quotidiane

### Deploy di una modifica al backend

```bash
# Dalla root del monorepo locale
git add backend/
git commit -m "Descrizione modifica"
git push origin main
# → GitHub Actions fa il resto automaticamente (~30 secondi)
```

### Verificare che il deploy sia andato a buon fine

1. GitHub → **Actions** → clicca sull'ultimo workflow → controlla che sia verde
2. Controlla l'endpoint di health check:
   ```bash
   curl -s https://tastespot.crointhemorning.com/api/v1/ping
   # Risposta attesa: {"status":"ok","version":"1.0.5"}
   ```
   > La root URL (`https://tastespot.crointhemorning.com`) restituisce `{"message":"The route / could not be found."}` — è normale, è un'API pura.
3. Oppure testa il login:
   ```bash
   curl -s https://tastespot.crointhemorning.com/api/v1/auth/login
   # Risposta attesa: {"message":"The email field is required.",...}
   ```

### Vedere i log di errore sul server

Dal **Terminale cPanel**:
```bash
tail -100 /home/crointhe/public_html/tastespot/storage/logs/laravel.log
```

### Aggiungere/modificare una migration

```bash
# Locale: crea e testa la migration
php artisan make:migration add_colonna_a_tabella
php artisan migrate

# Poi committa e pusha — il deploy applica automaticamente migrate --force
git add database/migrations/
git commit -m "Add migration: aggiungi colonna X"
git push origin main
```

---

## Gotcha e problemi noti

### DNS gestito da Cloudflare, non da cPanel

Il dominio `crointhemorning.com` usa **Cloudflare come nameserver** (NS: `chase.ns.cloudflare.com`, `kia.ns.cloudflare.com`). Qualsiasi record DNS va aggiunto su **Cloudflare** — il Zone Editor di cPanel è completamente ignorato.

Per aggiungere o modificare il sottodominio:
1. [dash.cloudflare.com](https://dash.cloudflare.com) → `crointhemorning.com` → **DNS** → **Records**
2. Type: `A`, Name: `tastespot`, IPv4: `144.76.85.27`
3. **Proxy status: grigio (DNS only)** — NON arancione. Con il proxy arancione Cloudflare fa da intermediario e rompe cPanel/SSL.

Propagazione con Cloudflare: quasi istantanea (30 secondi - 2 minuti).

---

### Certificato SSL (errore di privacy nel browser)

Dopo aver aggiunto il record DNS su Cloudflare, il browser mostra un avviso SSL perché cPanel non ha ancora un certificato valido per `tastespot.crointhemorning.com`.

**Soluzione — AutoSSL di cPanel (Let's Encrypt gratuito):**
1. cPanel → cerca **"SSL/TLS Status"**
2. Clicca **Run AutoSSL** — rileva automaticamente tutti i sottodomini e genera i certificati
3. Aspetta 1-2 minuti → ricarica la pagina nel browser

Alternativamente: cPanel → **SSL/TLS** → **Manage SSL Sites** → seleziona il sottodominio → installa il cert generato da AutoSSL.

---

### `error_log` compare nel repo sul server

Dopo ogni operazione cPanel (es. "Update From Remote"), può comparire un file `error_log` nella cartella del repo.

**Questo è gestito automaticamente dal `deploy.sh`** — lo script fa `rm -f error_log` + `git reset --hard` + `git clean -fd` prima di ogni pull.

Se dovessi fare un deploy manuale e trovare il repo sporco:
```bash
cd /home/crointhe/repositories/tastespot
rm -f error_log
git reset --hard
git pull origin main
bash scripts/deploy.sh
```

### `allow_url_fopen=0` sul server

SupportHost ha `allow_url_fopen=0` a livello sistema — questo impedisce a PHP CLI di fare richieste HTTP (es. scaricare `composer.phar`, ecc.). Per questo motivo:
- **`vendor/` è committato nel repo** (la riga `vendor/` in `backend/.gitignore` è commentata)
- Non eseguire mai `composer install` sul server — non funzionerebbe

### PHP path sul server

Il PHP di sistema (`/usr/bin/php`) potrebbe puntare a una versione vecchia. Usare sempre:
```bash
/opt/cpanel/ea-php84/root/usr/bin/php
```
Come fa già `scripts/deploy.sh`.

### `storage/` mancante al primo deploy

Il deploy non crea `storage/` se non esiste (il `find+cp` lo esclude esplicitamente per non sovrascrivere file caricati). Va creato a mano la prima volta sola (vedi Step 4 sopra).

---

## Troubleshooting

### 500 Internal Server Error
```bash
tail -50 /home/crointhe/public_html/tastespot/storage/logs/laravel.log
```

### "could not find driver" (PHP MySQL)
cPanel → **Select PHP Extensions** → abilitare `mysqli` e `pdo_mysql`

### Le foto non si caricano / URL rotto
```bash
ls -la /home/crointhe/public_html/tastespot/public/storage
# Deve mostrare: storage -> /home/crointhe/public_html/tastespot/storage/app/public
```

Se il symlink punta a un path locale del Mac (es. `/Users/cronycles/...`) o è assente:
```bash
rm /home/crointhe/public_html/tastespot/public/storage
ln -s /home/crointhe/public_html/tastespot/storage/app/public \
      /home/crointhe/public_html/tastespot/public/storage
```

> Il `deploy.sh` fa già `rm -f public/storage` + `artisan storage:link` ad ogni deploy, quindi questo problema non dovrebbe ripresentarsi. Il symlink **non è tracciato in git** (`backend/public/.gitignore` lo esclude).

### "Class not found" o errori autoload
```bash
cd /home/crointhe/public_html/tastespot
/opt/cpanel/ea-php84/root/usr/bin/php artisan config:clear
/opt/cpanel/ea-php84/root/usr/bin/php artisan cache:clear
/opt/cpanel/ea-php84/root/usr/bin/php artisan optimize:clear
```

### GitHub Actions fallisce con 401
Rigenera il token API cPanel: cPanel → **Manage API Tokens** → Create new → aggiorna il secret `CPANEL_TOKEN` su GitHub.

### Il workflow non si triggera su push
Controlla che il push tocchi almeno uno dei path configurati nel workflow:
- `backend/**`
- `.cpanel.yml`
- `.github/workflows/deploy.yml`

Se vuoi forzare un deploy senza modifiche: GitHub → **Actions** → seleziona il workflow → **Run workflow**.

