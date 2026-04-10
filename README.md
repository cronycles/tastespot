# TasteSpot

Web app per valutare e scoprire attività di ristorazione (bar, ristoranti, gelaterie, pizzerie, ecc.) con un sistema di valutazione per categoria (location, cibo, servizio, prezzo).

**URL produzione:** `https://tastespot.crointhemorning.com/`  
**API produzione:** `https://tastespot.crointhemorning.com/api/v1/`

---

## Avvio quotidiano (TL;DR)

**Prima installazione:**

```bash
npm run restore
# installa le dipendenze di backend e web in un colpo solo
# nel backend esegue anche php artisan config:clear
```

**Avvio (dalla root, consigliato):**

```bash
npm run start
# avvia backend e web in parallelo, output colorato
```

**Oppure separati:**

```bash
cd backend && npm run start   # solo Laravel su http://127.0.0.1:8001
cd web && npm run start       # solo web app Vite su http://127.0.0.1:8000
```

---

## Stack

### Frontend Web — `web/`

- **React 19** + **Vite** + TypeScript
- **React Router** — routing SPA
- **Zustand** — riuso della logica di stato lato web
- **MapLibre GL JS** — mappa web attiva
- **Geocoding web via backend proxy** — endpoint `GET /api/v1/geo/search` e `GET /api/v1/geo/reverse` (cache + fallback provider)
- **Build output** — `web/dist/`, destinato a essere pubblicato nella root web del dominio

### Backend — `backend/`

- **Laravel 11** — framework PHP, struttura MVC
- **Laravel Sanctum** — autenticazione via token Bearer (`Authorization: Bearer <token>`)
- **SQLite** — database locale (`backend/database/database.sqlite`)
- **MySQL** — database di produzione su SupportHost cPanel
- **Laravel Storage** — foto in `backend/storage/app/public/photos/`, esposte via `/storage/photos/...`
- **Symlink storage** — `public/storage → storage/app/public`, ricreato automaticamente ad ogni deploy (non committato in git)
- **Registrazione configurabile** — `APP_REGISTRATION_ENABLED=false` blocca nuove registrazioni lato API

---

## Struttura del progetto

```
TasteSpot/                         ← radice del monorepo Git
├── .github/
│   ├── copilot-instructions.md    ← Istruzioni Copilot: stack, convenzioni, architettura
│   ├── instructions/
│   │   └── plan.instructions.md  ← Piano di sviluppo e stato fasi (auto-loaded da Copilot)
│   └── workflows/
│       ├── deploy.yml             ← GitHub Actions: auto-deploy su push a main
│       └── web-ci.yml             ← GitHub Actions: lint + build check su develop/main
├── docs/
│   └── web-requirements-remediation-plan.md ← Piano canonico web: stato, gap e fasi
├── scripts/
│   └── deploy.sh                  ← Script bash eseguito da cPanel al deploy
├── .cpanel.yml                    ← Entry point deploy cPanel (richiama deploy.sh)
├── .gitignore                     ← Root gitignore (esclude .DS_Store, keys, ecc.)
├── README.md                      ← Questo file
├── backend/                       ← Backend Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/Api/  ← AuthController, ActivityController, PhotoController, ...
│   │   └── Models/                ← User, Activity, ActivityType, Review, ActivityPhoto
│   ├── database/
│   │   ├── migrations/            ← Migrazioni database
│   │   └── database.sqlite        ← IL DATABASE locale (vedi sezione sotto)
│   ├── routes/api.php             ← Tutte le route sotto /api/v1/
│   ├── storage/app/public/photos/ ← Foto caricate dall'app
│   ├── vendor/                    ← Dipendenze PHP (committate — no composer install su server)
│   ├── .env                       ← Config locale (SQLite, APP_DEBUG=true) — NON in git
│   ├── .env.production            ← Config produzione — NON in git (solo locale e sul server)
│   ├── .gitignore
│   └── DEPLOY.md                  ← Guida completa deploy produzione
└── web/                           ← Web app React + Vite
    ├── src/                       ← Router SPA, store Zustand, componenti HTML/CSS
    │   └── styles/                ← CSS globale diviso per area (base, layout, features)
    ├── dist/                      ← Build di produzione (committata in git)
    ├── .env.development           ← VITE_API_URL=http://127.0.0.1:8001/api/v1
    ├── .env.production            ← VITE_API_URL=/api/v1
    └── package.json               ← Script dev/build/lint web
```

---

## Come accedere alle varie parti

### Web app — React + Vite

- URL locale: **http://127.0.0.1:8000** (avviata con `npm run start` da `web/`)
- URL produzione: **https://tastespot.crointhemorning.com/**

### Backend — Laravel

- Avviato con `php artisan serve --port=8001` nella cartella `backend/`
- URL locale: **http://127.0.0.1:8001**
- Tutti gli endpoint sono sotto `/api/v1/`
- Log errori: `backend/storage/logs/laravel.log`
- Foto caricate: `backend/storage/app/public/photos/`
- URL foto pubbliche: `http://127.0.0.1:8001/storage/photos/<nomefile>`

### Database SQLite — come aprirlo graficamente

Il database locale è un singolo file: `backend/database/database.sqlite`

**Opzione 1 — dentro VS Code (consigliato, zero install extra):**

1. `Cmd+Shift+X` → cerca **"SQLite Viewer"** di _Florian Klampfer_ → Installa
2. Nel file explorer di VS Code, clicca su `backend/database/database.sqlite`
3. Si apre come tabella navigabile — puoi sfogliare, filtrare, vedere tutti i record

**Opzione 2 — app standalone gratuita:**

- Scarica **[DB Browser for SQLite](https://sqlitebrowser.org)**
- File → Open Database → seleziona `backend/database/database.sqlite`

**Opzione 3 — via terminale:**

```bash
cd backend
sqlite3 database/database.sqlite
.tables                          # lista tabelle
SELECT * FROM activities;
DELETE FROM activities WHERE id = 'xxx';
.quit
```

**Tabelle principali:**

| Tabella                  | Contenuto                                    |
| ------------------------ | -------------------------------------------- |
| `users`                  | Utenti registrati                            |
| `activity_types`         | Tipologie (bar, ristorante, ecc.)            |
| `activities`             | Attività salvate                             |
| `activity_activity_type` | Relazione molti-a-molti attività ↔ tipologie |
| `reviews`                | Recensioni (score, note, costi)              |
| `activity_photos`        | Metadati foto (path su disco)                |
| `personal_access_tokens` | Token Sanctum (sessioni login)               |

---

## API Backend — tutti gli endpoint

Base URL locale: `http://127.0.0.1:8001/api/v1/`
Base URL produzione: `https://tastespot.crointhemorning.com/api/v1/`

> L'URL radice (`/`) non esiste — è un'API pura. Usa `/api/v1/ping` per verificare che il server sia su.
> Autenticazione: header `Authorization: Bearer <token>` (🔒 = richiesto)

| Metodo | Path                       | Descrizione                                                 |
| ------ | -------------------------- | ----------------------------------------------------------- |
| GET    | `/auth/settings`           | Config pubblica auth (`registration_enabled`)               |
| GET    | `/geo/search`              | Ricerca geocoding (proxy Nominatim con cache/fallback)      |
| GET    | `/geo/reverse`             | Reverse geocoding (proxy Nominatim con cache)               |
| POST   | `/auth/register`           | Registrazione → restituisce token                           |
| POST   | `/auth/login`              | Login → restituisce token                                   |
| POST   | `/auth/logout`             | Logout 🔒                                                   |
| GET    | `/auth/me`                 | Dati utente corrente 🔒                                     |
| POST   | `/auth/change-password`    | Cambia password con verifica password attuale 🔒            |
| GET    | `/types`                   | Lista tipologie 🔒                                          |
| POST   | `/types`                   | Crea tipologia 🔒                                           |
| PUT    | `/types/:id`               | Modifica tipologia 🔒                                       |
| DELETE | `/types/:id`               | Elimina tipologia 🔒                                        |
| POST   | `/types/reorder`           | Riordina tipologie `{ordered: [id, id, ...]}` 🔒            |
| GET    | `/activities`              | Lista attività (paginata `?offset=&limit=`) 🔒              |
| POST   | `/activities`              | Crea attività 🔒                                            |
| GET    | `/activities/:id`          | Dettaglio attività 🔒                                       |
| PUT    | `/activities/:id`          | Modifica attività 🔒                                        |
| GET    | `/ping`                    | Health check — risponde `{"status":"ok","version":"x.x.x"}` |
| DELETE | `/activities/:id`          | Elimina attività → 204 No Content 🔒                        |
| POST   | `/activities/:id/favorite` | Toggle preferito 🔒                                         |
| PUT    | `/activities/:id/viewed`   | Aggiorna last_viewed_at 🔒                                  |
| GET    | `/activities/:id/reviews`  | Lista recensioni 🔒                                         |
| POST   | `/reviews`                 | Crea/aggiorna recensione (upsert per activity+type) 🔒      |
| POST   | `/activities/:id/photos`   | Carica foto (multipart/form-data) 🔒                        |

---

## Setup da zero (prima volta)

### Prerequisiti

- Node.js ≥ 18
- PHP ≥ 8.3 — macOS: `brew install php`
- Composer 2 — `brew install composer`

### 1. Installa le dipendenze

```bash
npm run restore
```

Esegue automaticamente in sequenza:

- `backend/`: `composer install` + `php artisan config:clear` + `npm install`
- `web/`: `npm install`

### 2. Inizializza il database (solo la prima volta)

```bash
cd backend
touch database/database.sqlite
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Il file `backend/.env` è già incluso nel repo configurato per SQLite locale.  
Il file `web/.env.development` è già incluso (punta a `http://127.0.0.1:8001/api/v1`).

Per bloccare nuove registrazioni in un ambiente di test o staging, imposta nel backend:

```bash
APP_REGISTRATION_ENABLED=false
```

Con questa flag disattiva, `POST /api/v1/auth/register` risponde `403` e non crea utenti.

---

## Deploy in produzione

Il deploy è **automatico solo su `main`** quando cambiano file backend/web o script di deploy.

Per i dettagli completi (setup iniziale server, troubleshooting, gotcha) vedi [`backend/DEPLOY.md`](backend/DEPLOY.md).

**Flusso:**

1. Builda la web app localmente: `cd web && npm run build`
2. Committa `web/dist/` e pusha su `main`
3. GitHub Actions (`deploy.yml`) triggera il cPanel git pull + deploy
4. `scripts/deploy.sh` copia `web/dist/*` in `public/` — nessun Node sul server

```
git push origin main
    → GitHub Actions (`.github/workflows/deploy.yml`)
        → cPanel API: git pull sul server
        → cPanel API: esegui `.cpanel.yml`
            → bash scripts/deploy.sh
                → copia backend/ → public_html/tastespot/
                → php artisan migrate --force
                → php artisan config:cache && route:cache
                → chmod storage/ e bootstrap/cache/
                → copia web/dist/* in public/ (pre-built, no npm)
```

`develop` resta branch di integrazione: fa lint+build check (`web-ci.yml`) ma non esegue deploy.

**Verifica deploy:**

```bash
curl -s https://tastespot.crointhemorning.com/api/v1/ping
# Risposta attesa: {"status":"ok","version":"1.0.5"}
```
