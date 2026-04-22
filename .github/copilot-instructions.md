# TasteSpot — Copilot Instructions

- To know how this web works read `/docs/app-knlowledge.md`.
- when you search info about DB look into `/docs/db-schema.md`.


## Stack
- **Frontend**: React 19 + Vite + TypeScript
- **Routing**: React Router v6 (SPA, file `web/src/App.tsx`)
- **Backend**: Laravel 11 + Sanctum (MySQL in prod, SQLite in locale) — cartella `backend/`
- **Auth**: Laravel Sanctum — token in `localStorage`
- **State management**: Zustand (one store per domain, `web/src/stores/`)
- **Maps**: MapLibre GL JS + OpenFreeMap tiles (`https://tiles.openfreemap.org/styles/liberty`)
- **Geocoding**: Nominatim API (free, OSM)
- **Foto**: upload multipart → `storage/app/public/photos/`, compressione browser con `browser-image-compression`
- **Icone**: `react-icons/io5` (Ionicons web)
- **Styling**: CSS puro con variabili CSS (no Tailwind, no CSS-in-JS) — `web/src/styles/`
- **Design tokens**: `web/src/theme/index.ts` (colori, spacing, radius — primary `#FF5A35`)
- **Deployment**: `web/dist/` pre-built committato; Auto via GitHub Actions → cPanel API → `scripts/deploy.sh`
- **URL produzione**: `https://tastespot.crointhemorning.com`
- **API produzione**: `https://tastespot.crointhemorning.com/api/v1/`
- **API locale**: `http://localhost:8000/api/v1/`

## Production Environment
| Hosting | SupportHost cPanel — `/home/crointhe/public_html/tastespot/` |
| Health check | `GET /api/v1/ping` → `{"status":"ok"}` |

## Code conventions

### TypeScript
- Strict mode enabled — no `any`, no type assertions unless unavoidable
- Prefer `type` over `interface` for object shapes
- Always type function return values when not obvious
- Use `EXPO_PUBLIC_*` env vars for client-side secrets


### File structure
```
web/src/
  App.tsx           ← routing SPA (React Router)
  pages/            ← una pagina per route
  components/       ← componenti riutilizzabili
  stores/           ← Zustand stores (auth, activities, types, reviews, location)
  lib/              ← api.ts (HTTP client Sanctum), logger.ts
  styles/           ← base.css, layout.css, features.css (variabili CSS)
  theme/            ← index.ts (design tokens TypeScript)
  types/            ← tipi condivisi
backend/
  routes/api.php    ← tutte le route /api/v1/
  app/Http/Controllers/  ← controller Laravel
  app/Models/       ← modelli Eloquent
  database/migrations/   ← migration MySQL
```

### Navigation
- Route pubbliche (`/login`, `/register`): componente `GuestRoute`
- Route protette: componente `ProtectedRoute` — controlla token in `authStore`
- Bottom nav: 4 tab (Mappa `/`, Preferiti `/favorites`, Vicino `/nearby`, Profilo `/profile`)
- Pagine non-tab (activity detail, form, ecc.): no tab bar, back button in-page

### Lists & data loading
- Tutte le liste usano lazy load con paginazione (cursor-based)
- `activitiesStore.fetch(reset)`: `reset=true` per prima pagina, `reset=false` per load-more

### Rating system
- 5 smile: 😞😕😐🙂😝 → valori target: 1, 3, 5.5, 7.5, 10
- 4 categorie: location, food, service, price/quality
- Media ponderata, pesi in `web/src/config/scoring.ts`

### API e auth
- Client HTTP: `web/src/lib/api.ts` — aggiunge `Authorization: Bearer {token}` da `authStore`
- Token Sanctum salvato in `localStorage` chiave `auth_token`
- Tutte le chiamate API passano per `api.get/post/put/delete` — mai `fetch` diretto

### Maps
- Map style: `https://tiles.openfreemap.org/styles/liberty` (gratuito, no API key)
- Geocoding/autocomplete: Nominatim API
- Default location fallback: Genova (lat: 44.4056, lng: 8.9463)
- POI pre-fill: click su feature mappa → query params `name`, `address`, `lat`, `lng`, `phone` → `ActivityFormPage`

## Workflow

### README maintenance
/readme.md is a file for developers that explains them how to install, build, deploy the web, etc. 
After each implementation change, review `README.md` and update it if the change affects.
Keep `README.md` accurate at all times.

