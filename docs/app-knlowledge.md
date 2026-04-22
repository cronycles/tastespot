# TasteSpot — Documento di conoscimento

---

## Cos'è

Web "Mobile First" che consenta agli utenti di valutare le attività di ristorazione (caffè, drink bar, gelaterie, ristoranti, panifici, enoteche, pasticcerie, pizzerie, ecc.), fornendo, se vogliono, valutazioni specifiche delle diverse categorie di voto.


## Descrizione della soluzione

---

## Layout

Una **quicklink bar fissa in basso** sempre visibile con, nell'ordine:
1. Icona pagina **Home**
2. Icona pagina **Preferiti**
3. Icona pagina **Lista Attività** (Vicino a me)
4. Icona pagina **Area Privata Home**


> Ogni recensione è legata a una specifica tipologia. Un'attività con N tipologie assegnate ha fino a N recensioni separate. Il punteggio medio dell'attività è la media di tutte le recensioni per-tipologia.
---

## Pagine

### Prima pagina
Se l'utente non è autenticato → pagina **Login/Registro**  
Se l'utente è autenticato → pagina **Home**

---

### Pagina "Home"
- Mostra a pagina intera la mappa, con in alto in floating la barra di ricerca
- La mappa mostra la zona dove si trova l'utente con le icone delle attività vicine cliccabili (vedi sezione *Icone Attività*)
- Sotto la barra di ricerca ci sono i filtri (vedi sezione *Filtri*)
- In basso al centro: bottone flottante → pagina **Lista Attività** (Vicino a me)
- In basso a destra: bottone flottante con **"+"** → pagina **Aggiungi nuova attività**
- Tenendo premuto su un punto vuoto della mappa → popup che chiede se aggiungere una nuova attività → pagina **Aggiungi nuova attività** (pre-compilato solo l'indirizzo)
- Tenendo premuto su un punto con icona attività OSM → popup → pagina **Aggiungi nuova attività** con nome, indirizzo e telefono già pre-compilati dai dati della mappa

#### Funzionalità barra di ricerca
La barra di ricerca permette di cercare:
- Attività salvate dall'utente (per nome, tag, indirizzo)
- Un indirizzo o località

Mentre si scrive (almeno 3 lettere), la barra dà suggerimenti sia sugli indirizzi (Nominatim) sia sulle attività salvate.

- Click su un'**attività suggerita** → pagina **Dettaglio Attività**
- Click su un **indirizzo suggerito** → mappa si sposta all'indirizzo mantenendo le attività visibili
- Premi **Invio** su una parola → pagina **Lista Attività** con attività filtrate per nome, tag o indirizzo corrispondente

---

### Pagina "Lista Attività"

Pagina generica per elenchi verticali (Preferiti, Vicino a me, risultati ricerca):

- Elenco verticale di **preview attività (verticale)** ordinate secondo la logica di *Ordinamento*
- Barra in alto con icone per ordinare (vedi sezione *Ordinamento*)
- Barra in alto con possibilità di filtrare (vedi sezione *Filtri*)

---

### Pagina "Dettaglio Attività"

In alto, occupando quasi metà pagina: **foto** scorribili, cliccabili per aprire la **gallery**:
- Gallery: foto in primo piano con sfondo nero, scorribili
- In landscape, le foto si scorrono con il telefono in orizzontale

Sotto alle foto, nell'ordine:
- **Punteggio medio** con icona: se cliccata mostra un dropdown con la media per categoria di voto
- **Nome attività** (modificabile, obbligatorio)
- **Indirizzo** (modificabile)
- **Icone tipologie** assegnate (modificabili, almeno una obbligatoria)
- Lista orizzontale di icone:
  - Preferiti
  - Note generiche (modificabili)
  - Tags (modificabili)
  - Indicazioni: link a Google Maps con l'indirizzo; se non c'è indirizzo il bottone non è attivo
- **Telefono** con bottone chiama (modificabile); se non c'è numero il bottone non è attivo
- **Sezione recensione** (vedi sotto)
- Bottone **Elimina attività**

#### Sezione recensione nel dettaglio

Ogni tipologia assegnata all'attività ha la **propria recensione separata** (es. un'attività con "gelateria" e "bar aperitivi" ha due recensioni indipendenti). Per ogni tipologia si vede:
- Se **non è stata fatta** la recensione per quella tipologia: bottone "Aggiungi recensione — [Nome Tipologia]" → pagina **Recensione Attività** con la tipologia pre-selezionata
- Se **è già stata fatta**, si vede:
  - Il punteggio per quella tipologia con dropdown delle categorie
  - Data di creazione della recensione
  - Note di recensione
  - Possibilità di modificare (va alla pagina **Recensione Attività** con la tipologia pre-selezionata)
  - Se modificata: viene mostrata anche la data di modifica

Il **punteggio medio generale** mostrato sopra al nome è la media di tutte le recensioni per-tipologia dell'attività.

---

### Pagina "Login/Registro"
- Login: email + password 
- Registro: email + password → signUp + login automatico

---

### Pagina "Aggiungi nuova Attività"

Raggiungibile da:
- Bottone "+"
- Long-press sulla mappa

Se long-press su punto con dati OSM → pre-compila nome, indirizzo, telefono.  
Se long-press su punto vuoto → pre-compila solo l'indirizzo.

Campi del formulario:
- **Nome attività** (obbligatorio)
- **Indirizzo** (obbligatorio)
- **Tipologie** (almeno una obbligatoria — se non assegnata, di default si assegna una tipologia generica)
- Lista icone orizzontale:
  - Preferiti
  - Note generiche
  - Tags
- **Telefono**
- Link/bottone per andare alla pagina **Recensione Attività** per fare subito la recensione

---

### Pagina "Recensione Attività"

La pagina riceve come parametro la **tipologia da recensire** (ogni tipologia dell'attività viene recensita separatamente). Il titolo della pagina mostra il nome della tipologia.

Lista di **4 categorie** con voto a smile:
- Location
- Cibo
- Servizio
- Conto (qualità prezzo)

Il voto è a **5 smile**: 😞 😕 😐 🙂 😛 → valori: 1, 3, 5.5, 7.5, 10

Campi aggiuntivi (non obbligatori):
- Costo approssimativo per persona
- Cosa ti è piaciuto
- Cosa non ti è piaciuto
- Note aggiuntive

Se l'utente aveva già fatto la recensione per quella tipologia: può modificare tutto; nella pagina verranno mostrate sia la data di prima creazione che la data di ultima modifica.

---

## Icone Attività (marker sulla mappa)

- Cliccabili → aprono la pagina **Dettaglio Attività**
- Appaiono **solo** se l'utente ha aggiunto quell'attività (non le icone OSM native)
- Se l'attività ha **una sola tipologia assegnata** (recensita o no) → appare l'icona di quella tipologia
- Se l'attività ha **più tipologie assegnate** → appare un'icona "multi tipologia" generica (`apps-outline`)
- Dimensioni e stile simili alle icone di Google Maps (leggermente più grandi delle icone standard OSM)

---

## Filtri

Nelle pagine con elenco attività:

- **Filtro tipologie**: selezione di una o più tipologie
- **Filtro punteggio medio**: range min-max (calcolato sulla media di tutti i voti per-tipologia)
- **Filtro categorie di voto**: selezione di una o più categorie + range (applicato sulle singole recensioni per-tipologia, quindi l'attività appare se ALMENO UNA sua recensione soddisfa la condizione)
- **Filtro preferiti**: mostra solo i preferiti

---

## Ordinamento liste attività

Icone in barra che permettono di ordinare (con toggle asc/desc):

1. **Più vicini** all'utente (o viceversa)
2. **Ultimi visti** (o viceversa)
3. **Ultimi recensiti** (o viceversa)
4. **Alfabetico A→Z** (o viceversa)

Ordine di fallback (default):
1. Più vicini → se non si conosce la posizione →
2. Ultimi visti → se non c'è nessun "ultimo visto" →
3. Ultimi recensiti → se non c'è nessuna recensione →
4. Alfabetico

---

## Preview Attività

### Preview orizzontale (lista orizzontale)
- Scheda rettangolare con lati corti in alto e in basso
- Metà superiore: foto principale
- Metà inferiore: nome attività + punteggio medio
- In alto a destra della foto: icona Preferiti
- Completamente cliccabile → pagina Dettaglio Attività (icona preferiti fa solo toggle)

### Preview verticale (lista verticale)
- Scheda rettangolare a larghezza piena
- Parte superiore (>2/3): foto a destra, nome + punteggio medio a sinistra
- Parte inferiore (<1/3): icona Preferiti
- Completamente cliccabile → pagina Dettaglio Attività (icona preferiti fa solo toggle)

---

## Icona Preferiti
- Cuoricino con solo bordo → non in preferiti
- Cuoricino rosso pieno → in preferiti
- Click → toggle

---

## Area Privata

### Pagina "Area Privata Home"
- Email dell'utente in alto
- Link alle sezioni dell'area privata

### Pagina "Sicurezza"
- Cambio password

### Pagina "Tipologie"
- Crea, modifica, elimina tipologie
- Campi: nome (obbligatorio), descrizione (facoltativa), icona (da elenco finito, default generica)
- Eliminazione: avvisa che si rimuovono le associazioni → conferma/annulla

---

## Chiarimenti

- Se la web non riesce a geolocalizzare l'utente → mappa su **Genova** di default
- Lingue: **italiano** (default), **spagnolo**, **inglese**
- Messaggi di errore chiari per l'utente in caso di problemi

---

## Specifiche Tecniche

- Mappe: open source / gratuite (zero costo per uso)
- Nessuna libreria di terzi a pagamento / con limiti di uso
- Framework: React Native con TypeScript
- Deploy: iOS e Android
- Lazy loading per tutte le liste
- Registrazione errori tramite log per il programmatore
- End of line: LF
- No metodi statici salvo necessità
- Commenti solo se il codice non si capisce da solo — se si mettono, devono essere in inglese
- Stile LEAN e Clean Code
