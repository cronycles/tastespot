# TasteSpot — Piano di sviluppo

## Stato attuale
**Fase completata: 9 — Migrazione backend self-hosted (Laravel)** ✅
**Prossima fase: 10 — UX & Polish**

Per riprendere in una nuova sessione: apri VS Code, apri una chat in modalità Agent e scrivi:
> "Leggi il file docs/TasteSpot_Plan.md e riprendi lo sviluppo dalla prossima fase"

---

## Stack tecnico
- React Native + Expo + `expo-dev-client` + TypeScript
- Expo Router (navigazione file-based, `src/app/`)
- Supabase (Postgres + Auth + Storage)
- Zustand (state management, uno store per dominio)
- `@maplibre/maplibre-react-native` + OSM tiles (100% gratuito, zero API key)
- Nominatim API (geocoding/search/autocomplete, OSM, completamente gratuito)
- i18next + react-i18next (IT/ES/EN)
- `@expo/vector-icons` — Ionicons (gratuito open source, incluso in Expo)
- `expo-image-picker` + Supabase Storage (foto)
- Sentry free tier (error logging)
- Plain `StyleSheet` + `src/theme/index.ts` design tokens (nessun UI framework)

## Decisioni
- Expo + expo-dev-client: necessario per MapLibre (native module), compatibile con EAS Build
- MapLibre + OSM: zero API key, zero costi, 100% open source
- Supabase: open source, piano free generoso, Postgres
- Nessun framework UI (NativeWind ecc.): StyleSheet + tema per lean/clean code
- Scoring smiles: 😞😕😐🙂😝 → 1, 3, 5.5, 7.5, 10
- Nominatim per autocomplete indirizzi e reverse geocoding (gratuito, OSM)
- EoL: LF, commenti in inglese solo se non auto-esplicativo
- No metodi statici salvo necessità
- i18n: italiano (default), spagnolo, inglese
- `.github/copilot-instructions.md` con tutte le convenzioni del progetto

## DB Schema (Supabase)
- users → gestito da Supabase Auth
- activity_types (id, user_id, name, description, icon_key, display_order, created_at)
- activities (id, user_id, name, address, lat, lng, phone, notes, tags text[], created_at, updated_at, last_viewed_at)
- activity_type_assignments (activity_id, activity_type_id) — PK composta
- reviews (id, activity_id, **activity_type_id** (FK activity_types), user_id, score_location, score_food, score_service, score_price, cost_per_person, liked, disliked, notes, created_at, updated_at) — UNIQUE(activity_id, user_id, activity_type_id)
- favorites (user_id, activity_id) — PK composta
- activity_photos (id, activity_id, storage_path, display_order, created_at)

> Ogni recensione è legata a una specifica tipologia: una stessa attività può avere N recensioni, una per tipologia assegnata. Il punteggio medio sull'attività (preview card) è la media di tutte le recensioni per-tipologia.

## Struttura cartelle
```
tastespot/
  .github/copilot-instructions.md
  src/
    app/             (Expo Router — root: ./src)
      _layout.tsx    (root layout + auth guard)
      (auth)/        login.tsx, register.tsx
      (tabs)/        _layout.tsx (bottom tab bar), index.tsx, favorites.tsx, nearby.tsx, profile.tsx
      activity/      [id].tsx, add.tsx, review/[id].tsx
      private/       index.tsx, security.tsx, types.tsx
    components/
    stores/          authStore.ts (+ in fasi successive: activitiesStore, typesStore, reviewsStore)
    lib/             supabase.ts, i18n.ts, logger.ts
    hooks/
    types/
    theme/           index.ts (design tokens)
    locales/         it.ts, es.ts, en.ts
```

## Fasi

### Fase 0 — Scheletro & Setup ✅
- Expo + TypeScript + expo-dev-client (`npx create-expo-app@latest`)
- `.editorconfig`: LF, utf-8, 2 spazi
- ESLint (flat config) + Prettier + TypeScript strict
- `.github/copilot-instructions.md`: convenzioni progetto
- `src/theme/index.ts`: design tokens (colori, spaziatura, tipografia, border-radius)
- Expo Router configurato con `root: "./src"` in app.json
- Bottom tab bar fissa: Home (mappa), Preferiti, Vicino a me, Area Privata
- Schermate placeholder per tutte le route
- Auth guard in `src/app/_layout.tsx`: no sessione → redirect login
- `src/lib/supabase.ts` + `.env.example` + `.gitignore` aggiornato
- `src/stores/authStore.ts` (Zustand)

### Fase 1 — Autenticazione ✅
- Pagina Login: email + password, Supabase signIn
- Pagina Registro: email + password, Supabase signUp + auto-login
- Auth store (Zustand): sessione utente, loading, signIn, signUp, signOut, parseAuthError
- Componenti riutilizzabili: `FormInput`, `Button`
- Gestione errori autenticazione con messaggi utente in italiano

### Fase 2 — DB Schema & Tipologie ✅
- Migration SQL `supabase/migration_001_initial_schema.sql` con tutte le tabelle + RLS policies
- `src/types/index.ts`: tutti i tipi TypeScript condivisi (ActivityType, Activity, Review, etc.)
- `src/stores/typesStore.ts`: Zustand store con fetch, create, update, remove
- Tab profile aggiornata: email utente, link a Tipologie e Sicurezza, bottone logout
- Componente riutilizzabile `ScreenHeader` con supporto back e slot right
- Schermata Sicurezza: cambio password con Supabase updateUser
- Schermata Tipologie: lista, creazione, modifica, eliminazione con warning Alert e picker icone

**Bug fix e migliorie trovate in testing:**
- `styleURL` non esiste in MapLibre React Native v10 — il prop corretto è `mapStyle` (accetta stringa URL o oggetto stile direttamente)
- Tile raster su display @3x: le label sono troppo piccole; usare tile vettoriali (`https://tiles.openfreemap.org/styles/liberty`) con `mapStyle` stringa URL
- ATS (App Transport Security) iOS blocca le richieste tile: aggiungere `NSAllowsArbitraryLoads: true` in `app.json` → `ios.infoPlist` e modificare `ios/TasteSpot/Info.plist` direttamente per il build corrente
- Camera: usare `defaultSettings` + `setCamera` in `onDidFinishLoadingMap` per garantire zoom e centro corretti
- Il simulatore iOS non ha GPS — `Features → Location → Custom Location` per simulare coordinate reali
- Filtri home: derivati dalle tipologie utente (`useTypesStore`) + first 5 ordered by `display_order`

**Migration aggiuntiva:**
- `supabase/migration_002_activity_types_order.sql`: aggiunge `display_order integer` ad `activity_types` con back-fill per righe esistenti

**Nuova funzionalità in Fase 2 (tipologie):**
- Riordinamento tipologie con bottoni ▲▼: swap di `display_order` con update ottimistico in Supabase

### Fase 3 — Mappa & Geolocalizzazione ✅
- `@maplibre/maplibre-react-native` v10 installato + plugin Expo in `app.json`
- `expo-location` (già installato dalla fase 0)
- OSM style: `https://tiles.openfreemap.org/styles/liberty` (gratuito, no API key)
- `src/stores/locationStore.ts`: Zustand store con rilevamento posizione, fallback Genova (44.4056, 8.9463)
- `src/hooks/useNominatim.ts`: autocomplete indirizzi con debounce 400ms, header User-Agent obbligatorio
- Home screen (`src/app/(tabs)/index.tsx`): mappa fullscreen, posizione utente, camera centrata su coords
- Search bar floating (top, safe area) con autocomplete Nominatim, clear, spinner
- Filtri orizzontali scrollabili sotto la search bar (Tutti, Bar, Ristorante…)
- FAB `+` bottom-right → `/activity/add`
- FAB "Vicino a me" centro-basso → `/(tabs)/nearby`
- FAB "locate" per recentrare mappa sulla posizione utente
- Long-press su mappa: Alert con coordinate → `/activity/add?lat=&lng=`

**Note build:**
- ⚠️ Dopo `npm install @maplibre/maplibre-react-native` è OBBLIGATORIO `npx expo prebuild --clean --platform ios` (non solo `run:ios`) perché il plugin deve modificare il Podfile aggiungendo `$MLRN.post_install(installer)` nel blocco `post_install`
- Senza il `prebuild --clean` il build fallisce con `Module 'MapLibre' not found`

### Fase 4 — CRUD Attività ✅

**4a — Store + Form Aggiungi**
- `src/stores/activitiesStore.ts`: Zustand store con fetch (lazy/paginato), create, update, remove, toggleFavorite, updateLastViewed, addPhoto, removePhoto
- Pagina `activity/add.tsx`: form completo — nome, indirizzo (Nominatim autocomplete), tipologie (multi-select da typesStore), note, tags, telefono, toggle preferiti
- Il form accetta params URL pre-compilati: `lat`, `lng`, `name`, `address`, `osmAmenity`, `phone`
- Pre-compilazione indirizzo da coordinate: `reverseGeocode` (nuova funzione esportata da `useNominatim.ts`)
- Pre-selezione tipologia: mappa `osmAmenity` → nome tipologia TasteSpot via `OSM_TYPE_KEYWORDS`

**4b — Pre-compilazione da POI OpenStreetMap (vector feature query)**
- `handleLongPress` nella home: chiama `mapViewRef.current.queryRenderedFeaturesAtPoint([screenX, screenY])` con le coordinate schermo dall'evento
- Filtra le feature per quelle con `name` + (`amenity` | `shop` | `tourism` | `leisure`)
- Estrae nome, amenity, telefono, indirizzo (da `addr:housenumber`, `addr:street`, `addr:city`)
- L'Alert di conferma mostra il nome del POI se trovato: `Aggiungere "Trattoria da Mario"?`

**4c — Marker attività sulla mappa**
- `PointAnnotation` con icona cerchio rosso/bianco per ogni attività con coordinate
- Filtro attivo: la mappa mostra solo i marker delle attività con la tipologia selezionata
- `onSelected` su PointAnnotation → naviga a `activity/[id]`
- ⚠️ TODO: se l'attività ha più tipologie assegnate → icona `apps-outline` (multi tipologia); se una sola → icona della tipologia

**4d — Dettaglio & Foto**
- Pagina `activity/[id].tsx`: header con nome + cuore preferito, gallery foto a griglia 3 colonne, info, pulsanti azione (Indicazioni, Chiama, Recensione), elimina
- Upload foto: `expo-image-picker` → `fetch(uri)` → `supabase.storage.from('activity-photos').upload()` → insert in `activity_photos`
- Elimina foto: long-press su thumbnail → `storage.remove()` + delete DB record
- Pulsante Elimina attività con Alert di conferma

**Note build:**
- ⚠️ `expo-image-picker` aggiunto: richiede `npx expo prebuild --clean --platform ios` + rebuild
- `migration_003_storage_policies.sql`: RLS policies per bucket `activity-photos`
  (bucket da creare manualmente in Supabase Dashboard → Storage → New bucket, nome `activity-photos`, **PUBBLICO** — richiesto per `getPublicUrl`)
- Bucket path: `{user_id}/{activity_id}/{timestamp}.{ext}`
- Upload foto: `base64: true` in ImagePickerOptions + `Uint8Array.from(atob(base64))` — NON usare `fetch(file://)` su iOS (restituisce blob vuoto)

**⚠️ Revisioni Fase 4 completate:**
- ✅ `activity/add.tsx`: tipologia obbligatoria — alert se nessuna selezionata (con tipi disponibili)
- ✅ `(tabs)/index.tsx`: icona `apps-outline` su marker quando l'attività ha più tipologie
- ✅ `(tabs)/index.tsx`: bug MapLibre — `PointAnnotation.onSelected` smetteva di funzionare dopo navigazione; fix con `useFocusEffect` + `markerEpoch` nel `key`/`id` per forzare re-mount nativo al ritorno sulla Home
- ✅ `activity/[id].tsx`: foto in strip ~45% schermo con FlatList horizontal + gallery modal + icone orizzontali (Preferiti, Note, Tags, Indicazioni) + modal edit Note e Tags + placeholder Fase 5
- ✅ `expo-image` installato: caching su disco per le foto (caricamento istantaneo dopo la prima volta)
- ✅ `expo-image-manipulator` installato: resize a 1200px + JPEG 0.7 prima dell'upload (riduce ~3MB → ~150KB); `expo-image-picker` non usa più `base64: true` — la conversione avviene dopo il resize
- ✅ Tag: separatore multiplo — spazi, virgole e combinazioni (`romantico, economico` → 2 tag); niente spazi all'interno di un singolo tag; fix applicato sia in `add.tsx` che nel modal tag di `[id].tsx`
- ⚠️ Richiede `npx expo prebuild --clean --platform ios` + rebuild (moduli nativi: expo-image, expo-image-manipulator)

### Fase 5 — Recensioni per tipologia + Detail Screen completo

> **Design fondamentale**: ogni recensione è legata a una combinazione `activity_id + activity_type_id`. Un'attività con N tipologie ha fino a N recensioni separate. I filtri per punteggio operano per-tipologia.

**5a — Componenti e store**
- Componente `SmileRating`: 5 smile → 😞😕😐🙂😝 → valori 1, 3, 5.5, 7.5, 10
- `src/stores/reviewsStore.ts`: fetch (per activity_id, ritorna array di ReviewWithType), create, update; `ReviewWithType` include `activity_type_id`, `type_name`, `type_icon_key`, scores + avg complessivo
- DB migration: aggiunge `activity_type_id` (FK activity_types) alla tabella `reviews` + constraint UNIQUE(activity_id, user_id, activity_type_id)

**5b — Pagina Recensione Attività**
- `activity/review/[id].tsx`: riceve param `typeId` (activity_type_id) e `typeName` (per il titolo della pagina)
- Mostra 4 SmileRating (location, cibo, servizio, conto) + campi extra non obbligatori (costo/persona, piaciuto, non piaciuto, note)
- Se review già esistente per quella activity+type: pre-compila tutto + mostra data creazione + data modifica
- Salvataggio: upsert su Supabase con UNIQUE constraint (activity_id, user_id, activity_type_id)

**5c — Detail screen: punteggio medio + sezione recensioni inline**
- Score in cima (sotto foto): media di tutti i voti per-tipologia; icona smile corrispondente al valore; tap → dropdown con media per categoria (aggregata su tutte le tipologie)
- Se nessuna recensione: smile grigio + testo "Non valutato"
- Sezione recensioni in fondo: **una card per ogni tipologia assegnata all'attività** (`TypeReviewCard`):
  - Header card: icona + nome tipologia + separatore; a destra smile + valore numerico (es. "😙 7.4")
  - Se non recensito: bottone "Aggiungi recensione" → `activity/review/[id]?typeId=&typeName=`
  - Se recensito:
    - Riga chip punteggi per categoria: smile + valore numerico (es. 😙 7.5) con etichetta sopra (Location, Cibo, Servizio, Conto); solo le categorie valorizzate
    - Costo a persona (se presente): riga inline con icona wallet e testo "€X a persona"
    - Piaciuto / Non piaciuto / Note: testo troncato a 2 righe; se > 60 caratteri appare link "Mostra tutto ↓" / "Mostra meno ↑" per espandere inline senza nuova schermata
    - Footer: data creazione (+ data modifica se diversa) a sinistra; bottone "Modifica" a destra

**5d — Detail screen: foto + layout completo**
- Sezione foto: occupa ~metà schermo in alto; FlatList horizontal con swipe tra foto
- Bottone upload foto + tap su foto → gallery mode
- Gallery mode: modal fullscreen sfondo nero, swipe tra foto; `expo-screen-orientation` per landscape
- Layout icone orizzontali: Preferiti → Note → Tags → Indicazioni (disabilitato se no indirizzo) → Chiama (disabilitato se no telefono)
- Pulsante Elimina attività in fondo

### Fase 6 — Modifica Attività

> Tutti i campi modificabili direttamente dal Dettaglio Attività, come da requisiti: nome, indirizzo, tipologie, telefono. Note e Tags sono già modificabili (Fase 4). **Foto già gestite (Fase 4)**: aggiunta tramite picker + resize + upload Supabase, eliminazione con long-press sulla foto → `removePhoto()`. Nessun lavoro aggiuntivo richiesto per le foto.

**6a — Modifica inline: Nome e Telefono**
- Tap su nome attività → modal con TextInput pre-compilato + bottone Salva → `activitiesStore.update()`; validazione: non vuoto
- Tap su telefono (o sul numero mostrato) → modal con TextInput pre-compilato; campo facoltativo
- Aggiornamento ottimistico nello store; rollback su errore Supabase

**6b — Modifica Indirizzo**
- Tap sull'indirizzo → stesso modal usato nell'aggiunta attività: TextInput con suggerimenti Nominatim
- Salva l'indirizzo testuale e le coordinate aggiornate (lat/lon) → `activitiesStore.update()`
- Se si svuota il campo: indirizzo diventa null (bottone Indicazioni si disabilita)

**6c — Modifica Tipologie**
- Tap sull'area tipologie assegnate → modal con lista di tutte le tipologie disponibili (multi-select chip)
- Pre-selezionate quelle già assegnate; almeno una obbligatoria (alert se si tenta di salvare senza)
- Salvataggio: `DELETE activity_types_assigned WHERE activity_id + INSERT` nuovi → `activitiesStore.update()`
- Dopo salvataggio: aggiorna marker sulla mappa (icona singola / `apps-outline` se multiple)

### Fase 7 — Liste, Filtri & Ordinamento

> Fase suddivisa in 5 sotto-fasi sequenziali, ognuna testabile indipendentemente.

**7a — Componenti card e FavoriteButton** ✅
- `src/components/FavoriteButton.tsx`: toggle cuore vuoto/rosso pieno, chiama `toggleFavorite(id)` dallo store; prop `size` opzionale
- `src/components/ActivityCardVertical.tsx`: larghezza piena; parte sx (nome + smile+numero + indirizzo); parte dx foto (o placeholder grigio); riga inferiore con `FavoriteButton`; tap → dettaglio
- `src/components/ActivityCardHorizontal.tsx`: card 180×220px; metà superiore foto con `FavoriteButton` overlay in alto a destra; metà inferiore nome + smile+numero; tap → dettaglio
- Punteggio calcolato da `calcActivityAvgScore` + `scoreToSmileIndex` sullo store reviews; se nessuna recensione: testo "Non valutato"

**7b — Pagina lista generica + logica sort** ✅
- `src/components/ActivityListScreen.tsx`: componente riutilizzabile (non una tab), accetta `activities?`, `title`, `defaultSortKey`, `defaultSortDir`, `headerExtra`, `topInset`
- FlatList con lazy loading: `onEndReached` chiama `fetch()`, spinner in fondo
- Barra sort: 4 pill (Distanza / Visti / Recensiti / A→Z); tap su pill attiva → toggle asc/desc con chevron; pill "Distanza" disabilitata se posizione non concessa
- Ordinamento client-side con `useMemo`; distanza calcolata con Haversine; fallback naturale (se campo vuoto → in fondo)
- Stato vuoto: icona + testo "Nessuna attività"

**7c — Tab Preferiti e Vicino a me** ✅
- `(tabs)/favorites.tsx`: filtra `is_favorite = true` dallo store, passa a `ActivityListScreen` con sort default alfabetico
- `(tabs)/nearby.tsx`: chiama `requestAndFetch()` al mount per aggiornare la posizione, passa tutte le attività a `ActivityListScreen` con sort default distanza crescente
- Entrambe usano `topInset` per il safe area della status bar

**7d — Panel filtri** ✅
- `FilterPanel.tsx`: modal con tipologie (multi-select chip), punteggio medio min/max (TextInput), categoria di voto + range min/max, toggle "Solo preferiti"; bottoni "Azzera" e "Applica"
- `ActivityListScreen.tsx`: aggiornato con `applyFilters()` (filtra prima del sort), bottone "Filtri" con badge contatore, `<FilterPanel>` in fondo al return
- Il filtro categorie usa logica OR sulle recensioni di una stessa attività (ALMENO UNA soddisfa la condizione)
- Filtri sempre applicati lato client

**7e — Search bar potenziata (Home)** ✅
- `index.tsx`: dropdown mostra suggerimenti misti mentre si digita (min 2 caratteri):
  - Attività salvate (match su nome, indirizzo, tag) — mostrate per prime con icona stella; tap → `/activity/[id]`
  - Indirizzi Nominatim (debounced) — mostrati sotto con icona location; tap → mappa si sposta all'indirizzo
  - Riga "Cerca \"...\" in lista" in fondo — tap → `/list?q=...`
- `onSubmitEditing` su TextInput → naviga direttamente a `/list?q=...`
- `src/app/list.tsx`: nuova schermata (Stack, no tab bar) che legge `q` da params, filtra client-side per nome/indirizzo/tag, delega rendering a `ActivityListScreen` con `showBack`
- `ActivityListScreen`: aggiunto prop `showBack` (freccia ← in header) con `useRouter().back()`

### Fase 8 — Logging & Polish ✅

**8a — Logger centralizzato**
- `src/lib/logger.ts`: wrapper con `log()`, `warn()`, `error()`
- In development (`__DEV__`): scrive su console con tag `[NomeModulo]`
- In production: `log` e `warn` silenziati; `error` sempre loggato (pronto per Sentry in Fase 10)
- Tutti i `console.log/warn` sparsi nella codebase sostituiti con `logger.*`

> Le seguenti attività sono state spostate alla **Fase 10**:
> - i18n (i18next, lingue IT/ES/EN)
> - Sentry error tracking
> - EAS build (APK/IPA)

### Fase 9 — Migrazione backend self-hosted (Laravel)

> Obiettivo: eliminare la dipendenza da Supabase (piano free con limiti e server USA lento).
> Hosting già disponibile: **SupportHost** con cPanel — dominio `crointhemorning.com`.

---

#### Dettagli infrastruttura reale

| Voce | Valore |
|---|---|
| Hosting | SupportHost (cPanel) — già attivo |
| Root hosting | `/home/crointhe/` |
| Cartella pubblica | `/home/crointhe/public_html/` (risponde a `www.crointhemorning.com`) |
| Cartella API | `/home/crointhe/public_html/tastespot/` |
| Document root Laravel | `/home/crointhe/public_html/tastespot/public/` |
| URL API | `https://tastespot.crointhemorning.com` |
| Database | MySQL/MariaDB (cPanel) |
| DB name | `crointhe_tastespot` |
| DB user | `crointhe_ts` |
| PHP | 8.2+ (configurato via MultiPHP Manager in cPanel) |

> **Nota importante:** Il piano originale usava PostgreSQL. SupportHost cPanel usa **MySQL/MariaDB** — tutte le migration sono state riscritte di conseguenza (niente `jsonb`, niente `uuid`, niente RLS).

---

#### Checklist setup infrastruttura

- [x] **Step 1** — Sottodominio `tastespot.crointhemorning.com` creato in cPanel → document root `/home/crointhe/public_html/tastespot/public`
- [x] **Step 2** — Database MySQL `crointhe_tastespot` + utente `crointhe_ts` creati in cPanel
- [x] **Step 3** — PHP 8.2+ impostato nel MultiPHP Manager per il sottodominio
- [x] **Step 4** — ~~SSH~~ **scartato** — SSH bloccato da firewall SupportHost; si usa FTP/SFTP con Cyberduck
- [ ] **Step 5** — Setup Laravel in locale (Mac) + test con SQLite
- [ ] **Step 6** — Upload su hosting via FTP (Cyberduck): intera cartella `tastespot/` inclusa `vendor/`
- [ ] **Step 7** — Migrations e storage:link via script PHP temporaneo da browser (vedi sotto)
- [ ] **Step 8** — Verifica endpoint + aggiornamento frontend React Native

---

#### Strategia di deploy (senza SSH)

Poiché SSH è bloccato su SupportHost, il workflow è:

1. **Sviluppo locale** sul Mac: `php artisan serve` + SQLite
2. **Test locale** completi con l'app React Native puntata su `http://localhost:8000`
3. **Deploy via FTP** con Cyberduck (gratuito) — si carica l'intera cartella inclusa `vendor/`
4. **Migrations in produzione** tramite uno script PHP temporaneo:

```php
<?php
// public/setup.php — DA ELIMINARE SUBITO DOPO L'USO
// Protetto da token segreto
if (($_GET['token'] ?? '') !== 'SCEGLI_UN_TOKEN_SEGRETO') die('Forbidden');

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->call('migrate', ['--force' => true]);
$kernel->call('storage:link');
echo 'Done.';
```

Accedi da browser: `https://tastespot.crointhemorning.com/setup.php?token=SCEGLI_UN_TOKEN_SEGRETO`
Dopo l'esecuzione elimina immediatamente `public/setup.php`.

---

#### Setup locale (Step 5)

```bash
# Prerequisiti già verificati: PHP 8.5, Composer (in installazione)
cd /Users/cronycles/workspace/TasteSpot/backend

# Installa Laravel e le dipendenze
composer create-project laravel/laravel . --prefer-dist

# Copia i file del progetto (sovrascrivono quelli di default)
# bootstrap/app.php, routes/api.php, app/Models/*.php,
# app/Http/Controllers/Api/*.php, database/migrations/2024_*.php

# Configura .env locale (SQLite, nessun server)
cp .env .env.production    # salva il .env production
```

Contenuto `.env` per sviluppo locale:
```
APP_NAME=TasteSpot
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=sqlite
# DB_DATABASE viene creato automaticamente da Laravel in database/database.sqlite

FILESYSTEM_DISK=public
```

```bash
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
# API disponibile su http://localhost:8000/api/v1/
```

---

#### Deploy su hosting (Step 6)

**Cyberduck** (gratuito, Mac): https://cyberduck.io

1. Apri Cyberduck → **Nuova connessione** → tipo **FTP-SSL (FTPS)**
2. Server: `crointhemorning.com` — Username: `crointhe` — Password: quella del cPanel
3. Naviga su `/home/crointhe/public_html/`
4. Carica l'intera cartella `backend/` rinominandola `tastespot`
5. Prima di caricare: sostituisci `.env` con `.env.production` (quello con MySQL)
6. Assicurati che `vendor/` sia incluso (è pesante ~50MB ma necessario — niente Composer sul server)

---

#### Stack tecnico Laravel

- **Laravel 11** (PHP 8.2+)
- **MySQL/MariaDB** (cPanel standard)
- **Laravel Sanctum** per autenticazione token (`Authorization: Bearer {token}`)
- **Storage foto**: `storage/app/public/photos/` con `storage:link` → URL pubblici
- **HTTPS**: già gestito da SupportHost (certificato Let's Encrypt automatico)

---

#### Lavoro da fare — Backend Laravel (Step 6, generato da Copilot)

File da creare nel progetto Laravel:

**Routes:**
- `routes/api.php` — tutte le route sotto `/api/v1/`

**Controllers** (`app/Http/Controllers/Api/`):
- `AuthController` — register, login, logout
- `ActivityController` — index (paginato + filtri), store, show, update, destroy
- `ActivityTypeController` — index, store, update, destroy, reorder
- `ReviewController` — upsert per `(activity_id, user_id, type_id)`
- `FavoriteController` — toggle
- `PhotoController` — upload (multipart), destroy

**Models** (`app/Models/`):
- `Activity`, `ActivityType`, `ActivityTypeAssigned`, `Review`, `ActivityPhoto`

**Migrations** (`database/migrations/`):
- Riscrittura delle migration Supabase in sintassi MySQL/Laravel
- Campi `uuid` → `CHAR(36)` con `Str::uuid()` nel model
- Campi `jsonb` → `JSON`
- RLS Supabase → `where('user_id', auth()->id())` in ogni query

**Middleware:**
- `auth:sanctum` su tutte le route protette (già incluso in Laravel Sanctum)

---

#### Lavoro da fare — Frontend React Native (dopo backend attivo)

- `src/lib/api.ts` — client HTTP generico (fetch + `EXPO_PUBLIC_API_URL` da `.env`)
- `authStore` — token Sanctum in `expo-secure-store` invece di sessione Supabase
- `activitiesStore` — `supabase.from('activities')` → `api.get/post/put/delete`
- `typesStore` — idem
- `reviewsStore` — idem
- Upload foto — `FormData` multipart invece di `Uint8Array` + Supabase Storage
- URL foto — `${BASE_URL}/storage/photos/${path}` invece di `getPublicUrl`
- Rimozione di `@supabase/supabase-js` dal progetto

**La UI non cambia nulla** — è lavoro puramente di plumbing (~6 store da aggiornare).

---

**Nota:** Le migration SQL Supabase (`supabase/migration_*.sql`) sono sintassi PostgreSQL e **non** sono compatibili 1:1 con MySQL — vanno riscritte come migration Laravel (vedi Step 6).


## Verifica per fase
- Fase 0 ✅: app gira su simulatore iOS/Android, tab bar visibile, auth guard reindirizza a login
- Fase 1: login/register funzionano, sessione persistita, errori mostrati
- Fase 2: CRUD tipologie su Supabase, RLS protegge dati per utente
- Fase 3: mappa si apre con posizione utente, fallback Genova, ricerca indirizzi
- Fase 4: aggiunta attività salvata su Supabase, dettaglio visibile, foto caricate
- Fase 5: recensione salvata, punteggi calcolati, modifica funziona
- Fase 6: nome/indirizzo/tipologie/telefono modificabili dal dettaglio; marker mappa aggiornato

**⚠️ Revisioni Fase 6 completate:**
- ✅ Pagina `activity/edit/[id].tsx`: form identico ad `add.tsx`, pre-compilato con i dati esistenti (nome, indirizzo + Nominatim autocomplete, telefono, tipologie, note, tag); chiama `activitiesStore.update()`; validazione nome obbligatorio + almeno una tipologia
- ✅ Bottone "Modifica attività" nel dettaglio (sopra "Elimina attività") → naviga a `activity/edit/[id]`
- ✅ Foto non toccate (già gestite in Fase 4: aggiunta + eliminazione long-press)
- Fase 7: lista paginata, filtri e ordinamenti funzionano
- Fase 8: logger attivo, `console.log` rimossi dalla codebase
- Fase 9: app funziona identicamente senza nessuna dipendenza da servizi terzi a pagamento
- Fase 10: icona default tipologia, messaggio benvenuto, errori sotto i campi, pesi punteggio, condivisione
- Fase 11: Sentry attivo in produzione, build APK e IPA generate con EAS

---

### Fase 10 — UX & Polish

**10a — Selezione icona al momento della creazione tipologia**
- Al tap su "Aggiungi tipologia" si naviga direttamente alla schermata di creazione con il picker icona integrato
- Se l'utente non sceglie un'icona, viene assegnata una icona generica di default (non quella del ristorante)

**10b — Messaggio di benvenuto post-registrazione**
- Dopo la registrazione, la home mostra un messaggio di benvenuto (es. banner o card) la prima volta che l'utente accede

**10c — Errori di validazione uniformi**
- Tutti i form dell'app mostrano gli errori **sotto i campi** (come già nel login), non con popup/Alert
- Da correggere in particolare: form inserimento attività

**10d — Algoritmo punteggio medio**
- Valutare se dare più peso alla categoria "cibo" rispetto alle altre nel calcolo del punteggio medio complessivo
- Definire i pesi e aggiornare `calcActivityAvgScore`

**10e — Condivisione / deep link Google Maps**
- Pulsante "Condividi" nel dettaglio attività che apre Google Maps o genera un link
- Il link apre TasteSpot e naviga direttamente all'attività (deep link); se l'attività non esiste ancora, pre-compila il form di aggiunta

---

### Fase 11 — Sentry & EAS Build

**11a — Sentry error tracking**
- Account Sentry (free tier) + DSN
- `@sentry/react-native` installato e configurato
- `logger.error()` integra `Sentry.captureException()` in produzione (il TODO in `logger.ts` è già pronto)

**11b — EAS Build (APK / IPA)**
- `eas.json` configurato con profili `development`, `preview`, `production`
- `app.json` aggiornato con `bundleIdentifier` e `package` corretti
- Prima build APK (Android) e IPA (iOS) generate con `eas build`

---

## Idee future

> Idee da valutare in futuro — non pianificate.

- **i18n**: setup `i18next` + `react-i18next`; lingue IT (default), ES, EN; traduzione di tutte le stringhe UI
- **Prezzo medio a persona nel punteggio medio** (rilevante quando ci sono più utenti): nel dettaglio attività mostrare il prezzo medio a persona aggregato su tutte le recensioni, insieme al punteggio medio
