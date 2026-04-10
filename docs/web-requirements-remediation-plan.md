# TasteSpot Web — Piano Canonico Requisiti e Fasi

**Data**: 10 aprile 2026  
**Fonte primaria di prodotto**: `docs/documento-requisiti.md`  
**Stato**: canonico per audit gap e fasi correttive della web app  

---

## Scopo

Questo documento sostituisce come riferimento operativo la precedente roadmap web e consolida in un unico punto:

- i requisiti che comandano davvero
- il confronto tra requisiti e implementazione web attuale
- le fasi validate da eseguire
- cio' che la precedente roadmap web non copriva o dava per chiuso in modo non corretto

## Regola canonica

1. `docs/documento-requisiti.md` comanda sulle scelte funzionali.
2. Questo documento traduce quei requisiti in fasi operative per la web app.
3. Questo e' l'unico documento operativo di stato e piano per la web app.

## Come riprendere il lavoro

Quando si riprende il progetto, leggere in questo ordine:

1. `docs/documento-requisiti.md`
2. `docs/web-requirements-remediation-plan.md`

Prompt di resume consigliato:

- `Leggi docs/documento-requisiti.md e docs/web-requirements-remediation-plan.md e continua dalla prossima fase.`
- `Leggi docs/documento-requisiti.md e docs/web-requirements-remediation-plan.md e avvia la Fase 1.`

## Checkpoint corrente

- Prodotto attivo: web app React + Vite
- Branch di lavoro: `develop`
- Stato worktree: locale non ancora committato
- Base implementata: auth, map, tipologie, lista, dettaglio, recensioni, profilo, sicurezza, deploy
- Fase completata piu' recente: `Fase 2 — Filtri Lista Completi`
- Prossima fase consigliata: `Fase 3 — Data Layer e Paginazione Reale`
- Focus immediato: paginazione backend vera, `has_more` reale, valutazione filtri/sorting server-side

---

## Stato sintetico attuale

La web app copre bene la base del prodotto: autenticazione, mappa fullscreen, dettaglio attivita', CRUD attivita', recensioni per tipologia, tipologie, profilo, sicurezza account e deploy.

I gap principali emersi rispetto ai requisiti non sono tanto nel perimetro generale, ma in alcuni comportamenti core che oggi non sono conformi o sono solo parziali.

### Conforme o quasi conforme

- Auth login/registro
- Shell app con bottom nav a 4 tab
- Mappa fullscreen con marker custom
- Long-press mappa con prefill add attivita'
- CRUD attivita'
- CRUD tipologie
- Recensioni separate per tipologia
- Preferiti
- Cambio password
- Gallery foto fullscreen

### Gap reali confermati

- filtri lista non completi
- comportamento search Home non conforme su Invio
- ordinamenti non completi e tracking di `last_viewed_at` non agganciato dal frontend
- lazy loading solo simulato lato frontend, non reale lato backend
- preview lista non conforme al layout richiesto
- punteggio medio nel dettaglio non espandibile a dropdown/toggle
- validazione add attivita' non allineata ai requisiti su indirizzo e fallback tipologia
- i18n non implementata
- scala smile non conforme al documento requisiti

---

## Matrice Gap Canonica

| Area | Requisito | Stato | Nota |
|---|---|---|---|
| Home mappa | mappa fullscreen, marker, FAB, long-press | OK | implementazione presente |
| Search Home | invio apre lista risultati | GAP | oggi resta nella mappa |
| Search Home | suggerimenti attivita' + indirizzi | PARZIALE | focus forte sugli indirizzi/luoghi |
| Filtri lista | tipologie multi-select | GAP | oggi tipologia singola |
| Filtri lista | preferiti | OK | presente |
| Filtri lista | punteggio medio min-max | GAP | assente |
| Filtri lista | categorie voto + range | GAP | assente |
| Ordinamento | vicini | OK | presente |
| Ordinamento | ultimi visti | PARZIALE | UI presente ma tracking incompleto |
| Ordinamento | ultimi recensiti | GAP | assente |
| Ordinamento | alfabetico | OK | presente |
| Liste | lazy loading reale | GAP | backend restituisce tutto |
| Preview lista | layout con foto + punteggio medio | GAP | oggi preview minimale |
| Dettaglio | gallery, azioni, review per tipologia | OK | presente |
| Dettaglio | media cliccabile con dettaglio categorie | GAP | oggi sempre aperta |
| Add attivita' | nome obbligatorio | OK | presente |
| Add attivita' | indirizzo obbligatorio | GAP | oggi opzionale |
| Add attivita' | almeno una tipologia o default generica | GAP | oggi richiede tipologia ma senza default |
| Recensioni | 4 categorie | OK | presente |
| Recensioni | smile values 1, 3, 5.5, 7.5, 10 | GAP | oggi 1, 3.5, 6, 8, 10 |
| Area privata | tipologie + sicurezza | OK | presente |
| Lingue | IT, ES, EN | GAP | assente |

---

## Fase 0 — Validazione Canonica

### Obiettivo

Bloccare definitivamente la baseline di lavoro per la web app, evitando che vecchie roadmap o vecchie gap analysis vengano trattate come fonte di verita'.

### Decisioni validate

- il documento requisiti e' la fonte primaria
- la roadmap v2 non e' piu' la guida operativa
- la scala smile da adottare e' `1, 3, 5.5, 7.5, 10`
- la remediation va organizzata per priorita' funzionale, non per eredita' delle fasi precedenti

### Deliverable

- questo documento
- eliminazione dei documenti web ridondanti o superati

### Criterio di accettazione

- chi riprende il progetto sa da quali documenti partire
- i gap principali sono elencati in modo verificabile
- le prossime fasi sono ordinate e motivate

---

## Fasi Operative Validate

## Fase 1 — Allineamento Funzionale Critico

**Stato**: completata il 10 aprile 2026

### Scope

- correggere `SMILE_VALUES` ai valori del documento requisiti
- allineare la UX della search Home: Invio deve aprire la lista risultati filtrata
- chiudere il gap sugli ordinamenti core, definendo e implementando almeno `ultimi recensiti`
- agganciare davvero `last_viewed_at` al dettaglio attivita' se manteniamo l'ordinamento `ultimi visti`

### Perche' prima

Questi punti impattano direttamente il comportamento base del prodotto e falsano anche i test successivi su liste e filtri.

### Dipendenze

- nessuna tecnica esterna
- la decisione di Fase 0 sulla baseline requisiti

### Rischi

- se `ultimi recensiti` richiede un dato non disponibile, serve estendere backend payload o query
- cambiando gli smile values, le recensioni gia' salvate con i vecchi step restano storicamente non uniformi

### Accettazione

- i nuovi voti usano `1, 3, 5.5, 7.5, 10`
- premendo Invio nella search della Home si raggiunge una lista filtrata
- gli ordinamenti richiesti sono disponibili o dichiarati con fallback esplicito e coerente

### Implementato

- corretti i valori smile in `web/src/config/scoring.ts`
- pagina risultati dedicata `\/activities` con query iniziale dalla Home map
- submit della search Home collegato alla lista risultati filtrata
- aggiunto ordinamento `Recensiti`
- collegato `last_viewed_at` al dettaglio attivita' tramite endpoint backend esistente
- esposto `latest_reviewed_at` nel payload attivita' per supportare l'ordinamento

## Fase 2 — Filtri Lista Completi

**Stato**: completata il 10 aprile 2026

### Scope

- tipologie multi-select
- filtro punteggio medio min-max
- filtro categorie voto con range
- reset filtri e UX coerente dei controlli

### Perche' qui

Il documento requisiti insiste molto sulla capacita' di filtrare i risultati in base a categorie specifiche; e' una feature distintiva del prodotto, non un dettaglio secondario.

### Dipendenze

- Fase 1 completata

### Rischi

- logica filtro piu' complessa sulla UI
- possibile necessità di refactor del pannello lista per mantenere leggibilita'

### Accettazione

- l'utente puo' combinare tipologie, preferiti, media min-max e categorie voto
- il comportamento e' coerente con il requisito: una attivita' appare se almeno una review per tipologia soddisfa il filtro categorie

### Implementato

- filtro tipologie portato a multi-select
- aggiunto filtro punteggio medio min-max
- aggiunto filtro categorie voto con range condiviso
- aggiunto reset filtri
- esteso il payload attivita' con `review_summaries` minime per valutare i filtri in lista

## Fase 3 — Data Layer e Paginazione Reale

### Scope

- rendere reale la paginazione backend con `offset` e `limit`
- restituire `has_more` corretto
- valutare se spostare parte di sorting/filtering lato server dove conviene

### Perche' qui

Oggi il lazy loading e' solo apparente: il frontend si comporta come paginato, ma il backend restituisce tutto. Questo rischia di degradare appena crescono i dati.

### Dipendenze

- Fase 2 per avere chiaro il perimetro finale di filtri e ordinamenti

### Rischi

- coerenza tra risultati filtrati lato client e lato server
- attenzione a non introdurre regressioni nei preferiti e nelle foto annesse al payload

### Accettazione

- il backend rispetta `offset` e `limit`
- `has_more` e' reale
- il load more carica davvero pagine successive

## Fase 4 — Conformita' UX di Liste, Dettaglio e Form

### Scope

- preview lista allineata ai requisiti con foto e punteggio medio
- media del dettaglio resa cliccabile/espandibile
- validazione add attivita' riallineata al requisito su indirizzo obbligatorio
- definizione e implementazione del fallback tipologia generica, se confermato senza eccezioni

### Perche' qui

Questi sono gap reali ma meno bloccanti dei filtri e del data layer. Hanno senso quando la semantica di liste e punteggi e' gia' stabile.

### Dipendenze

- Fasi 1-3

### Rischi

- il requisito del default generico puo' entrare in tensione con la UX attuale di gestione tipologie manuale

### Accettazione

- le preview lista mostrano le informazioni chiave richieste
- il dettaglio mostra il breakdown punteggi a richiesta
- il form add applica le regole validate in Fase 0

## Fase 5 — i18n

### Scope

- setup IT/ES/EN
- estrazione stringhe UI
- switch lingua nell'area privata
- formattazione locale coerente per date e testi

### Perche' non prima

Farla prima stabilizzerebbe stringhe che nei passaggi 1-4 cambieranno ancora. Conviene farla su una UI piu' ferma.

### Dipendenze

- nessuna forte, ma consigliata dopo Fase 4

### Accettazione

- app utilizzabile in italiano, spagnolo e inglese
- nessuna stringa utente hardcoded residua nei flussi principali

---

## Cosa Manca Nella Vecchia Roadmap v2

La precedente roadmap web non e' solo da superare come priorita'; manca proprio di copertura su alcuni punti chiave o li considera implicitamente gia' risolti quando il codice non lo conferma.

### Gap non coperti o coperti male

1. **Search Home su Invio**  
   La roadmap v2 parla di search UX, ma non blocca come requisito il passaggio alla lista risultati filtrata.

2. **Filtri distintivi del prodotto**  
   Non pianifica in modo esplicito il completamento di:
   - range punteggio medio
   - categorie voto con range
   - tipologie multi-select

3. **Ordinamento ultimi recensiti**  
   Non esiste una fase chiara che chiuda questo requisito.

4. **Tracking reale di ultimi visti**  
   La roadmap da' per scontata la presenza dell'ordinamento, ma non evidenzia che il frontend non aggiorna `last_viewed_at`.

5. **Lazy loading reale backend**  
   La roadmap e lo status parlano di liste paginate, ma il controller oggi restituisce l'intero dataset.

6. **Conformita' preview lista**  
   Non mette a piano la differenza tra preview richiesta dal documento e preview effettivamente renderizzata.

7. **Regole form add attivita'**  
   Non evidenzia il mismatch su indirizzo obbligatorio e fallback tipologia generica.

8. **Dropdown/toggle del punteggio medio nel dettaglio**  
   Non viene trattato come gap, anche se il requisito lo chiede esplicitamente.

### Conseguenza pratica

La roadmap v2 e' utile come storico del redesign UI e di alcune decisioni di fase, ma non e' piu' affidabile come piano di completamento requisiti.

---

## Ordine di esecuzione consigliato

1. Fase 1 — allineamento funzionale critico
2. Fase 2 — filtri lista completi
3. Fase 3 — data layer e paginazione reale
4. Fase 4 — conformita' UX liste/dettaglio/form
5. Fase 5 — i18n

---

## Note operative

- Se emerge un conflitto tra implementazione attuale e requisito, vince il requisito salvo decisione esplicita contraria.
- Ogni fase implementata deve aggiornare questo documento.
- Non reintrodurre documenti paralleli di roadmap o status per la web app senza una ragione forte.