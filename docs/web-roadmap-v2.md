# TasteSpot Web — Roadmap v2

**Data**: Aprile 2026  
**Stato attuale**: Fasi 0-10 completate su `develop`  
**Prossima fase**: 11 — Feature Gap Fix  
**Priorità**: Mobile-first. Desktop responsive secondario.  

---

## Contesto

Dopo la migrazione completa alla web app (Fasi 0-9), l'analisi ha rivelato che:  
- Il **design system** della web usa colori/stili completamente diversi dalla mobile app  
- La **Map Page** non è fullscreen come da requisiti — è embedded in una card scrollabile  
- Il linguaggio visivo attuale (glassmorphism + teal) non rispecchia la UI/UX della mobile app  
- L'utente vuole lo stesso look & feel della mobile app su web  

---

## Fase 10 — UI Redesign (design system mobile-like)

**Stima**: 1-2 giorni  
**Obiettivo**: Web app visivamente identica (nel linguaggio) alla mobile app.  
**Priorità**: Alta — da fare prima dei fix feature.  

### Problemi da risolvere

| Problema | Attuale | Obiettivo |
|----------|---------|-----------|
| Colore primario | `#0f766e` (teal) | `#FF5A35` (orange-coral) |
| Sfondo app | Gradiente blu-grigio + glassmorphism | `#FAFAFA` bianco-grigio pulito |
| Superfici/carte | `rgba(255,255,255,0.92)` + blur | `#FFFFFF` solido senza blur |
| Bottone primario | Gradiente teal | Arancio solido, pill full-radius |
| Active state nav/chips | Teal highlight | Arancio `#FF5A35` |
| App header al top | 60px header barra fissa | Rimosso (o solo back-button minimale) |
| Map Page layout | Scrollabile in page-card | Fullscreen, search bar floating |
| Lista in MapPage | Lista scritta in basso alla mappa | Rimossa (non è nella home per i requisiti) |

### Task

**10a — CSS Design System** (2-3 ore)

`web/src/styles/base.css`:
- CSS variables: `--color-primary: #FF5A35`, `--color-primary-dark: #D94A2A`
- Background: `--color-background: #FAFAFA`, rimuovere gradiente bluish
- Superfici: `--color-surface: #FFFFFF` (opaco, no rgba)
- Rimuovere `backdrop-filter: blur()` da tutti i componenti
- Font: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`
- Bottone primario: arancio solido, no gradiente, pill border-radius
- Sfondi auth page: puliti, no glassmorphism

`web/src/styles/layout.css`:
- `app-frame` background: `#FAFAFA` semplice
- `nav-link.active`: background arancio tenue + colore arancio
- `app-header`: rimosso o ridotto a sola riga back-button per pagine non-tab
- Aggiungere `.app-content.no-padding` per MapPage

`web/src/styles/features.css`:
- `.activities-chip.active`: border + testo arancio
- `.types-main-icon`: background arancio tenue
- `.types-icon-cell.active`: border + bg arancio tenue

**10b — App Shell** (30-60 min)

`web/src/components/AppLayout.tsx`:
- Rimuovere `app-header` (la bottom nav basta)
- Per pagine non-tab (activity detail, form, ecc.): aggiungere back-button in-page header minimale
- Su route `/`: aggiungere classe `no-padding` a `main.app-content` per permettere la mappa fullscreen

**10c — MapPage Fullscreen** (3-4 ore)

`web/src/pages/MapPage.tsx`:
- Map container: `height: 100%`, posizionato con `position: absolute; inset: 0`
- Search bar: `position: absolute; top: 12px; left: 12px; right: 12px; z-index: 10`
- Filter chips: `position: absolute; top: 64px; left: 12px; right: 12px; z-index: 10`
- FAB "+": `position: absolute; bottom: 24px; right: 16px` — bottone arancio
- FAB locate: `position: absolute; bottom: 88px; right: 16px` — bottone bianco
- Rimuovere sezione "Lista attività" in fondo (non appartiene alla home)
- PlaceSuggestion card: inline nella mappa a bottom (non una lista)
- Stile search bar: bianca, arrotondata, ombre leggere (come mobile)
- Stile filter chips: bianche inattive, arancio attive

**10d — Stile pagine lista/dettaglio/form** (1-2 ore)

`web/src/pages/NearbyPage.tsx`, `FavoritesPage.tsx`, `ActivitiesListPanel.tsx`:
- Header pagina: titolo + sort pills — sfondo bianco, bordo bottom 1px
- Sort pills: bianche inattive, arancio attive con tween lieve
- Lista: sfondo `#FAFAFA` con card `#FFFFFF`

`web/src/pages/ActivityDetailPage.tsx`:
- Rimuovere card-in-card, layout flat
- Sezione header: sfondo bianco, back button in-page
- Icone azioni: row orizzontale con icona + label sotto (come mobile)

`web/src/pages/ActivityFormPage.tsx`, `TypesPage.tsx`, `ProfilePage.tsx`:
- Pulizia stile: sfondo `#FAFAFA`, form fields clean
- Bottoni: arancio primario, rosso per danger

### Validazione Fase 10
- [x] Colori arancio visibili ovunque (nav active, FAB, bottoni, chips)
- [x] Map Page è fullscreen senza header sopra, mappa occupa tutta l'area
- [x] Search bar e filtri flottanti sopra la mappa
- [x] FAB "+" arancio in basso a destra sulla mappa
- [x] Nessun glassmorphism visibile (no backdrop-blur, no rgba superfici)
- [x] Sfondo app è `#FAFAFA`, carte sono `#FFFFFF`
- [x] Nav bar: tab attivo arancio
- [x] Lista attività rimossa dalla MapPage
- [x] Build senza errori, deploy OK

---

## Fase 11 — Feature Gap Fix

**Stima**: 1-2 giorni  
**Obiettivo**: Completare i requisiti core mancanti dalla gap analysis.  

### Task

**11a — Cambio Password** (2-3 ore)

Backend `backend/routes/api.php` + `AuthController.php`:
- Endpoint `POST /api/v1/auth/change-password`
- Validazione: `old_password` (verificare hash), `new_password` (min 8, confermata)
- Return: 200 ok / 422 errore

Frontend `web/src/pages/ProfilePage.tsx` (o nuova `SecurityPage.tsx`):
- Form: vecchia password + nuova password + ripeti nuova password
- Validazione client + server error inline

**11b — POI Prefill Verifica** (1 ora)

`web/src/pages/ActivityFormPage.tsx`:
- Verificare che query params `name`, `address`, `lat`, `lng`, `phone` siano letti e applicati al form
- Fix se mancano, test con mappa long-press

**11c — Gallery Landscape** (30 min)

`web/src/pages/ActivityDetailPage.tsx`:
- Verificare orientamento landscape nella gallery fullscreen
- Fix CSS se distorto

**11d — E2E Testing** (1 ora)
- Test su dispositivo mobile (Safari iOS o Chrome Android)
- Verificare: mappa, marker, POI, form, recensione, gallery

---

## Fase 12 — i18n (post-11)

**Stima**: 3-4 giorni  
**Obiettivo**: App supporta IT (default), ES, EN.  

### Task
- [ ] Setup `i18next` + `react-i18next` + browser language detection
- [ ] Estrarre tutte le stringhe UI in `web/src/locales/{it,es,en}.json`
- [ ] Hook `useTranslation()` in tutte le pagine e componenti
- [ ] Language switcher in ProfilePage (persiste in localStorage)
- [ ] Test tutte le lingue

---

## Fase 13 — Error Tracking (opzionale)

**Stima**: 1 giorno  
**Obiettivo**: Centralizzare errori runtime in produzione.  

### Task
- [ ] Account Sentry free + DSN
- [ ] `@sentry/react` package
- [ ] `Sentry.init()` in `main.tsx`
- [ ] `ErrorBoundary` top-level in `App.tsx`
- [ ] Test error tracking (simula errore, verifica Sentry dashboard)

---

## Note Tecniche per la Fase 10

### Approccio CSS
Il sistema di stile usa classi CSS + variabili CSS (no Tailwind, no CSS-in-JS). Il cambio di palette è essenzialmente:
1. Aggiornare le variabili in `:root` in `base.css`
2. Pulire i valori hardcoded (rgba con teal, gradienti, backdrop-filter)
3. Le classi riutilizzano le variabili → la modifica si propaga ovunque

### MapPage Fullscreen
L'`app-content` in `AppLayout.tsx` ha `padding: 14px; overflow-y: auto`. Per la mappa serve:
- `padding: 0; overflow: hidden; position: relative`
- La MapPage usa `position: absolute; inset: 0` per i suoi figli
- Implementato tramite classe CSS condizionale in AppLayout (`isMapRoute`)

### Bottom Nav preservata
La bottom nav rimane invariata strutturalmente. Solo:
- Rimuovere l'`app-header` dal layout
- Cambiare `.nav-link.active` da teal a arancio

### App Header
Attualmente ogni pagina va attraverso `AppLayout` che include `app-header` sempre visibile. 
Strategia: 
- Rimuovere l'`app-header` dal layout principale
- Le pagine non-tab (detail, form, types, profile) includono un loro mini-header con back button
- MapPage è fullscreen senza header sovrapposto

---

## Checkpoint Corrente

- **Branch**: develop  
- **Commit base**: `d07129d`  
- **Da fare**: Fase 11 → 12 → 13  
- **Produzione**: https://tastespot.crointhemorning.com  
- **Dev locale**: `npm run start` dalla root  

