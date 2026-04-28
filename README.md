# TasteSpot

TasteSpot is a web app to discover and review food and drink places (bars, restaurants, gelato shops, pizzerias, and more) with category-based ratings (location, food, service, price).

Production URL: `https://tastespot.crointhemorning.com/`  
Production API: `https://tastespot.crointhemorning.com/api/v1/`

---

## Quick Start (TL;DR)

First-time setup:

```bash
npm run restore
```

This installs backend and web dependencies in one go. On backend, it also runs `php artisan config:clear`.

Start everything from the repository root (recommended):

```bash
npm run start
```

Or start services separately:

```bash
cd backend && npm run start   # Laravel only on http://127.0.0.1:8001
cd web && npm run start       # Vite web app only on http://127.0.0.1:8000
```

---

## Tech Stack

### Web Frontend (`web/`)

- React 19 + Vite + TypeScript
- React Router (SPA routing)
- Zustand (state management)
- MapLibre GL JS (interactive map)
- Geocoding via backend proxy:
    - `GET /api/v1/geo/search`
    - `GET /api/v1/geo/reverse`
- Production build output: `web/dist/` (published at domain web root)

### Backend (`backend/`)

- Laravel 13 (PHP MVC)
- Laravel Sanctum (Bearer token auth)
- SQLite for local development (`backend/database/database.sqlite`)
- MySQL in production (SupportHost cPanel)
- Laravel Storage for uploaded photos (`backend/storage/app/public/photos/`)
- Storage symlink: `public/storage -> storage/app/public` (recreated at each deploy, not committed)
- Configurable registration: `APP_REGISTRATION_ENABLED=false` blocks API signups

---

## Project Structure

```text
TasteSpot/
├── .github/
│   ├── prompts/
│   ├── skills/
│   └── workflows/
│       ├── deploy.yml
│       └── web-ci.yml
├── docs/
│   ├── project-doc.mdc
│   ├── tech-doc.mdc
│   ├── business-doc.mdc
│   └── specific-*.md(c|yml)
├── scripts/
│   └── deploy.sh
├── .cpanel.yml
├── AGENTS.md
├── CLAUDE.md
├── codex.md
├── GEMINI.md
├── README.md
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   └── Models/
│   ├── database/
│   │   ├── migrations/
│   │   └── database.sqlite
│   ├── routes/api.php
│   ├── storage/app/public/photos/
│   ├── vendor/
│   └── DEPLOY.md
└── web/
    ├── src/
    │   └── styles/
    ├── dist/
    ├── .env.development
    ├── .env.production
    └── package.json
```

---

## Local URLs and Services

### Web app

- Local URL: `http://127.0.0.1:8000`
- Production URL: `https://tastespot.crointhemorning.com/`

### Backend API

- Run with `php artisan serve --port=8001` in `backend/`
- Local URL: `http://127.0.0.1:8001`
- API base path: `/api/v1/`
- Error log: `backend/storage/logs/laravel.log`
- Uploaded photos: `backend/storage/app/public/photos/`
- Public photo URL pattern: `http://127.0.0.1:8001/storage/photos/<filename>`

---

## Local Database (SQLite)

The local database is a single file: `backend/database/database.sqlite`.

Open it with VS Code:

1. Install extension "SQLite Viewer" by Florian Klampfer.
2. Open `backend/database/database.sqlite` from the VS Code explorer.
3. Browse tables and rows directly.

Alternative desktop app:

- DB Browser for SQLite: <https://sqlitebrowser.org>

Terminal access:

```bash
cd backend
sqlite3 database/database.sqlite
.tables
SELECT * FROM activities;
DELETE FROM activities WHERE id = 'xxx';
.quit
```

Main tables:

| Table                       | Purpose                                       |
| --------------------------- | --------------------------------------------- |
| `users`                     | Registered users                              |
| `activity_types`            | Activity categories (bar, restaurant, etc.)   |
| `activities`                | Saved places                                  |
| `activity_type_assignments` | Many-to-many mapping between places and types |
| `reviews`                   | Ratings, notes, and cost data                 |
| `activity_photos`           | Photo metadata (file paths)                   |
| `personal_access_tokens`    | Sanctum tokens (authenticated sessions)       |

---

## Backend API Endpoints

Local API base URL: `http://127.0.0.1:8001/api/v1/`  
Production API base URL: `https://tastespot.crointhemorning.com/api/v1/`

Notes:

- Root path `/` is not implemented (API-only service).
- Use `/api/v1/ping` as a health check.
- Authentication uses `Authorization: Bearer <token>`.
- 🔒 means authentication required.

| Method | Path                       | Description                                            |
| ------ | -------------------------- | ------------------------------------------------------ |
| GET    | `/auth/settings`           | Public auth config (`registration_enabled`)            |
| GET    | `/geo/search`              | Geocoding search (Nominatim proxy with cache/fallback) |
| GET    | `/geo/reverse`             | Reverse geocoding (Nominatim proxy with cache)         |
| POST   | `/auth/register`           | Register user and return token                         |
| POST   | `/auth/login`              | Login and return token                                 |
| POST   | `/auth/logout`             | Logout 🔒                                              |
| GET    | `/auth/me`                 | Current user profile 🔒                                |
| POST   | `/auth/change-password`    | Change password (requires current password) 🔒         |
| GET    | `/types`                   | List activity types 🔒                                 |
| POST   | `/types`                   | Create activity type 🔒                                |
| PUT    | `/types/:id`               | Update activity type 🔒                                |
| DELETE | `/types/:id`               | Delete activity type 🔒                                |
| POST   | `/types/reorder`           | Reorder types with `{ordered: [id, id, ...]}` 🔒       |
| GET    | `/activities`              | List activities (`?offset=&limit=` pagination) 🔒      |
| POST   | `/activities`              | Create activity 🔒                                     |
| GET    | `/activities/:id`          | Activity details 🔒                                    |
| PUT    | `/activities/:id`          | Update activity 🔒                                     |
| DELETE | `/activities/:id`          | Delete activity (204 No Content) 🔒                    |
| POST   | `/activities/:id/favorite` | Toggle favorite 🔒                                     |
| PUT    | `/activities/:id/viewed`   | Update `last_viewed_at` 🔒                             |
| GET    | `/activities/:id/reviews`  | List reviews for an activity 🔒                        |
| POST   | `/reviews`                 | Create/update review (upsert by activity+type) 🔒      |
| POST   | `/activities/:id/photos`   | Upload photo (`multipart/form-data`) 🔒                |
| GET    | `/ping`                    | Health check (`{"status":"ok","version":"x.x.x"}`)     |

---

## First-Time Setup

### Prerequisites

- Node.js >= 18
- PHP >= 8.3
- Composer 2

### 1. Install dependencies

```bash
npm run restore
```

This runs:

- `backend/`: `composer install`, `php artisan config:clear`, `npm install`
- `web/`: `npm install`

### 2. Initialize local database (first run only)

```bash
cd backend
touch database/database.sqlite
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Notes:

- `backend/.env` is already included and configured for local SQLite.
- `web/.env.development` is already included and points to `http://127.0.0.1:8001/api/v1`.

To disable new registrations (for test or staging environments), set:

```bash
APP_REGISTRATION_ENABLED=false
```

With this flag disabled, `POST /api/v1/auth/register` returns `403` and does not create users.

---

## Testing

Backend tests:

```bash
cd backend
php artisan test
```

Web checks:

```bash
cd web
npm run lint
npm run build
```

---

## Production Deploy

Deploy is automatic only on `main` when backend/web/deploy files change.

Important rule: if you edit any of `web/src/`, `web/public/`, or `web/index.html`, you must rebuild and commit `web/dist/` before pushing to `main`. Production does not run a Node build; it only deploys prebuilt artifacts from the repository.

Full production setup and troubleshooting are documented in [backend/DEPLOY.md](backend/DEPLOY.md) and [docs/specific-tech-doc.mdc](docs/specific-tech-doc.mdc).

Deploy flow:

1. Rebuild web locally: `npm run build:prod`
2. Commit both source changes and `web/dist/`
3. Push to `main`
4. GitHub Actions (`deploy.yml`) triggers cPanel pull + deploy script

```text
git push origin main
    -> GitHub Actions (.github/workflows/deploy.yml)
        -> cPanel API: git pull
        -> cPanel API: run .cpanel.yml
            -> bash scripts/deploy.sh
                -> copy backend/ to public_html/tastespot/
                -> php artisan migrate --force
                -> php artisan config:cache && route:cache
                -> set storage and bootstrap/cache permissions
                -> copy web/dist/* to public/ (prebuilt, no npm on server)
```

`develop` is the integration branch and runs lint/build checks (`web-ci.yml`) without deploy.

Deploy health check:

```bash
curl -s https://tastespot.crointhemorning.com/api/v1/ping
# Expected: {"status":"ok","version":"1.0.5"}
```
