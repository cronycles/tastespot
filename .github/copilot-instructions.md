# TasteSpot — Copilot Instructions

## Current product direction
- **La mobile app (React Native / Expo) è abbandonata.** Il prodotto attivo è la web app React + Vite.
- Prima di qualsiasi lavoro, leggi `docs/documento-requisiti.md` e `docs/web-requirements-remediation-plan.md`.
- Qualsiasi informazione mobile-era in questo file è obsoleta — i doc web hanno sempre la precedenza.

## Project overview
TasteSpot è una web app mobile-first per valutare e scoprire locali (ristoranti, bar, ecc.). Stack web attivo:

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
- **Deployment**: `web/dist/` pre-built committato; GitHub Actions → cPanel git pull
- **URL produzione**: `https://tastespot.crointhemorning.com`
- **API produzione**: `https://tastespot.crointhemorning.com/api/v1/`

## Code conventions

### TypeScript
- Strict mode enabled — no `any`, no type assertions unless unavoidable
- Prefer `type` over `interface` for object shapes
- Always type function return values when not obvious
- Use `EXPO_PUBLIC_*` env vars for client-side secrets

### Style & formatting
- End of line: **LF**
- Indent: 2 spaces
- Prettier: single quotes, no semicolons, trailing commas (es5), print width 100

### Architecture
- No static methods unless the class itself is static or it is strictly necessary
- No comments unless the logic is non-obvious — when adding comments, **English only**
- Lean and Clean Code: no over-engineering, no premature abstractions
- One Zustand store per domain (auth, activities, types, reviews)
- All user-facing strings in italiano (i18n pianificata per Fase 12)

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
- Media ponderata (pesi in `web/src/config/scoring.ts` se esiste, altrimenti media semplice)

### API e auth
- Client HTTP: `web/src/lib/api.ts` — aggiunge `Authorization: Bearer {token}` da `authStore`
- Token Sanctum salvato in `localStorage` chiave `auth_token`
- Tutte le chiamate API passano per `api.get/post/put/delete` — mai `fetch` diretto

### Maps
- MapLibre GL JS (web) — mai react-native-maps o Google Maps
- Map style: `https://tiles.openfreemap.org/styles/liberty` (gratuito, no API key)
- Geocoding/autocomplete: Nominatim API
- Default location fallback: Genova (lat: 44.4056, lng: 8.9463)
- POI pre-fill: click su feature mappa → query params `name`, `address`, `lat`, `lng`, `phone` → `ActivityFormPage`
- MapPage è **fullscreen** — nessun padding/card wrapper, search bar e filtri assoluti sopra la mappa

## Workflow

### README maintenance
After each implementation change, review `README.md` and update it if the change affects: project structure, stack, API endpoints, file paths, or setup instructions. Keep `README.md` accurate at all times.
