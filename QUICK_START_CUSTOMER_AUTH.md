# 🚀 Quick Start - Sistema Registrazione Clienti

Guida rapida per attivare il sistema di registrazione clienti su pflegeteufel.de.

---

## 📁 File Creati

### Database
- ✅ `database-schema-customers.sql` - Schema database completo

### Backend (Cloudflare Worker)
- ✅ `cloudflare-worker-auth.js` - Worker autenticazione e API

### Frontend (Shopify)
- ✅ `sections/customer-registration.liquid` - Form registrazione
- ✅ `sections/customer-login.liquid` - Form login
- ✅ `sections/customer-account.liquid` - Dashboard account cliente
- ✅ `templates/page.registrierung.json` - Template pagina registrazione
- ✅ `templates/page.login.json` - Template pagina login
- ✅ `templates/page.mein-konto.json` - Template pagina account

### Documentazione
- ✅ `CUSTOMER_REGISTRATION_SETUP.md` - Guida completa
- ✅ `QUICK_START_CUSTOMER_AUTH.md` - Questa guida

---

## ⚡ Setup in 5 Minuti

### 1. Inizializza Database (1 minuto)

```bash
cd "d:\Work\ONLINE PROJECT\www.pflegeteufel.de"

# Applica schema al database esistente
npx wrangler d1 execute pflegeteufel-customers --file=database-schema-customers.sql
```

### 2. Configura Secrets (1 minuto)

Il database è già configurato in `wrangler.toml`. Devi solo configurare i secrets:

```bash
# Secret JWT per token
npx wrangler secret put JWT_SECRET
# Inserisci: pflegeteufel_jwt_secret_2025_secure

# Secret per proteggere API admin (opzionale, già configurato)
# npx wrangler secret put WORKER_SHARED_KEY
# Valore già presente: felix_backend_2025
```

### 3. Deploy Worker (1 minuto)

**Opzione A: Aggiorna Worker Esistente**

Copia gli endpoint di autenticazione da `cloudflare-worker-auth.js` in `cloudflare-worker-pdf-template.js`.

**Opzione B: Deploy Worker Separato (Consigliato)**

```bash
# Crea wrangler-auth.toml (vedi sotto)
# Poi deploy
npx wrangler deploy -c wrangler-auth.toml
```

**File `wrangler-auth.toml`:**
```toml
name = "pflegeteufel-auth"
main = "cloudflare-worker-auth.js"
compatibility_date = "2024-01-01"
node_compat = true

[vars]
ALLOWED_ORIGIN = "*"

[[d1_databases]]
binding = "CUSTOMERS_DB"
database_name = "pflegeteufel-customers"
database_id = "baaad9c0-081f-4377-a313-0ce75d5e5bc1"
```

### 4. Crea Pagine Shopify (2 minuti)

Sul **Shopify Admin** (https://pflegeteufel.myshopify.com/admin/pages):

1. **Registrierung**
   - Title: `Registrierung`
   - URL: `registrierung`
   - Template: `page.registrierung`

2. **Login**
   - Title: `Login`
   - URL: `login`
   - Template: `page.login`

3. **Mein Konto**
   - Title: `Mein Konto`
   - URL: `mein-konto`
   - Template: `page.mein-konto`

### 5. Aggiorna Worker URL (30 secondi)

Se hai deployato un worker separato, aggiorna l'URL nelle sections:

Vai su **Shopify Admin > Online Store > Themes > Customize**

Per ogni pagina (registrierung, login, mein-konto):
- Click sulla section
- Settings > Worker URL
- Inserisci: `https://pflegeteufel-auth.TUOACCOUNT.workers.dev`

---

## ✅ Test Rapido

### 1. Test Registrazione

```bash
# URL
https://pflegeteufel.de/pages/registrierung

# Compila:
- Email: test@pflegeteufel.de
- Password: Test1234
- Nome: Max
- Cognome: Mustermann
- Accetta privacy

# Click "Konto erstellen"
# Dovresti vedere: "Registrierung erfolgreich!"
```

### 2. Test Login

```bash
# URL
https://pflegeteufel.de/pages/login

# Credenziali:
- Email: test@pflegeteufel.de
- Password: Test1234

# Click "Anmelden"
# Redirect a: /pages/mein-konto
```

### 3. Verifica Database

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT email, vorname, nachname FROM customers"

# Output:
# email                  | vorname | nachname
# test@pflegeteufel.de   | Max     | Mustermann
```

---

## 🔑 API Endpoints Principali

### Registrazione
```bash
POST https://WORKER_URL/api/auth/register
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "SecurePass123",
  "vorname": "Max",
  "nachname": "Mustermann",
  "marketing_consent": true
}
```

### Login
```bash
POST https://WORKER_URL/api/auth/login
Content-Type: application/json

{
  "email": "cliente@example.com",
  "password": "SecurePass123"
}
```

### Profilo Cliente
```bash
GET https://WORKER_URL/api/auth/me
Authorization: Bearer <JWT_TOKEN>
```

### Lista Clienti (Admin)
```bash
GET https://WORKER_URL/api/customers
X-Worker-Key: felix_backend_2025
```

---

## 🎯 Funzionalità Implementate

- ✅ Registrazione clienti con validazione
- ✅ Login con JWT authentication
- ✅ Dashboard account cliente
- ✅ Modifica profilo
- ✅ Gestione indirizzo
- ✅ Dati Pflegebox (opzionali)
- ✅ Newsletter opt-in
- ✅ Logout
- ✅ Cancellazione account (GDPR)
- ✅ Audit log per compliance
- ✅ Password hashing sicuro (SHA-256)
- ✅ Session management
- ✅ CORS configurato
- ✅ Design responsive

---

## 🔐 Sicurezza

- **Password**: Hashate con SHA-256
- **JWT**: Scadenza 7 giorni, firmati con secret
- **Sessions**: Salvate in database con IP e User-Agent
- **GDPR**: Audit log + diritto all'oblio
- **CORS**: Configurabile via `ALLOWED_ORIGIN`

---

## 📊 Schema Database

```
customers
├─ id (PK)
├─ email (UNIQUE)
├─ password_hash
├─ vorname, nachname
├─ telefon, geburtsdatum
├─ strasse, hausnummer, plz, ort, land
├─ pflegegrad, pflegekasse, versichertennummer
├─ newsletter, marketing_consent
├─ shopify_customer_id
├─ is_verified, is_active
└─ created_at, updated_at, last_login

sessions
├─ id (PK)
├─ customer_id (FK)
├─ session_token (UNIQUE)
├─ refresh_token (UNIQUE)
├─ expires_at
└─ ip_address, user_agent

audit_log
├─ id (PK)
├─ customer_id (FK)
├─ action
├─ details
└─ ip_address, user_agent, created_at
```

---

## 🚨 Troubleshooting

### Worker non risponde

```bash
# Verifica deployment
npx wrangler deployments list

# Testa health check
curl https://WORKER_URL/health
```

### Database non accessibile

```bash
# Verifica binding in wrangler.toml
npx wrangler d1 list

# Testa query
npx wrangler d1 execute pflegeteufel-customers --command="SELECT COUNT(*) FROM customers"
```

### CORS errors

Verifica che `ALLOWED_ORIGIN` in `wrangler.toml` sia:
- `*` per tutti i domini
- `https://pflegeteufel.de` per dominio specifico

---

## 📱 Prossimi Step (Opzionali)

1. **Email Verification**: Integra Resend per email di conferma
2. **Password Reset**: Pagina recupero password
3. **Integrazione Shopify**: Sincronizza con Shopify Customers API
4. **Backend Dashboard**: Aggiungi sezione clienti in `backend-operaio`
5. **2FA**: Autenticazione a due fattori
6. **Social Login**: Login con Google/Facebook

---

## 📞 Link Utili

- **Documentazione completa**: `CUSTOMER_REGISTRATION_SETUP.md`
- **Schema database**: `database-schema-customers.sql`
- **Worker source**: `cloudflare-worker-auth.js`
- **Cloudflare Dashboard**: https://dash.cloudflare.com
- **Shopify Admin**: https://pflegeteufel.myshopify.com/admin

---

## ✨ Sistema Pronto!

Dopo aver completato i 5 step sopra, il sistema è completamente funzionale:

- ✅ I clienti possono registrarsi su `/pages/registrierung`
- ✅ I clienti possono fare login su `/pages/login`
- ✅ I clienti possono gestire il profilo su `/pages/mein-konto`
- ✅ Tutti i dati sono salvati in modo sicuro su Cloudflare D1
- ✅ Sistema GDPR compliant con audit log

**Buon lavoro!** 🎉
