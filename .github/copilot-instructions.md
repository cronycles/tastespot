# TasteSpot — Copilot Instructions

## Current migration status
- The active product direction is the migration from the Expo mobile app to the React + Vite web app served on the main domain.
- Before continuing any work on this migration, read `docs/web-migration-status.md` and use it as the canonical source for roadmap, checkpoint, and next phase.
- If `docs/web-migration-status.md` conflicts with older mobile-era notes in this file, the migration document takes precedence.

## Project overview
TasteSpot is a React Native mobile app (iOS + Android) for rating and discovering food & drink venues. Built with Expo, TypeScript, Supabase, and MapLibre.

## Stack
- **Framework**: React Native + Expo + `expo-dev-client` + TypeScript
- **Navigation**: Expo Router (file-based, `src/app/`)
- **Backend**: Supabase (Postgres + Auth + Storage + Realtime)
- **State management**: Zustand (one store per domain)
- **Maps**: `@maplibre/maplibre-react-native` + OpenStreetMap tiles
- **Geocoding**: Nominatim API (free, OSM)
- **i18n**: `i18next` + `react-i18next` (IT default, ES, EN)
- **Icons**: `@expo/vector-icons` (Ionicons)
- **Photos**: `expo-image-picker` + Supabase Storage
- **Error logging**: Sentry (dev: console, prod: Sentry)
- **UI**: Plain `StyleSheet` + `src/theme/index.ts` design tokens (no UI frameworks)

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
- All user-facing strings must go through `i18next` — no hardcoded UI strings

### File structure
```
src/
  app/            ← Expo Router routes
    (auth)/       ← unauthenticated screens
    (tabs)/       ← main 4-tab navigation
    activity/     ← activity detail, add, review
    private/      ← user account area
  components/     ← reusable UI components
  stores/         ← Zustand stores (one file per domain)
  lib/            ← supabase.ts, logger.ts, i18n.ts
  hooks/          ← custom hooks
  types/          ← shared TypeScript types
  theme/          ← design tokens (index.ts)
  locales/        ← it.ts, es.ts, en.ts
```

### Navigation
- `(auth)` group: login, register — visible when not authenticated
- `(tabs)` group: Home (map), Favorites, Nearby, Private area — visible when authenticated
- Auth guard in root `src/app/_layout.tsx` — uses `<Redirect>` in render (NOT `router.replace` in useEffect)
- `private/` routes have **no** `_layout.tsx` — they are direct children of the root Stack
- `ScreenHeader` requires `topInset` prop on non-tab screens to account for safe area insets

### Lists & data loading
- All lists use lazy loading / cursor pagination via Supabase
- Never load all records at once — use `FlatList` with `onEndReached`

### Rating system
- 5 smile levels: 😞😕😐🙂😝 → values: 1, 3, 5.5, 7.5, 10
- 4 categories: location, food, service, price/quality
- Average score calculated from selected categories only

### Supabase
- All tables have RLS — users can only access their own data
- Use `supabase` client from `src/lib/supabase.ts`
- Prefer Supabase Realtime for live updates where applicable
- `activity_types` has a `display_order` column (integer) — fetch ordered by `display_order ASC`

### Maps
- Use `@maplibre/maplibre-react-native` v10 — never `react-native-maps` or Google Maps SDK
- **Prop name is `mapStyle`** (NOT `styleURL` — that prop doesn't exist in v10 and is silently ignored)
- Map style: `https://tiles.openfreemap.org/styles/liberty` (vector tiles, free, no API key)
- iOS ATS: `NSAllowsArbitraryLoads: true` required in both `app.json` (`ios.infoPlist`) and `ios/TasteSpot/Info.plist`
- `UserLocation` must use `renderMode="native"` — the default Animated mode crashes on RN 0.83+
- Camera zoom: set via `defaultSettings` + call `setCamera` inside `onDidFinishLoadingMap` callback
- Geocoding/reverse geocoding/autocomplete: Nominatim API
- Default location fallback: Genova, Italy (lat: 44.4056, lng: 8.9463)
- Stale closure in async location functions: use `useLocationStore.getState()` instead of destructured state
- POI pre-fill: on long-press use `map.queryRenderedFeatures(point)` to extract OSM feature properties (`name`, `amenity`, `addr:street`, `phone`, etc.) and pass them as URL params to `activity/add` for pre-compilation

## Workflow

### README maintenance
After each implementation change, review `README.md` and update it if the change affects: project structure, stack, API endpoints, file paths, or setup instructions. Keep `README.md` accurate at all times.
