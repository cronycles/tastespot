# TasteSpot

App mobile iOS/Android per valutare e scoprire attività di ristorazione (bar, ristoranti, gelaterie, pizzerie, ecc.) con un sistema di valutazione per categoria (location, cibo, servizio, prezzo).

**API produzione:** `https://tastespot.crointhemorning.com/api/v1/`

> Aprire l'URL base nel browser restituisce `{"message":"The route / could not be found."}` — è corretto, è un'API pura senza homepage. L'endpoint di health check è `/api/v1/ping`.

---

## Avvio quotidiano (TL;DR)

**Terminale 1 — Backend locale:**
```bash
cd backend && php artisan serve --port=8000
```

**Terminale 2 — App:**
```bash
cd tastespot && npx expo start
# i = simulatore iOS  |  a = Android  |  r = reload
```

> La prima volta sul simulatore iOS serve `npx expo run:ios` (vedi Setup da zero).

---

## Stack

### Frontend — `tastespot/`
- **React Native** + **Expo SDK 52** + TypeScript
- **Expo Router** — navigazione file-based (`src/app/`)
- **Zustand** — state management globale (`src/stores/`)
- **MapLibre** + OpenFreeMap — mappe vettoriali gratuite, nessuna API key
- **Nominatim** — geocoding/reverse geocoding, gratuito

### Backend — `backend/`
- **Laravel 11** — framework PHP, struttura MVC
- **Laravel Sanctum** — autenticazione via token Bearer (`Authorization: Bearer <token>`)
- **SQLite** — database locale (`backend/database/database.sqlite`)
- **MySQL** — database di produzione su SupportHost cPanel
- **Laravel Storage** — foto in `backend/storage/app/public/photos/`, esposte via `/storage/photos/...`
- **Symlink storage** — `public/storage → storage/app/public`, ricreato automaticamente ad ogni deploy (non committato in git)

---

## Struttura del progetto

```
TasteSpot/                         ← radice del monorepo Git
├── .github/
│   ├── copilot-instructions.md    ← Istruzioni Copilot per tutto il progetto
│   └── workflows/
│       └── deploy.yml             ← GitHub Actions: auto-deploy su push a main
├── docs/                          ← Documentazione di progetto (non specifica di frontend/backend)
│   ├── TasteSpot - Documento dei requisiti.md
│   ├── TasteSpot_Plan.md
│   ├── TasteSpot_FasiSeguenti.md
│   └── supabase-legacy/           ← Migrazioni Supabase (progetto precedente, solo archivio)
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
└── tastespot/                     ← App React Native + Expo
    ├── src/
    │   ├── app/                   ← Route Expo Router (file = schermata)
    │   │   ├── _layout.tsx        ← Root layout + auth guard
    │   │   ├── (auth)/            ← login.tsx, register.tsx
    │   │   ├── (tabs)/            ← Home, Mappa, Vicino a me, Preferiti, Profilo
    │   │   ├── activity/          ← [id].tsx, add.tsx, edit/[id].tsx, review/[id].tsx
    │   │   └── private/           ← types.tsx (gestione tipologie)
    │   ├── components/            ← ActivityCard, FilterPanel, FavoriteButton, ...
    │   ├── stores/                ← Zustand: authStore, activitiesStore, typesStore, reviewsStore
    │   ├── lib/                   ← api.ts (client HTTP), logger.ts
    │   ├── types/                 ← TypeScript types condivisi (index.ts)
    │   └── theme/                 ← Colori, spaziature, font (index.ts)
    ├── .env                       ← EXPO_PUBLIC_API_URL (locale o produzione) — NON in git
    └── .env.example               ← Template .env con valori di esempio
```

---

## Come accedere alle varie parti

### App mobile — Expo
- Avviata con `npx expo start` nella cartella `tastespot/`
- Simulatore iOS (`i`), Android (`a`), oppure Expo Go sul telefono fisico
- URL base API configurata in `tastespot/.env`:
  - **Locale:** `EXPO_PUBLIC_API_URL=http://localhost:8000`
  - **Produzione:** `EXPO_PUBLIC_API_URL=https://tastespot.crointhemorning.com`

### Backend — Laravel
- Avviato con `php artisan serve --port=8000` nella cartella `backend/`
- URL locale: **http://localhost:8000**
- Tutti gli endpoint sono sotto `/api/v1/`
- Log errori: `backend/storage/logs/laravel.log`
- Foto caricate: `backend/storage/app/public/photos/`
- URL foto pubbliche: `http://localhost:8000/storage/photos/<nomefile>`

### Database SQLite — come aprirlo graficamente

Il database locale è un singolo file: `backend/database/database.sqlite`

**Opzione 1 — dentro VS Code (consigliato, zero install extra):**
1. `Cmd+Shift+X` → cerca **"SQLite Viewer"** di *Florian Klampfer* → Installa
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

| Tabella | Contenuto |
|---------|-----------|
| `users` | Utenti registrati |
| `activity_types` | Tipologie (bar, ristorante, ecc.) |
| `activities` | Attività salvate |
| `activity_activity_type` | Relazione molti-a-molti attività ↔ tipologie |
| `reviews` | Recensioni (score, note, costi) |
| `activity_photos` | Metadati foto (path su disco) |
| `personal_access_tokens` | Token Sanctum (sessioni login) |

---

## API Backend — tutti gli endpoint

Base URL locale: `http://localhost:8000/api/v1/`
Base URL produzione: `https://tastespot.crointhemorning.com/api/v1/`

> L'URL radice (`/`) non esiste — è un'API pura. Usa `/api/v1/ping` per verificare che il server sia su.
Autenticazione: header `Authorization: Bearer <token>` (🔒 = richiesto)

| Metodo | Path | Descrizione |
|--------|------|-------------|
| POST | `/auth/register` | Registrazione → restituisce token |
| POST | `/auth/login` | Login → restituisce token |
| POST | `/auth/logout` | Logout 🔒 |
| GET  | `/auth/me` | Dati utente corrente 🔒 |
| GET  | `/types` | Lista tipologie 🔒 |
| POST | `/types` | Crea tipologia 🔒 |
| PUT  | `/types/:id` | Modifica tipologia 🔒 |
| DELETE | `/types/:id` | Elimina tipologia 🔒 |
| POST | `/types/reorder` | Riordina tipologie `{ordered: [id, id, ...]}` 🔒 |
| GET  | `/activities` | Lista attività (paginata `?offset=&limit=`) 🔒 |
| POST | `/activities` | Crea attività 🔒 |
| GET  | `/activities/:id` | Dettaglio attività 🔒 |
| PUT  | `/activities/:id` | Modifica attività 🔒 |
| GET  | `/ping` | Health check — risponde `{"status":"ok","version":"x.x.x"}` |
| DELETE | `/activities/:id` | Elimina attività → 204 No Content 🔒 |
| POST | `/activities/:id/favorite` | Toggle preferito 🔒 |
| PUT  | `/activities/:id/viewed` | Aggiorna last_viewed_at 🔒 |
| GET  | `/activities/:id/reviews` | Lista recensioni 🔒 |
| POST | `/reviews` | Crea/aggiorna recensione (upsert per activity+type) 🔒 |
| POST | `/activities/:id/photos` | Carica foto (multipart/form-data) 🔒 |

---

## Setup da zero (prima volta)

### Prerequisiti

- Node.js ≥ 18
- PHP ≥ 8.3 — macOS: `brew install php`
- Composer 2 — `brew install composer`
- Xcode — dall'App Store (solo per simulatore iOS)

### 1. Backend Laravel

```bash
cd backend

# Installa dipendenze PHP (la prima volta — vendor/ è anche in git per il deploy)
composer install

# Crea il database SQLite locale
touch database/database.sqlite

# Genera la chiave dell'app
php artisan key:generate

# Crea le tabelle
php artisan migrate

# Crea il symlink per le foto pubbliche
php artisan storage:link
```

Il file `backend/.env` è già incluso nel repo configurato per SQLite locale.

### 2. App React Native

```bash
cd tastespot
npm install
```

Il file `tastespot/.env` è già configurato con `EXPO_PUBLIC_API_URL=http://localhost:8000`.

### 3. Prima build iOS (solo la prima volta — ~5 minuti)

```bash
cd tastespot
npx expo run:ios
```

Dopo la prima build, puoi usare solo `npx expo start` + `i`.

---

## Deploy in produzione

Il deploy è **automatico** su ogni push a `main` che tocca file in `backend/`.

Per i dettagli completi (setup iniziale server, troubleshooting, gotcha) vedi [`backend/DEPLOY.md`](backend/DEPLOY.md).

**Flusso:**
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
```

**Verifica deploy:**
```bash
curl -s https://tastespot.crointhemorning.com/api/v1/ping
# Risposta attesa: {"status":"ok","version":"1.0.5"}
```
