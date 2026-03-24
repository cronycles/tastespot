---
applyTo: "**"
---

# TasteSpot — Piano di sviluppo

## Stato attuale

**Ultima fase completata: 13 — Condivisione verso TasteSpot da Google Maps** ✅  
**Prossima fase: 14 — Configurazione pesi punteggio e valori smile**

---

## DB Schema (Laravel / MySQL)

- `users` — gestito da Laravel Sanctum
- `activity_types` (id CHAR36, user_id, name, description, icon_key, display_order, created_at)
- `activities` (id CHAR36, user_id, name, address, lat, lng, phone, notes, tags JSON, is_favorite, created_at, updated_at, last_viewed_at)
- `activity_activity_type` (activity_id, activity_type_id) — pivot M:N
- `reviews` (id CHAR36, activity_id, activity_type_id, user_id, score_location, score_food, score_service, score_price, cost_per_person, liked, disliked, notes, created_at, updated_at) — UNIQUE(activity_id, user_id, activity_type_id)
- `activity_photos` (id CHAR36, activity_id, storage_path, display_order, created_at)

> Ogni recensione è legata a una specifica tipologia. Un'attività con N tipologie assegnate ha fino a N recensioni separate. Il punteggio medio dell'attività è la media di tutte le recensioni per-tipologia.

---

## Infrastruttura

| Voce | Valore |
|---|---|
| URL API produzione | `https://tastespot.crointhemorning.com/api/v1/` |
| URL API locale | `http://localhost:8000/api/v1/` |
| Hosting | SupportHost cPanel — `/home/crointhe/public_html/tastespot/` |
| Backend | Laravel 11 + Sanctum + MySQL |
| Deploy | Auto via GitHub Actions → cPanel API → `scripts/deploy.sh` |
| Health check | `GET /api/v1/ping` → `{"status":"ok"}` |
| PHP in produzione | `/opt/cpanel/ea-php84/root/usr/bin/php` |
| Symlink storage | `rm -f public/storage` prima di `storage:link` (fatto da deploy.sh) |

---

## Fasi completate (sintesi)

- **Fase 0** ✅ — Setup Expo + TypeScript + Expo Router, tab bar, auth guard
- **Fase 1** ✅ — Login/register + authStore Zustand + token Sanctum in expo-secure-store
- **Fase 2** ✅ — DB schema, typesStore, schermata Tipologie (CRUD + ordinamento ▲▼)
- **Fase 3** ✅ — Mappa MapLibre, locationStore, search bar con Nominatim autocomplete
- **Fase 4** ✅ — CRUD attività, form add/edit, foto (upload/delete/resize), pre-fill da POI OSM via long-press
- **Fase 5** ✅ — Recensioni per tipologia, SmileRating, reviewsStore, punteggi calcolati
- **Fase 6** ✅ — Modifica attività da dettaglio (inline fields + `activity/edit/[id].tsx`)
- **Fase 7** ✅ — Liste paginate, filtri (tipologie/punteggio/categorie/preferiti), ordinamento, search avanzata
- **Fase 8** ✅ — Logger centralizzato (`src/lib/logger.ts`), `console.log` rimossi
- **Fase 9** ✅ — Migrazione da Supabase a Laravel (MySQL, Sanctum, storage foto, deploy auto GitHub Actions)
- **Fase 10** ✅ — `DEFAULT_ICON_KEY = 'storefront-outline'` in `src/types/index.ts`; add/edit attività reindirizzano a `/private/types` per creazione tipologie (no più inline)
- **Fase 11** ✅ — Banner di benvenuto post-registrazione: `isNewUser` in `authStore`, banner in `(tabs)/index.tsx`, `dismissWelcome()` al tap su chiudi
- **Fase 12** ✅ — Errori di validazione inline sotto i campi in `add.tsx` e `edit/[id].tsx`; rimossi tutti gli `Alert` di validazione; `saveError` banner per errori backend
- **Fase 13** ✅ — URL scheme `tastespot://` + Android `ACTION_SEND` intent filter; handler in `_layout.tsx` con `expo-linking` che parsifica il testo condiviso da Google Maps, estrae nome/coordinate e naviga a `activity/[id]` se esiste o a `activity/add` pre-compilato

---

## Fasi in arrivo

### Fase 11 — Messaggio di benvenuto post-registrazione

- `authStore.ts`: flag `isNewUser: boolean`, settato `true` in `signUp()`, action `dismissWelcome()` lo resetta
- `(tabs)/index.tsx`: banner/card di benvenuto quando `isNewUser === true`; tap su chiudi chiama `dismissWelcome()`; non riappare ai login successivi

### Fase 12 — Errori di validazione uniformi su tutti i form

- Obiettivo: eliminare tutti gli `Alert` di validazione; errori in rosso sotto il campo interessato
- Pattern di riferimento già esistente: `(auth)/login.tsx`
- Form da uniformare: `activity/add.tsx`, `activity/edit/[id].tsx`
- Campi da validare: nome obbligatorio, almeno una tipologia obbligatoria

### Fase 13 — Condivisione verso TasteSpot da Google Maps

- Registrare URL scheme `tastespot://` in `app.json` → `scheme`
- Intent filter Android per rispondere al Share di Google Maps
- iOS: `CFBundleURLTypes` gestito da Expo via `app.json`
- Handler in `_layout.tsx` con `expo-linking`: estrae nome/coordinate → naviga a `activity/[id]` se esiste già, altrimenti a `activity/add` pre-compilato

### Fase 14 — Configurazione pesi punteggio e valori smile

- Creare `src/config/scoring.ts`:
  ```ts
  export const SMILE_VALUES = [1, 3, 6, 7.5, 10]  // smile centrale = 6 (non 5.5)
  export const CATEGORY_WEIGHTS = { location: 1, food: 3, service: 2, price: 2 }
  ```
- `calcActivityAvgScore` aggiornata per usare i pesi da questo file
- Rimpiazza costanti hardcoded in `reviewsStore.ts` e `SmileRating.tsx`

### Fase 15 — Sentry & EAS Build

- `@sentry/react-native` installato + DSN configurato; `logger.error()` integra `Sentry.captureException()` in produzione (il TODO in `logger.ts` è già pronto)
- `eas.json` con profili `development`, `preview`, `production`; prima build APK + IPA con EAS

---

## Idee future (non pianificate)

- **i18n**: `i18next` + `react-i18next`; IT (default), ES, EN
- **Prezzo medio a persona**: aggregato su tutte le recensioni, mostrato nel dettaglio attività
