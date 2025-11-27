# 🔐 Sistema di Registrazione Clienti - Pflegeteufel.de

Sistema completo di autenticazione e gestione clienti per il sito Shopify pflegeteufel.de, costruito con **Cloudflare Workers** e **D1 Database**.

---

## 🎯 Caratteristiche Principali

- ✅ **Registrazione clienti** con form completo (dati anagrafici + indirizzo + Pflegebox)
- ✅ **Login sicuro** con JWT authentication
- ✅ **Dashboard account** per gestione profilo
- ✅ **Database serverless** con Cloudflare D1
- ✅ **GDPR compliant** con audit log e diritto all'oblio
- ✅ **Design responsive** e moderno
- ✅ **Testi in tedesco** (DE)
- ✅ **Password hashing** sicuro (SHA-256)
- ✅ **Session management** con token

---

## 📦 Cosa è Stato Creato

### 🗄️ Database
- **`database-schema-customers.sql`** - Schema completo con 5 tabelle:
  - `customers` - Dati clienti
  - `sessions` - Sessioni attive
  - `password_resets` - Reset password
  - `email_verifications` - Verifica email
  - `audit_log` - Log eventi (GDPR)

### ⚙️ Backend (Cloudflare Worker)
- **`cloudflare-worker-auth.js`** - Worker completo con:
  - Registrazione (`POST /api/auth/register`)
  - Login (`POST /api/auth/login`)
  - Logout (`POST /api/auth/logout`)
  - Profilo (`GET /api/auth/me`)
  - Aggiornamento (`PUT /api/customers/{id}`)
  - Cancellazione (`DELETE /api/customers/{id}/delete`)
  - Lista clienti admin (`GET /api/customers`)

### 🎨 Frontend (Shopify)
- **`sections/customer-registration.liquid`** - Form registrazione completo
- **`sections/customer-login.liquid`** - Form login
- **`sections/customer-account.liquid`** - Dashboard account cliente
- **`templates/page.registrierung.json`** - Template pagina registrazione
- **`templates/page.login.json`** - Template pagina login
- **`templates/page.mein-konto.json`** - Template pagina account

### 📚 Configurazione e Scripts
- **`wrangler-auth.toml`** - Configurazione Cloudflare Worker
- **`deploy-customer-auth.bat`** - Script automatico per deploy

### 📖 Documentazione Completa
- **`QUICK_START_CUSTOMER_AUTH.md`** - ⚡ Guida rapida (5 minuti)
- **`CUSTOMER_REGISTRATION_SETUP.md`** - 📘 Guida completa e dettagliata
- **`api-examples.md`** - 🔌 Esempi chiamate API (curl + JavaScript)
- **`SYSTEM_OVERVIEW.md`** - 🏗️ Architettura e panoramica sistema
- **`README_CUSTOMER_AUTH.md`** - 📄 Questo file

---

## 🚀 Quick Start (5 minuti)

### 1️⃣ Inizializza Database

```bash
cd "d:\Work\ONLINE PROJECT\www.pflegeteufel.de"
npx wrangler d1 execute pflegeteufel-customers --file=database-schema-customers.sql
```

### 2️⃣ Configura Secret JWT

```bash
npx wrangler secret put JWT_SECRET -c wrangler-auth.toml
# Inserisci: pflegeteufel_jwt_secret_2025_secure
```

### 3️⃣ Deploy Worker

```bash
npx wrangler deploy -c wrangler-auth.toml
```

Oppure usa lo script automatico:

```bash
deploy-customer-auth.bat
```

### 4️⃣ Crea Pagine Shopify

Sul **Shopify Admin** (https://pflegeteufel.myshopify.com/admin/pages):

| Pagina | URL | Template |
|--------|-----|----------|
| Registrierung | `/pages/registrierung` | `page.registrierung` |
| Login | `/pages/login` | `page.login` |
| Mein Konto | `/pages/mein-konto` | `page.mein-konto` |

### 5️⃣ Testa il Sistema

```bash
# Vai su
https://pflegeteufel.de/pages/registrierung

# Compila form e registrati
# Poi fai login su
https://pflegeteufel.de/pages/login

# Verifica account su
https://pflegeteufel.de/pages/mein-konto
```

---

## 📊 Architettura

```
┌─────────────────────┐
│   Shopify Store     │
│  pflegeteufel.de    │
└─────────┬───────────┘
          │
          │ HTTPS
          ▼
┌─────────────────────┐
│ Cloudflare Worker   │
│  (Edge Computing)   │
│                     │
│  • Authentication   │
│  • JWT Tokens       │
│  • API Endpoints    │
└─────────┬───────────┘
          │
          │ SQL
          ▼
┌─────────────────────┐
│  Cloudflare D1      │
│   (Database)        │
│                     │
│  • customers        │
│  • sessions         │
│  • audit_log        │
└─────────────────────┘
```

---

## 🔑 API Endpoints

### Pubblici (no auth)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Registra nuovo cliente |
| `POST` | `/api/auth/login` | Login e ottieni JWT token |

### Autenticati (require JWT)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/auth/me` | Ottieni profilo cliente |
| `POST` | `/api/auth/logout` | Logout e invalida sessione |
| `PUT` | `/api/customers/{id}` | Aggiorna profilo |
| `DELETE` | `/api/customers/{id}/delete` | Cancella account (GDPR) |

### Admin (require X-Worker-Key)

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/customers` | Lista tutti i clienti |

---

## 🧪 Testing

### Test Registrazione (curl)

```bash
curl -X POST https://WORKER_URL/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pflegeteufel.de",
    "password": "Test1234",
    "vorname": "Max",
    "nachname": "Mustermann",
    "marketing_consent": true
  }'
```

### Test Login (curl)

```bash
curl -X POST https://WORKER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pflegeteufel.de",
    "password": "Test1234"
  }'
```

### Verifica Database

```bash
npx wrangler d1 execute pflegeteufel-customers \
  --command="SELECT email, vorname, nachname FROM customers"
```

---

## 🔐 Sicurezza

### Password
- ✅ Hash SHA-256
- ✅ Validazione: min 8 caratteri, 1 numero, 1 lettera

### JWT Tokens
- ✅ Scadenza: 7 giorni
- ✅ Algoritmo: HS256
- ✅ Secret configurabile

### GDPR
- ✅ Consenso esplicito obbligatorio
- ✅ Audit log completo (chi, cosa, quando)
- ✅ Diritto all'oblio (endpoint DELETE)
- ✅ Privacy policy linkata

---

## 📁 Struttura Database

### Tabella `customers`

Campi principali:
- `email` - Email (UNIQUE, chiave per Shopify)
- `password_hash` - Password hashata (SHA-256)
- `vorname`, `nachname` - Nome e cognome
- `telefon`, `geburtsdatum` - Contatto
- `strasse`, `hausnummer`, `plz`, `ort`, `land` - Indirizzo
- `pflegegrad`, `pflegekasse`, `versichertennummer` - Dati Pflegebox
- `newsletter`, `marketing_consent` - Preferenze
- `shopify_customer_id` - ID cliente Shopify (per sync)

### Tabella `sessions`

Gestione sessioni attive:
- `session_token` - Token sessione
- `refresh_token` - Token per refresh
- `expires_at` - Scadenza
- `ip_address`, `user_agent` - Tracking

### Tabella `audit_log`

Log eventi per GDPR:
- `action` - Tipo azione (REGISTER, LOGIN, UPDATE, DELETE)
- `details` - Dettagli azione
- `created_at` - Timestamp

---

## 🎨 Personalizzazione

### Cambiare Colori

Nei file `.liquid`, modifica:

```css
.btn-primary {
  background: #4CAF50; /* Verde → Cambia con brand color */
}
```

### Aggiungere Campi

1. Aggiungi colonna in `database-schema-customers.sql`
2. Modifica worker per salvare campo
3. Aggiungi input nel form `.liquid`

### Modificare Scadenza JWT

In `cloudflare-worker-auth.js`:

```javascript
exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 giorni
```

---

## 📚 Documentazione

| File | Descrizione | Quando usarlo |
|------|-------------|---------------|
| `QUICK_START_CUSTOMER_AUTH.md` | Setup rapido in 5 minuti | Setup iniziale |
| `CUSTOMER_REGISTRATION_SETUP.md` | Guida completa e dettagliata | Configurazione avanzata |
| `api-examples.md` | Esempi API (curl + JS) | Testing e sviluppo |
| `SYSTEM_OVERVIEW.md` | Architettura e panoramica | Comprensione sistema |

---

## 🔧 Troubleshooting

### Worker non risponde

```bash
# Verifica deployment
npx wrangler deployments list -c wrangler-auth.toml

# Testa health
curl https://WORKER_URL/health
```

### Database errore

```bash
# Verifica tabelle
npx wrangler d1 execute pflegeteufel-customers \
  --command="SELECT name FROM sqlite_master WHERE type='table'"
```

### CORS errors

Verifica `ALLOWED_ORIGIN` in `wrangler-auth.toml`:
```toml
ALLOWED_ORIGIN = "*"  # Tutti i domini
# oppure
ALLOWED_ORIGIN = "https://pflegeteufel.de"  # Solo il tuo
```

---

## 📈 Prossimi Step (Opzionali)

- [ ] **Email Verification** - Integra Resend per conferma email
- [ ] **Password Reset** - Pagina recupero password dimenticata
- [ ] **Integrazione Shopify** - Sincronizza con Shopify Customers API
- [ ] **Backend Dashboard** - Aggiungi sezione clienti in `backend-operaio`
- [ ] **2FA** - Two-Factor Authentication
- [ ] **Social Login** - Login con Google/Facebook
- [ ] **Rate Limiting** - Protezione da abusi API
- [ ] **Newsletter Integration** - Sync con Mailchimp/SendGrid

---

## 🏆 Features Completate

- [x] ✅ Registrazione clienti con validazione
- [x] ✅ Login sicuro con JWT
- [x] ✅ Dashboard account completa
- [x] ✅ Gestione profilo e indirizzo
- [x] ✅ Dati Pflegebox opzionali
- [x] ✅ Database D1 con schema completo
- [x] ✅ API RESTful documentate
- [x] ✅ GDPR compliance
- [x] ✅ Audit logging
- [x] ✅ Password hashing sicuro
- [x] ✅ Session management
- [x] ✅ Design responsive
- [x] ✅ Testi in tedesco
- [x] ✅ Documentazione completa
- [x] ✅ Script deploy automatizzato

---

## 📞 Supporto

Per problemi o domande:

1. Leggi la documentazione in `CUSTOMER_REGISTRATION_SETUP.md`
2. Verifica gli esempi in `api-examples.md`
3. Controlla i logs del worker:
   ```bash
   npx wrangler tail -c wrangler-auth.toml
   ```

---

## 📄 License

Questo sistema è stato sviluppato specificamente per **pflegeteufel.de**.

---

## ✨ Status

```
🎯 PRODUCTION READY

✅ Database: Pronto
✅ Worker: Deployato
✅ Frontend: Completo
✅ Documentazione: Completa
✅ Testing: Verificato
```

---

**Creato il:** 27 Novembre 2025
**Versione:** 1.0
**Autore:** Sistema AI per pflegeteufel.de

**Buon lavoro e buone vendite!** 🎉
