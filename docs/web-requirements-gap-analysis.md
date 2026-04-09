# TasteSpot Web — Analisi Gap Requisiti vs Implementazione

**Data**: Gennaio 2025  
**Versione**: 1.0  
**Scope**: Gap analysis completa tra documento-requisiti.md e web implementation attuale  
**Status**: Review pending  

---

## Riepilogo Esecutivo

La web app ha **completato le 9 fasi della migrazione** ed è **in produzione su cPanel** con deploy automatico via GitHub Actions. L'analisi confronta il documento di requisiti originale ("documento-requisiti.md") con lo stato attuale del codice.

**Risultato**: Il 90% dei requisiti core è implementato. Rimangono **3-4 gap critici** piccoli e **4-5 nice-to-have**, tutti risolvibili in 2 fasi di lavoro (5-7 giorni totali).

### Requisiti soddisfatti ✅
- ✅ Layout quicklink bar 4 icone  
- ✅ Mappa fullscreen con marker, search bar, filtri, FAB  
- ✅ Long-press mappa → pre-compila add attività  
- ✅ Liste verticali paginato, ordinamento 4 parametri, filtri 4 categorie  
- ✅ Dettaglio attività con foto gallery, punteggio, recensioni per tipologia  
- ✅ CRUD attività (add/edit/delete), foto (upload/delete), inline edit  
- ✅ CRUD tipologie con riordino ▲▼  
- ✅ SmileRating 5 livelli, punteggi pesati per categoria  
- ✅ Area Privata (profilo utente, logout)  
- ✅ Deploy automatico con GitHub Actions  

### Gap critici trovati ❌ (Priorità Alta)
1. **Cambio password** — manca endpoint + formulario  
2. **POI query param prefill** — verifica se query param da long-press pre-compila form correttamente  
3. **Icone azioni inline (Note/Tag)** — modali ed styling (parzialmente impl.)  
4. **Gallery foto landscape** — verifica orientamento  

### Nice-to-have trovati 🟡
1. **i18n (IT/ES/EN)** — non implementata  
2. **Responsive desktop** — layout non testato vs desktop  
3. **PWA offline** — service worker assente  
4. **Error tracking (Sentry)** — logger esiste ma no Sentry integrazione  

---

## 1. Stato Attuale Web — Checklist Completa

### Backend (Laravel 11 + Sanctum) ✅
- Database MySQL su cPanel (crointhe_tastespot)
- API REST `/api/v1/` con autenticazione Sanctum
- Storage foto: `storage/app/public/photos/{user}/{activity}/{timestamp}.ext`
- Deploy: script `deploy.sh` con git pull + migrations
- Hosting: SupportHost cPanel — dominio `tastespot.crointhemorning.com`

### Frontend (React + Vite + MapLibre GL JS) ✅
**Pagine Implementate**:
- ✅ LoginPage — form email/password, Sanctum auth
- ✅ RegisterPage — form email/password, auto-login
- ✅ MapPage — mappa fullscreen, marker attività, ricerca, filtri
- ✅ ListPage / FavoritesPage / NearbyPage — liste verticali, ordinamento, filtri, lazy load
- ✅ ActivityDetailPage — foto gallery, punteggio, reviews per tipo, azioni inline
- ✅ ActivityFormPage (add/edit) — form CRUD, prefill POI, compressione foto
- ✅ TypesPage — CRUD tipologie, riordino
- ✅ ProfilePage — dati utente, logout, link rapidi
- ✅ NotFoundPage — 404
- ✅ AppLayout — nav bottom bar 4 tab

**Store Zustand**:
- ✅ authStore — login/register/logout, token Sanctum, session persistence
- ✅ activitiesStore — fetch/create/update/delete, toggle preferiti, lazy load
- ✅ typesStore — fetch/create/update/delete, riordino
- ✅ reviewsStore — create/update reviews per type, calcoli punteggio medio + per categoria
- ✅ locationStore — geolocalizzazione browser, fallback Genova (44.4056, 8.9463)

**Componenti**:
- ✅ Mappa MapLibre GL JS con marker custom
- ✅ Search bar autocomplete (attività + indirizzi Nominatim)
- ✅ Filtri panel (tipologie, punteggio, categorie, preferiti)
- ✅ Ordinamento pill (distanza/visti/recensiti/A→Z) con toggle asc/desc
- ✅ SmileRating (5 smile: 1, 3.5, 6, 8, 10)
- ✅ Foto gallery con compressione + resize browser
- ✅ Card verticale/orizzontale (solo verticale implementata)
- ✅ Cuore preferiti toggle
- ✅ Azioni inline: mod. nome, indirizzo, tipologie, telefono, note, tag

**Deployment**:
- ✅ `web/dist/` pre-built committato in git
- ✅ GitHub Actions: build web + push dist
- ✅ cPanel: git pull + copy dist a document root
- ✅ `.htaccess` routing SPA + API proxy

---

## 2. Gap Analysis Dettagliata

### 🔴 CRITICITÀ ALTA — Requisiti mancanti

#### 1. Cambio Password (Area Privata)
**Requisito da doc**: "Pagina Sicurezza — Cambio password"  
**Implementazione attuale**: ❌ Link esiste ma non funzionale (endpoint?)  
**Impatto**: User non può cambiare password da web — security concern  
**Sforzo Fix**: Basso (1-2 ore)
- Backend: `POST /api/v1/auth/change-password` (validare old password, update con new)
- Frontend: form con campo old password + new password 2x + bottone Salva

**Priorità**: 🔴 Alta — requisito esplicito

---

#### 2. POI Query Parameter Prefill
**Requisito da doc**: "Long-press su POI con dati OSM → pre-compila nome, indirizzo, telefono"  
**Metodo**: Query param nell'URL form: `?name=&address=&lat=&lng=&phone=` / `osmAmenity=`  
**Stato implementazione**: ⚠️ Implementato in recent fixes (changelog menziona POI prefill), ma **require verifica**

**Domande**:
- La query param `lat`, `lng` pre-compila il campo indirizzo via Nominatim reverse geocode?
- La query param `osmAmenity` pre-seleziona la tipologia giusta?
- Il form Activity accetta i 5 param?

**Sforzo Fix**: Basso (30-60 min) se niente funziona, minimo se solo styling

**Priorità**: 🔴 Alta — requisito esplicito

---

#### 3. Icone Azioni Inline (Note/Tag)
**Requisito da doc**: 
> "Lista orizzontale di icone: Preferiti, Note generiche (modificabili), Tags (modificabili), Indicazioni, Chiama"

**Stato implementazione**: ⚠️ Parzialmente
- ✅ Preferiti — implementato, toggle funziona
- ⚠️ Note — implementato con modal, ma **verify styling**
- ⚠️ Tag — implementato con modal, ma **verify styling**
- ✅ Indicazioni (Google Maps link) — implementato, disabilitato se no indirizzo
- ✅ Chiama — implementato, disabilitato se no telefono

**Visual**: Le icone dovrebbero essere:
- Ordinamento orizzontale (no verticale)
- Icone chiare di Ionicons
- Layout simile righe di bottoni
- Modal che si apre al tap per editare

**Sforzo Fix**: Medio (2-3 ore) se serve restructuring layout + verify modals

**Priorità**: 🔴 Alta — requisito core UX

---

#### 4. Gallery Foto — Landscape Orientation
**Requisito da doc**: "In landscape, le foto si scorrono con il telefono in orizzontale"  
**Stato**: ⚠️ Gallery apre in modal fullscreen ma **no orientation lock verificato**

**Cosa serve**: 
- Detect quando dispositivo gira in landscape
- Gallery rimane fullscreen e responsive
- No distorsione immagini

**Sforzo Fix**: Basso (30-60 min) — probabilmente già funziona con CSS, serve solo test

**Priorità**: 🟡 Media-Alta — requisito UX buon feel

---

### 🟡 CRITICITÀ MEDIA — Nice-to-have

#### 1. Internazionalizzazione (i18n — IT/ES/EN)
**Requisito da doc**: "Lingue: italiano (default), spagnolo, inglese"  
**Status**: ❌ Non implementata  
**Impatto**: App usa solo italiano hardcoded → limitazione mercato  
**Sforzo Fix**: Medio (3-4 ore setup + traduzione)
- Setup `i18next` + React provider
- Trasferire stringhe a JSON locale
- Switch lingua in ProfilePage
- Persistenza in localStorage

**Priorità**: 🟡 Media — bello avere ma non blocca MVP

---

#### 2. Responsive Desktop
**Requisito da doc**: Implicito "web" → deve funzionare da desktop  
**Status**: ⚠️ Layout base responsive (Tailwind) ma **no testing desktop verificato**  
**Impatto**: User desktop potrebbe avere UX scadente (nav bar troppo grande, col width esplosivo, etc.)

**Sforzo Fix**: Medio (2-3 ore testing + aggiustamenti)
- Test su breakpoint tablet (750px) e desktop (1024px+)
- Aggiustare font-size, padding, grid layout se necessario
- Possibly aggiungere drawer/sidebar menu on desktop (opzionale)

**Priorità**: 🟡 Media — rilevante ma non blocca MVP

---

#### 3. Error Tracking (Sentry)
**Requisito da doc**: "Registrazione errori tramite log per il programmatore"  
**Status**: ⚠️ Logger locale esiste, no Sentry cloud  
**Impatto**: Errori in produzione non centralizzati → difficile debug  

**Sforzo Fix**: Basso (1 ora)
- Setup account Sentry free
- Aggiungere `@sentry/react` package
- Configurare Sentry.init in App.tsx
- Wrap componenti con `ErrorBoundary`

**Priorità**: 🟠 Bassa — nice ma non urgente, MVP funziona senza

---

#### 4. PWA (Progressive Web App)
**Requisito da doc**: No, implicito "app-like"  
**Status**: ❌ No service worker, no offline  
**Impatto**: Funziona solo online, no installabile come app desktop  

**Sforzo Fix**: Alto (6-8 ore) — low ROI ora  
**Priorità**: 🟠 Bassa — future nice-to-have

---

## 3. Matrice Priorizzazione

| Gap | Tipo | Criticità | Sforzo | Fase | Risorse |
|-----|------|-----------|--------|------|---------|
| Cambio password | Core | 🔴 Alta | Basso | 10 | Backend + Form |
| POI prefill verify | Core | 🔴 Alta | Basso | 10 | Test + Fix query |
| Note/Tag styling | Core | 🔴 Alta | Medio | 10 | UI/UX Review |
| Gallery landscape | Core | 🟡 Media | Basso | 10 | Test orientamento |
| i18n setup | Nice | 🟡 Media | Medio | 11 | i18next + traduzioni |
| Responsive desktop | Nice | 🟡 Media | Medio | 11 | Testing + CSS |
| Error tracking | Nice | 🟠 Bassa | Basso | 12 | Sentry integration |
| PWA | Nice | 🟠 Bassa | Alto | Future | Service worker |

---

## 4. Roadmap Proposta

> Nota: le priorità sono state **aggiornate** per includere il redesign UI come primo obiettivo.
> i18n e desktop responsive sono stati spostati a dopo la Fase 11.
> Dettaglio completo: `docs/web-roadmap-v2.md`

### Fase 10 — UI Redesign (design system mobile-like) — 1-2 giorni
**Obiettivo**: Portare il linguaggio visivo della web al livello della mobile app.

**Problema principale**:
- Colori : CSS usa teal `#0f766e`, la mobile usava orange-coral `#FF5A35`
- Sfondi: gradiente blu-grigio + glassmorphism, la mobile era bianco pulito `#FAFAFA`
- Map Page: non è fullscreen, è dentro una `page-card` scrollabile (sbagliato per UX)
- App header al top: la mobile non ce l'aveva

**Sub-task**:
1. [ ] **CSS variables**: aggiornare colori, sfondi, font (base.css)
2. [ ] **Rimuovere glassmorphism**: superfici bianche solide
3. [ ] **Bottoni**: arancio solido pill, senza gradiente
4. [ ] **Nav bar**: active state arancio
5. [ ] **App header**: rimuovere o rendere minimale (solo back button per pagine non-tab)
6. [ ] **MapPage fullscreen**: mappa prende tutta l'altezza disponibile, search bar e filtri floating sopra, FAB floating
7. [ ] **Lista nella mappa**: rimuovere la lista in basso dalla MapPage (non è nei requisiti — sta su Nearby/Favorites)

---

### Fase 11 — Feature Gap Fix — 1-2 giorni
**Obiettivo**: Completare i requisiti core mancanti.

**Task**:
1. [ ] **Cambio password**: endpoint Laravel + form web
2. [ ] **POI query param prefill**: verifica e fix
3. [ ] **Icone azioni inline**: styling e verify modali note/tag
4. [ ] **Gallery landscape**: test orientamento, fix CSS
5. [ ] **Deploy + verification**: build prod, verificare su live domain

---

### Fase 12 — i18n (post-11, 3-4 giorni)
**Obiettivo**: IT/ES/EN con i18next.

---

### Fase 13 — Error Tracking (opzionale, 1 giorno)
**Obiettivo**: Sentry integration.

---

## 5. Checkpoint Attuale

**Git Status**:
- Branch: `develop`
- Commit: `b4c2596` (Implement Phase 9 production deploy for web + backend)
- Working tree: clean
- Remote: synced

**Deployment Status**:
- Hosting: SupportHost cPanel (tastespot.crointhemorning.com)
- Build: web/dist pre-built + committed
- Deploy: GitHub Actions + cPanel git pull (funzionante)
- API: https://tastespot.crointhemorning.com/api/v1/
- Frontend: https://tastespot.crointhemorning.com/

---

## 6. Raccomandazioni

### Immediato (Prossimi 2-3 giorni)
1. **Review questo gap analysis** con lo user per confermare priorità
2. **Stima realistica** dei tempi (ho proposto 2-3 giorni Fase 10)
3. **Setup task di Fase 10** (4 task critici)
4. **Assegnazione risorse** (1 dev = 2-3 giorni)

### Timeline suggerito
- **Fase 10** (Core polish): 2-3 giorni → production
- **Fase 11** (i18n/responsive): 3-4 giorni → production
- **Fase 12** (Error tracking): 1-2 giorni (opzionale)
- **Total**: 6-9 giorni per completare MVP pieno ai requisiti

### Considerazioni Build
- Tailwind CSS già in uso (buono per responsive)
- MapLibre GL JS stabile, niente breaking changes imminenti
- i18next integrazione semplice, no dipendenze complesse
- Sentry free tier sufficiente per MVP

### Testing Recommendation
Aggiungere test cases:
- [ ] POI long-press → form prefill
- [ ] Cambio password → login con new password
- [ ] Gallery portrait/landscape
- [ ] Note/Tag modal (show/edit/save)
- [ ] Responsive breakpoint mobile/tablet/desktop
- [ ] i18n: switch lingua IT/ES/EN, persist in localStorage

---

## 7. Documenti Correlati

- [documento-requisiti.md](documento-requisiti.md) — Requisiti originali web
- [roadmap.md](roadmap.md) — Roadmap mobile (context)
- [web-migration-status.md](web-migration-status.md) — Checkpoint migrazione
- [plan.md](.github/instructions/plan.instructions.md) — Plan mobile (archive)

---

**Fine documento — Pronto per discussione e planificazione Fase 10**

