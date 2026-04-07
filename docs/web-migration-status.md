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
- Fase 3: non iniziata
- Fase 4: non iniziata
- Fase 5: non iniziata
- Fase 6: non iniziata
- Fase 7: non iniziata
- Fase 8: non iniziata
- Fase 9: non iniziata

## Current checkpoint
- Branch di lavoro: `develop`
- Commit checkpoint: `5c5b873`
- Commit message: `Add initial web app shell`
- Stato worktree al checkpoint: pulito

## Next recommended phase
- Prossima fase consigliata: Fase 3
- Obiettivo: porting completo di `typesStore` e della pagina tipologie CRUD nella web app

## Key files already touched
- `web/src/App.tsx`
- `web/src/lib/api.ts`
- `web/src/stores/authStore.ts`
- `web/src/stores/locationStore.ts`
- `backend/public/.htaccess`
- `README.md`
- `package.json`

## Resume prompts
Usare uno di questi prompt per riprendere il lavoro:

1. `Leggi docs/web-migration-status.md e continua dalla prossima fase aperta.`
2. `Leggi docs/web-migration-status.md e implementa la Fase 3 della migrazione web.`
3. `Leggi docs/web-migration-status.md, verifica il checkpoint e continua da develop.`

## Update rule
Ogni volta che una fase avanza in modo significativo, aggiornare questo file con:
- fase corrente
- checkpoint git
- lavoro completato
- prossimo step consigliato