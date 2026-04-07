# TasteSpot Web Migration Status

## Canonical resume note
Questo file e' la fonte canonica per capire dove siamo arrivati nella migrazione web.
Quando si riprende il lavoro, leggere prima questo documento e poi continuare dalla prossima fase aperta.

## Product decision
- Strategia scelta: abbandono progressivo dell'app Expo/React Native e migrazione verso una web app React + Vite.
- Backend Laravel mantenuto nello stesso hosting cPanel.
- URL target: frontend su `https://tastespot.crointhemorning.com/`, backend su `https://tastespot.crointhemorning.com/api/v1/`.
- Esperienza desiderata: mobile-first, app-like.

## Approved roadmap
- Fase 0: setup progetto web e integrazione serving SPA
- Fase 1: core API/auth browser
- Fase 2: shell app + routing
- Fase 3: tipologie attivita'
- Fase 4: lista attivita' + filtri
- Fase 5: dettaglio + CRUD attivita'
- Fase 6: recensioni
- Fase 7: mappa MapLibre GL JS
- Fase 8: nearby + profilo
- Fase 9: deploy web automatico

## What is already implemented
- Directory `web/` creata con Vite + React + TypeScript.
- Dipendenze installate: `react-router-dom`, `zustand`, `maplibre-gl`, `react-icons`, `browser-image-compression`.
- Shell SPA iniziale implementata.
- Routing pubblico/protetto implementato.
- Auth web implementata con token Sanctum in `localStorage`.
- API client browser implementato.
- Location store adattato a `navigator.geolocation`.
- Pagine iniziali create: login, register, map, favorites, nearby, profile, types, 404.
- Fase 3 completata: `typesStore` portato su web con fetch/create/update/delete/reorder.
- Pagina tipologie web implementata con CRUD completo, riordino up/down e selezione icone.
- Fase 4 completata: `activitiesStore` portato su web con fetch paginato e toggle preferiti.
- Lista attivita' web implementata con ricerca, filtro tipologia, filtro preferiti, ordinamento e load-more.
- Pagina `Preferiti` collegata alla stessa lista in modalita' solo preferiti.
- Fase 5 completata: route e pagine web per dettaglio attivita', add e edit implementate.
- Form condiviso add/edit implementato con campi principali, tipologie e tag.
- Gestione foto completata nel dettaglio attivita': upload con compressione browser, gallery e delete foto.
- `backend/public/.htaccess` aggiornato per supportare SPA + API sullo stesso dominio.
- Script root aggiunti: `local:web` e `local:start:web`.
- README aggiornato con la nuova struttura web.
- Verifiche completate: `cd web && npm run build` e `cd web && npm run lint`.

## Phase status
- Fase 0: parzialmente completata
  - Fatto: scaffold web, env, Vite config, serving SPA lato `.htaccess`
  - Aperto: pipeline deploy web verso cPanel
- Fase 1: completata
- Fase 2: completata in versione base
- Fase 3: completata
- Fase 4: completata
- Fase 5: completata
- Fase 6: non iniziata
- Fase 7: non iniziata
- Fase 8: non iniziata
- Fase 9: non iniziata

## Current checkpoint
- Branch di lavoro: `develop`
- Commit checkpoint: `f9ab4b8`
- Commit message: `Complete Phase 5 photo management on activity detail`
- Stato worktree al checkpoint: pulito

## Next recommended phase
- Prossima fase consigliata: Fase 6
- Obiettivo: portare su web il sistema recensioni (create/update/view per tipologia) e i calcoli punteggio nel dettaglio attivita'.

## Key files already touched
- `web/src/App.tsx`
- `web/src/lib/api.ts`
- `web/src/stores/authStore.ts`
- `web/src/stores/locationStore.ts`
- `web/src/stores/typesStore.ts`
- `web/src/pages/TypesPage.tsx`
- `web/src/stores/activitiesStore.ts`
- `web/src/components/ActivitiesListPanel.tsx`
- `web/src/pages/MapPage.tsx`
- `web/src/pages/FavoritesPage.tsx`
- `web/src/pages/ActivityFormPage.tsx`
- `web/src/pages/ActivityAddPage.tsx`
- `web/src/pages/ActivityEditPage.tsx`
- `web/src/pages/ActivityDetailPage.tsx`
- `backend/public/.htaccess`
- `README.md`
- `package.json`

## Resume prompts
Usare uno di questi prompt per riprendere il lavoro:

1. `Leggi docs/web-migration-status.md e continua dalla prossima fase aperta.`
2. `Leggi docs/web-migration-status.md e avvia la Fase 6 della migrazione web (recensioni).`
3. `Leggi docs/web-migration-status.md, verifica il checkpoint e continua da develop.`

## Update rule
Ogni volta che una fase avanza in modo significativo, aggiornare questo file con:
- fase corrente
- checkpoint git
- lavoro completato
- prossimo step consigliato