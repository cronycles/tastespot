# TasteSpot

App mobile iOS/Android per valutare e scoprire attività di ristorazione (bar, ristoranti, gelaterie, pizzerie, ecc.) con un sistema di valutazione per categoria (location, cibo, servizio, prezzo).

---

## Avvio quotidiano (TL;DR)

**Terminale 1 — Backend:**
```bash
cd backend && php artisan serve --port=8000
```

**Terminale 2 — App:**
```bash
cd tastespot && npx expo start
# i = simulatore iOS  |  a = Android  |  r = reload
```

> Se il simulatore non si apre, la prima volta serve `npx expo run:ios` (vedi Setup).

---

## Stack

## Stack

### Frontend — `tastespot/`
- **React Native** + **Expo SDK 52** + TypeScript
- **Expo Router** — navigazione file-based (cartella `src/app/`)
- **Zustand** — state management globale (stores in `src/stores/`)
- **MapLibre** + OpenFreeMap — mappe vettoriali gratuite, nessuna API key
- **Nominatim** — geocoding/reverse geocoding, gratuito

### Backend — `backend/`
- **Laravel 11** — framework PHP, struttura MVC
- **Laravel Sanctum** — autenticazione via token Bearer (header `Authorization: Bearer <token>`)
- **SQLite** — database locale in `backend/database/database.sqlite`
- **MySQL** — database di produzione su SupportHost (hosting cPanel)
- **Laravel Storage** — foto salvate in `backend/storage/app/public/photos/`, esposte via `/storage/photos/...`

---

## Come accedere alle varie parti

### App mobile — Expo
- Avviato con `npx expo start` nella cartella `tastespot/`
- Si apre nel simulatore iOS (`i`), Android (`a`) o Expo Go sul telefono fisico
- URL base API configurata in `tastespot/.env`: `EXPO_PUBLIC_API_URL=http://localhost:8000`

### Backend — Laravel
- Avviato con `php artisan serve --port=8000` nella cartella `backend/`
- URL locale: **http://localhost:8000**
- Tutti gli endpoint sono sotto `/api/v1/` (vedi tabella endpoint sotto)
- Log errori: `backend/storage/logs/laravel.log`
- Foto caricate: `backend/storage/app/public/photos/`
- URL foto pubbliche: `http://localhost:8000/storage/photos/<nomefile>`

### Database SQLite — come aprirlo graficamente

Il database è un singolo file: `backend/database/database.sqlite`

**Opzione 1 — dentro VS Code (consigliato, zero install extra):**
1. Apri il pannello Extensions (`Cmd+Shift+X`)
2. Cerca **"SQLite Viewer"** di *Florian Klampfer* → Installa
3. Nel file explorer di VS Code, clicca sul file `backend/database/database.sqlite`
4. Si apre direttamente come tabella navigabile — puoi sfogliare, filtrare, vedere tutti i record

**Opzione 2 — app standalone gratuita:**
- Scarica **[DB Browser for SQLite](https://sqlitebrowser.org)** (macOS, Windows, Linux — totalmente gratuito)
- File → Open Database → seleziona `backend/database/database.sqlite`
- Puoi vedere le tabelle, eseguire query SQL, modificare/eliminare righe manualmente

**Opzione 3 — via terminale (veloce per query rapide):**
```bash
cd backend
php artisan tinker
# oppure direttamente:
sqlite3 database/database.sqlite
# poi:
.tables                          # lista tabelle
SELECT * FROM activities;        # vedi tutto
DELETE FROM activities WHERE id = 'xxx';  # elimina manualmente
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

## Setup da zero (prima volta)

### 1. Prerequisiti

- Node.js ≥ 18
- PHP ≥ 8.2 — macOS: `brew install php`
- Composer 2 — `brew install composer`
- Xcode — dall'App Store (solo per iOS)

### 2. Backend Laravel

```bash
cd backend
composer install
touch database/database.sqlite
php artisan key:generate
php artisan migrate
php artisan storage:link       # crea il link pubblico per le foto
```

### 3. App React Native

```bash
cd tastespot
npm install
```

Il file `.env` è già configurato con `EXPO_PUBLIC_API_URL=http://localhost:8000`.

### 4. Prima build iOS (solo la prima volta, ~5 minuti)

```bash
cd tastespot
npx expo run:ios
```

Dopo la prima build, puoi usare solo `npx expo start` + `i`.

---

## Struttura del progetto

```
TasteSpot/
├── backend/                       # Backend Laravel 11
│   ├── app/
│   │   ├── Http/Controllers/Api/  # AuthController, ActivityController, PhotoController, ...
│   │   └── Models/                # User, Activity, ActivityType, Review, ActivityPhoto
│   ├── database/
│   │   ├── migrations/            # Migrazioni SQLite/MySQL
│   │   └── database.sqlite        # ← IL DATABASE (apri con SQLite Viewer in VS Code)
│   ├── routes/api.php             # Tutte le route sotto /api/v1/
│   ├── storage/app/public/photos/ # Foto caricate dall'app
│   ├── .env                       # Config locale (SQLite, debug=true)
│   ├── .env.production            # Config produzione (MySQL cPanel)
│   └── DEPLOY.md                  # Guida deploy su SupportHost via FTP
└── tastespot/                     # App React Native
    ├── src/
    │   ├── app/                   # Route Expo Router (file = schermata)
    │   │   ├── _layout.tsx        # Root layout + auth guard
    │   │   ├── (auth)/            # login.tsx, register.tsx
    │   │   ├── (tabs)/            # Home, Mappa, Vicino a me, Preferiti, Profilo
    │   │   ├── activity/          # [id].tsx, add.tsx, edit/[id].tsx, review/[id].tsx
    │   │   └── private/           # types.tsx (gestione tipologie)
    │   ├── components/            # ActivityCard, FilterPanel, FavoriteButton, ...
    │   ├── stores/                # Zustand: authStore, activitiesStore, typesStore, reviewsStore
    │   ├── lib/                   # api.ts (client HTTP), logger.ts
    │   ├── types/                 # TypeScript types condivisi (index.ts)
    │   └── theme/                 # Colori, spaziature, font (index.ts)
    └── .env                       # EXPO_PUBLIC_API_URL=http://localhost:8000
```

---

## API Backend — tutti gli endpoint

Base URL: `http://localhost:8000/api/v1/`  
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
| DELETE | `/activities/:id` | Elimina attività → 204 🔒 |
| POST | `/activities/:id/favorite` | Toggle preferito 🔒 |
| PUT  | `/activities/:id/viewed` | Aggiorna last_viewed_at 🔒 |
| GET  | `/activities/:id/reviews` | Lista recensioni 🔒 |
| POST | `/reviews` | Crea/aggiorna recensione (upsert per activity+type) 🔒 |
| POST | `/activities/:id/photos` | Carica foto (multipart/form-data) 🔒 |
| DELETE | `/photos/:id` | Elimina foto → 204 🔒 |

**Test rapido da terminale:**
```bash
# Login e salva token
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"tua@email.com","password":"password"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Lista attività
curl -s http://localhost:8000/api/v1/activities \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

---

## Funzionalità implementate

### Fase 1–2 — Auth + Tipologie personalizzate
- Registrazione/login con token Bearer (Laravel Sanctum); auto-login immediato alla registrazione
- Auth guard globale in `_layout.tsx` — redirect automatico su login/app
- CRUD tipologie per utente: crea, rinomina, riordina (drag & drop), elimina
- Tipologie caricate dallo store Zustand (`useTypesStore`) globalmente

### Fase 3 — Mappa interattiva
- Mappa vettoriale full-screen via MapLibre + OpenFreeMap (gratuito, nessuna API key)
- Pin per ogni attività con icona tipologia; tap → dettaglio
- Long-press sulla mappa → "Aggiungi attività"; tap su POI OSM → pre-compila nome/tipo/telefono/indirizzo
- Barra ricerca flottante con autocomplete Nominatim; tap su risultato → sposta mappa
- Chips filtro per tipologia

### Fase 4 — Aggiunta attività + gestione foto
- Form: nome, indirizzo (autocomplete Nominatim), tipologie multi-select, telefono, note, tag
- Upload foto: picker + resize automatico → multipart al backend → salvate in `storage/app/public/photos/`
- Gallery fullscreen con swipe; long-press → elimina

### Fase 5 — Recensioni per tipologia + Detail Screen
- Recensioni per tipologia (UNIQUE su `activity_id + user_id + activity_type_id`)
- `SmileRating`: 5 valori (😞😕😐🙂😛 → 1, 3, 5.5, 7.5, 10)
- Detail Screen completo: punteggio medio, `TypeReviewCard` per tipologia, foto, preferiti, indicazioni

### Fase 6 — Modifica attività
- `activity/edit/[id].tsx`: form pre-compilato; validazioni nome + almeno una tipologia

### Fase 7 — Liste, filtri & ordinamento
- `ActivityCardVertical` e `ActivityCardHorizontal`
- `ActivityListScreen`: barra sort (Distanza/Visti/Recensiti/A→Z), lazy loading
- Tab Preferiti e Tab Vicino a me
- `FilterPanel`: tipologie, range punteggio, categoria voto, solo preferiti
- Search bar con dropdown attività salvate + Nominatim

### Fase 8 — Logging
- `src/lib/logger.ts`: in dev scrive su console, in prod silenzia i log di debug

### Fase 9 — Backend Laravel self-hosted
- Migrazione completa da Supabase → API Laravel self-hosted
- `src/lib/api.ts`: client HTTP Bearer, AsyncStorage, `get/post/put/delete/uploadPhoto`
- Tutti gli store Zustand migrati: authStore, activitiesStore, typesStore, reviewsStore
- Deploy produzione via FTP (Cyberduck) su SupportHost cPanel

---

## Ambiente di sviluppo con Copilot

> "Leggi il README.md e riprendi lo sviluppo"

