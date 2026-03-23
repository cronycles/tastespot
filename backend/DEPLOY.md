# Deploy TasteSpot API — SupportHost (cPanel)

## Stato checklist infrastruttura

- [x] Sottodominio `tastespot.crointhemorning.com` → document root `/home/crointhe/public_html/tastespot/public`
- [x] Database MySQL `crointhe_tastespot` + utente `crointhe_ts`
- [x] PHP 8.2+ nel MultiPHP Manager
- [ ] SSH abilitato (Step 0 — vedi sotto)
- [ ] Laravel installato (Step A)
- [ ] File backend copiati (Step B)
- [ ] Migrazione database (Step C)
- [ ] Verifica (Step D)

---

## Step 0 — Abilita SSH in cPanel

1. Accedi a cPanel → cerca **"SSH Access"** nella barra di ricerca
2. Clicca **Manage SSH Keys**
3. Clicca **Generate a New Key**
   - Key Name: `id_rsa` (lascia invariato)
   - Passphrase: puoi lasciare vuoto (meno sicuro ma più comodo)
   - Clicca **Generate Key**
4. Torna alla lista chiavi → accanto a `id_rsa` clicca **Manage** → **Authorize**
5. Clicca **View/Download** sulla chiave **privata** (`id_rsa`) → copia tutto il testo
6. Sul tuo Mac, apri il Terminale:

```bash
# Crea la cartella .ssh se non esiste
mkdir -p ~/.ssh

# Crea il file della chiave privata e incolla il contenuto
nano ~/.ssh/id_rsa_supporthost
# (incolla il testo copiato al punto 5, poi Ctrl+X, Y, Invio)

# Imposta i permessi giusti
chmod 600 ~/.ssh/id_rsa_supporthost

# Testa la connessione
ssh -i ~/.ssh/id_rsa_supporthost crointhe@crointhemorning.com
```

Se funziona, vedrai qualcosa come `[crointhe@server ~]$` — sei dentro!

---

## Step A — Installa Laravel via SSH

```bash
# Dentro la sessione SSH:
cd /home/crointhe/public_html

# Controlla che PHP sia giusto
php -v    # deve essere 8.2 o superiore

# Installa Composer se non disponibile globalmente
curl -sS https://getcomposer.org/installer | php
mkdir -p ~/bin
mv composer.phar ~/bin/composer
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
composer --version    # deve mostrare una versione

# Crea il progetto Laravel (ci vuole 2-5 minuti)
composer create-project laravel/laravel tastespot
```

---

## Step B — Copia i file del backend

Dal tuo **Mac** (apri una nuova finestra del Terminale — non chiudere quella SSH):

```bash
cd /Users/cronycles/workspace/TasteSpot/backend

# File di configurazione
scp -i ~/.ssh/id_rsa_supporthost .env \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/

scp -i ~/.ssh/id_rsa_supporthost bootstrap/app.php \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/bootstrap/

scp -i ~/.ssh/id_rsa_supporthost routes/api.php \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/routes/

# Models
scp -i ~/.ssh/id_rsa_supporthost app/Models/*.php \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/app/Models/

# Controllers (crea prima la cartella Api)
ssh -i ~/.ssh/id_rsa_supporthost crointhe@crointhemorning.com \
    "mkdir -p /home/crointhe/public_html/tastespot/app/Http/Controllers/Api"

scp -i ~/.ssh/id_rsa_supporthost app/Http/Controllers/Api/*.php \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/app/Http/Controllers/Api/

# Migrations
scp -i ~/.ssh/id_rsa_supporthost database/migrations/2024_*.php \
    crointhe@crointhemorning.com:/home/crointhe/public_html/tastespot/database/migrations/
```

---

## Step C — Configura e migra il database

Torna alla finestra SSH:

```bash
cd /home/crointhe/public_html/tastespot

# Genera la APP_KEY (obbligatorio, aggiorna il .env automaticamente)
php artisan key:generate

# Esegui tutte le migrations (crea le tabelle nel DB)
php artisan migrate

# Crea il symlink per le foto pubbliche
php artisan storage:link

# Imposta i permessi corretti
chmod -R 755 storage
chmod -R 755 bootstrap/cache
```

---

## Step D — Verifica

Apri nel browser:

```
https://tastespot.crointhemorning.com/api/v1/auth/login
```

Dovresti vedere una risposta JSON tipo:
```json
{"message": "The email field is required.", "errors": {...}}
```

Questo significa che il server risponde correttamente ✅

Per testare il register, usa **curl** dal Mac:
```bash
curl -X POST https://tastespot.crointhemorning.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","password":"password","password_confirmation":"password"}'
```

Risposta attesa: `{"token":"...","user":{"id":1,"email":"test@test.com","name":"Test"}}`

---

## Troubleshooting

### 500 Internal Server Error
```bash
# Controlla il log degli errori Laravel
tail -50 /home/crointhe/public_html/tastespot/storage/logs/laravel.log
```

### "could not find driver" (PHP MySQL)
- cPanel → **Select PHP Extensions** → abilitare `mysqli` e `pdo_mysql`

### Le foto non si caricano / URL rotto
```bash
# Verifica che il symlink esista
ls -la /home/crointhe/public_html/tastespot/public/storage
# Deve mostrare: storage -> /home/crointhe/public_html/tastespot/storage/app/public
# Se non c'è: php artisan storage:link
```

### "Class not found" dopo aver copiato i file
```bash
php artisan config:clear
php artisan cache:clear
composer dump-autoload
```

---

## Struttura API

Base URL: `https://tastespot.crointhemorning.com/api/v1`

| Metodo | Endpoint | Auth | Descrizione |
|--------|----------|------|-------------|
| POST | `/auth/register` | No | Registrazione |
| POST | `/auth/login` | No | Login, ritorna token |
| POST | `/auth/logout` | Sì | Logout |
| GET | `/auth/me` | Sì | Utente corrente |
| GET | `/types` | Sì | Lista tipologie |
| POST | `/types` | Sì | Crea tipologia |
| PUT | `/types/{id}` | Sì | Aggiorna tipologia |
| DELETE | `/types/{id}` | Sì | Elimina tipologia |
| POST | `/types/reorder` | Sì | Riordina tipologie |
| GET | `/activities` | Sì | Lista attività (con type_ids, is_favorite, photos) |
| POST | `/activities` | Sì | Crea attività |
| GET | `/activities/{id}` | Sì | Dettaglio attività |
| PUT | `/activities/{id}` | Sì | Aggiorna attività |
| DELETE | `/activities/{id}` | Sì | Elimina attività |
| POST | `/activities/{id}/favorite` | Sì | Toggle preferito |
| PUT | `/activities/{id}/viewed` | Sì | Aggiorna last_viewed_at |
| GET | `/activities/{id}/reviews` | Sì | Recensioni di un'attività |
| POST | `/reviews` | Sì | Crea/aggiorna recensione (upsert) |
| POST | `/activities/{id}/photos` | Sì | Carica foto (multipart/form-data) |
| DELETE | `/photos/{id}` | Sì | Elimina foto |

**Header per route protette:**
```
Authorization: Bearer {token}
Content-Type: application/json
```
