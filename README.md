# TasteSpot

A personal web app to discover, save, and review food & drink places — bars, restaurants, gelaterias, pizzerias, and more — with category-based ratings (location, food, service, price).

**Production:** [https://tastespot.crointhemorning.com](https://tastespot.crointhemorning.com)

---

## Documentation

| Document                                                                   | What's inside                         |
| -------------------------------------------------------------------------- | ------------------------------------- |
| [docs/project-doc.mdc](docs/project-doc.mdc)                               | Entry point — links to all other docs |
| [docs/business-doc.mdc](docs/business-doc.mdc)                             | UI/UX flows, user stories             |
| [docs/tech-doc.mdc](docs/tech-doc.mdc)                                     | Tech standards and dev rules          |
| [docs/specific-tech-doc.mdc](docs/specific-tech-doc.mdc)                   | Stack details, conventions, patterns  |
| [docs/specific-tech-frontend-doc.mdc](docs/specific-tech-frontend-doc.mdc) | Frontend-specific rules               |
| [docs/specific-tech-backend-doc.mdc](docs/specific-tech-backend-doc.mdc)   | Backend-specific rules                |
| [docs/specific-api-model.yml](docs/specific-api-model.yml)                 | Full API reference (OpenAPI)          |
| [docs/specific-data-model.md](docs/specific-data-model.md)                 | Database schema and relationships     |
| [backend/DEPLOY.md](backend/DEPLOY.md)                                     | Full deploy setup and server config   |

---

## Tech Stack

| Layer                | Stack                                                 |
| -------------------- | ----------------------------------------------------- |
| Frontend (`web/`)    | React 19 + Vite + TypeScript, Zustand, MapLibre GL JS |
| Backend (`backend/`) | Laravel 13, Laravel Sanctum (Bearer token auth)       |
| DB (local)           | SQLite (`backend/database/database.sqlite`)           |
| DB (production)      | MySQL on SupportHost cPanel                           |

---

## First-Time Setup

**Prerequisites:** Node.js >= 18, PHP >= 8.3, Composer 2

### 1. Install dependencies

```bash
npm run restore
```

Installs all backend and web dependencies in one go (`composer install` + `npm install` for both).

### 2. Initialize local database (once)

```bash
cd backend
touch database/database.sqlite
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Both `backend/.env` (SQLite) and `web/.env.development` (points to local API) are already committed — no manual configuration needed.

### 3. Start

```bash
npm run start
```

| Service     | Local URL             |
| ----------- | --------------------- |
| Web app     | http://127.0.0.1:8000 |
| Backend API | http://127.0.0.1:8001 |

Or start them separately:

```bash
cd backend && npm run start
cd web && npm run start
```

---

## Dev Workflow

**Run tests:**

```bash
cd backend && php artisan test
cd web && npm run lint && npm run build
```

**Health check (local):**

```bash
curl http://127.0.0.1:8001/api/v1/ping
```

---

## Deploy

Deploy is **automatic** on every push to `main` that touches `backend/`, `web/`, `scripts/deploy.sh`, `.cpanel.yml`, or `.github/workflows/deploy.yml`.

**Important:** the server does not run a Node build. If you change anything in `web/src/`, `web/public/`, or `web/index.html`, you must rebuild and commit `web/dist/` before pushing.

```bash
# 1. Build the web app
npm run build:prod

# 2. Commit source + dist
git add web/dist
git commit -m "..."

# 3. Push to main — GitHub Actions handles the rest
git push origin main
```

Deploy flow:

```text
git push origin main
    -> GitHub Actions (deploy.yml)
        -> cPanel API: git pull
        -> cPanel API: run .cpanel.yml
            -> bash scripts/deploy.sh
                -> copy backend/ to public_html/tastespot/
                -> php artisan migrate --force + config:cache + route:cache
                -> copy web/dist/* to public/
```

`develop` is the integration branch — it runs lint/build checks only, never deploys.

**Post-deploy health check:**

```bash
curl -s https://tastespot.crointhemorning.com/api/v1/ping
# Expected: {"status":"ok","version":"x.x.x"}
```

For full server setup and troubleshooting see [backend/DEPLOY.md](backend/DEPLOY.md).
