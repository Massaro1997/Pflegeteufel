# 🔐 Sistema di Registrazione Clienti - Guida Completa

Sistema completo di registrazione, autenticazione e gestione clienti per **pflegeteufel.de** usando Cloudflare Workers + D1 Database.

---

## 📦 File Creati

### 1. Database Schema
- **`database-schema-customers.sql`** - Schema completo del database D1

### 2. Cloudflare Worker
- **`cloudflare-worker-auth.js`** - Worker per autenticazione e gestione clienti

### 3. Shopify Sections
- **`sections/customer-registration.liquid`** - Sezione form registrazione
- **`sections/customer-login.liquid`** - Sezione form login
- **`sections/customer-account.liquid`** - Sezione account cliente (dashboard)

### 4. Shopify Templates
- **`templates/page.registrierung.json`** - Template pagina registrazione
- **`templates/page.login.json`** - Template pagina login
- **`templates/page.mein-konto.json`** - Template pagina account cliente

---

## 🚀 Installazione e Configurazione

### STEP 1: Creare Database D1 su Cloudflare

```bash
# Entra nella directory del progetto
cd "d:\Work\ONLINE PROJECT\www.pflegeteufel.de"

# Crea il database D1 (se non esiste già)
npx wrangler d1 create pflegeteufel-customers

# Output esempio:
# ✅ Successfully created DB 'pflegeteufel-customers'!
# Database ID: 12345678-abcd-1234-abcd-123456789abc
```

**Verifica che il database ID in `wrangler.toml` corrisponda:**

Il file `wrangler.toml` ha già questa configurazione:
```toml
[[d1_databases]]
binding = "CUSTOMERS_DB"
database_name = "pflegeteufel-customers"
database_id = "baaad9c0-081f-4377-a313-0ce75d5e5bc1"
```

Se l'ID è diverso, aggiornalo con l'ID ottenuto dal comando precedente.

---

### STEP 2: Inizializzare il Database con lo Schema

```bash
# Applica lo schema al database D1
npx wrangler d1 execute pflegeteufel-customers --file=database-schema-customers.sql

# Output:
# 🌀 Executing on pflegeteufel-customers:
# ✅ Successfully executed SQL
```

**Verifica che le tabelle siano state create:**

```bash
# Lista tutte le tabelle
npx wrangler d1 execute pflegeteufel-customers --command="SELECT name FROM sqlite_master WHERE type='table'"

# Output dovrebbe mostrare:
# - customers
# - sessions
# - password_resets
# - email_verifications
# - audit_log
```

---

### STEP 3: Configurare il Worker per l'Autenticazione

#### Opzione A: Modificare il Worker Esistente

Se vuoi mantenere il worker esistente (`cloudflare-worker-pdf-template.js`) e aggiungere le funzionalità di autenticazione:

1. **Copia il contenuto** di `cloudflare-worker-auth.js`
2. **Integra** le route di autenticazione nel worker esistente
3. **Mantieni** le route esistenti per Pflegebox

#### Opzione B: Creare un Nuovo Worker (CONSIGLIATO)

Crea un worker separato dedicato all'autenticazione:

```bash
# Crea nuovo file wrangler per il worker auth
# wrangler-auth.toml
```

**Contenuto di `wrangler-auth.toml`:**

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

# Secrets da configurare:
# - WORKER_SHARED_KEY
# - JWT_SECRET
# - RESEND_API_KEY (opzionale per email)
```

**Configura i secrets:**

```bash
# Secret per proteggere le API admin
npx wrangler secret put WORKER_SHARED_KEY -c wrangler-auth.toml
# Inserisci: felix_backend_2025

# Secret per JWT
npx wrangler secret put JWT_SECRET -c wrangler-auth.toml
# Inserisci una stringa casuale sicura: pflegeteufel_jwt_secret_2025_X7Kp9mN2qR5tY8w

# (Opzionale) API key per invio email
npx wrangler secret put RESEND_API_KEY -c wrangler-auth.toml
# Inserisci la tua API key di Resend
```

---

### STEP 4: Deploy del Worker

```bash
# Deploy del worker autenticazione
npx wrangler deploy -c wrangler-auth.toml

# Output:
# ✨ Deployed pflegeteufel-auth
# 🌎 https://pflegeteufel-auth.massarocalogero1997.workers.dev
```

**IMPORTANTE:** Aggiorna l'URL del worker in tutti i template Shopify:

Nei file:
- `sections/customer-registration.liquid`
- `sections/customer-login.liquid`
- `sections/customer-account.liquid`

Modifica il setting `worker_url` con l'URL del tuo worker:
```
https://pflegeteufel-auth.massarocalogero1997.workers.dev
```

---

### STEP 5: Creare le Pagine Shopify

Sul **Shopify Admin** (https://pflegeteufel.myshopify.com/admin):

#### 1. Pagina Registrazione
1. Vai su **Online Store > Pages**
2. Click **Add page**
3. **Title:** `Registrierung`
4. **URL handle:** `registrierung`
5. **Template:** Seleziona `page.registrierung`
6. **Save**

#### 2. Pagina Login
1. Vai su **Online Store > Pages**
2. Click **Add page**
3. **Title:** `Login`
4. **URL handle:** `login`
5. **Template:** Seleziona `page.login`
6. **Save**

#### 3. Pagina Account Cliente
1. Vai su **Online Store > Pages**
2. Click **Add page**
3. **Title:** `Mein Konto`
4. **URL handle:** `mein-konto`
5. **Template:** Seleziona `page.mein-konto`
6. **Save**

---

### STEP 6: Aggiungere Link nel Menu

Sul **Shopify Admin**:

1. Vai su **Online Store > Navigation**
2. Seleziona il menu principale (es. **Main menu**)
3. Aggiungi questi link:
   - **Registrierung** → `/pages/registrierung`
   - **Login** → `/pages/login`
   - **Mein Konto** → `/pages/mein-konto`

---

## 🧪 Testing del Sistema

### Test 1: Registrazione Cliente

1. Vai su `https://pflegeteufel.de/pages/registrierung`
2. Compila tutti i campi obbligatori:
   - Anrede: Herr/Frau
   - Vorname: Max
   - Nachname: Mustermann
   - Email: max@example.com
   - Password: Test1234
   - Accetta privacy
3. Click **"Konto erstellen"**
4. Dovresti vedere messaggio di successo
5. Redirect automatico a `/pages/login`

**Verifica nel database:**

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT id, email, vorname, nachname, created_at FROM customers"

# Output dovrebbe mostrare il cliente registrato
```

### Test 2: Login Cliente

1. Vai su `https://pflegeteufel.de/pages/login`
2. Inserisci credenziali:
   - Email: max@example.com
   - Password: Test1234
3. Click **"Anmelden"**
4. Dovresti essere reindirizzato a `/pages/mein-konto`

**Verifica nel browser console:**

```javascript
// Apri Developer Tools > Console
localStorage.getItem('auth_token')
// Dovresti vedere il JWT token
```

### Test 3: Account Dashboard

1. Dopo login, vai su `/pages/mein-konto`
2. Dovresti vedere:
   - Nome del cliente: "Willkommen, Max!"
   - Email visualizzata
   - Form con tutti i dati compilati
3. Modifica un campo (es. telefono)
4. Click **"Änderungen speichern"**
5. Dovresti vedere messaggio "Profil erfolgreich aktualisiert!"

### Test 4: Logout

1. Nella pagina account, click **"Abmelden"**
2. Dovresti essere reindirizzato a `/pages/login`
3. localStorage dovrebbe essere pulito

**Verifica:**
```javascript
localStorage.getItem('auth_token')
// Dovrebbe essere null
```

---

## 🔒 API Endpoints Disponibili

Il worker `cloudflare-worker-auth.js` espone questi endpoint:

### Autenticazione

#### POST `/api/auth/register`
Registra un nuovo cliente.

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "SecurePass123",
  "anrede": "Herr",
  "vorname": "Max",
  "nachname": "Mustermann",
  "telefon": "+49123456789",
  "strasse": "Hauptstraße",
  "hausnummer": "123",
  "plz": "50667",
  "ort": "Köln",
  "land": "Germany",
  "marketing_consent": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registrierung erfolgreich!",
  "customerId": 1
}
```

---

#### POST `/api/auth/login`
Login cliente.

**Body:**
```json
{
  "email": "cliente@example.com",
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "sessionToken": "abc123...",
  "refreshToken": "def456...",
  "customer": {
    "id": 1,
    "email": "cliente@example.com",
    "vorname": "Max",
    "nachname": "Mustermann"
  }
}
```

---

#### POST `/api/auth/logout`
Logout cliente.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "sessionToken": "abc123..."
}
```

---

#### GET `/api/auth/me`
Ottieni profilo cliente autenticato.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "customer": {
    "id": 1,
    "email": "cliente@example.com",
    "vorname": "Max",
    "nachname": "Mustermann",
    "telefon": "+49123456789",
    "strasse": "Hauptstraße",
    "hausnummer": "123",
    "plz": "50667",
    "ort": "Köln",
    "pflegegrad": 3,
    "pflegekasse": "AOK"
  }
}
```

---

### Gestione Clienti

#### PUT `/api/customers/{id}`
Aggiorna profilo cliente (solo cliente stesso).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Body:**
```json
{
  "vorname": "Maximilian",
  "telefon": "+49987654321"
}
```

---

#### GET `/api/customers` (Admin only)
Lista tutti i clienti.

**Headers:**
```
X-Worker-Key: felix_backend_2025
```

**Query params:**
```
?search=Max
```

**Response:**
```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "email": "max@example.com",
      "vorname": "Max",
      "nachname": "Mustermann"
    }
  ]
}
```

---

#### DELETE `/api/customers/{id}/delete`
Cancella account cliente (GDPR).

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

## 🔐 Sicurezza

### Password Hashing
Le password sono hashate con **SHA-256** usando Web Crypto API.

### JWT Tokens
- Scadenza: **7 giorni**
- Firmati con secret `JWT_SECRET`
- Algoritmo: **HS256**

### Session Management
- Ogni login crea una sessione nel database
- Session token salvato in localStorage
- Refresh token per rinnovo automatico

### GDPR Compliance
- **Audit log**: Tutte le azioni sono registrate
- **Consenso esplicito**: Checkbox obbligatoria
- **Diritto all'oblio**: Endpoint DELETE per cancellare account
- **Trasparenza**: Privacy policy linkata

---

## 🎨 Personalizzazione

### Modificare i Colori

Nei file `.liquid`, modifica le variabili CSS:

```css
.btn-primary {
  background: #4CAF50; /* Verde -> Cambia con il tuo colore */
}

.form-input:focus {
  border-color: #4CAF50; /* Verde -> Cambia con il tuo colore */
}
```

### Aggiungere Campi Custom

1. **Aggiungi colonna al database:**

```sql
ALTER TABLE customers ADD COLUMN custom_field TEXT;
```

2. **Aggiungi campo al form** in `customer-registration.liquid`:

```html
<div class="form-group">
  <label for="custom-field">Custom Field</label>
  <input type="text" id="custom-field" name="custom_field" class="form-input">
</div>
```

3. **Aggiorna il worker** per salvare il campo.

---

## 📊 Dashboard Backend Admin

Per integrare i clienti registrati nel backend esistente:

### Aggiornare `page.backend-operaio.liquid`

Aggiungi una nuova sezione "Clienti":

```javascript
// Carica clienti registrati
async function loadCustomers() {
  const response = await fetch('https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers', {
    headers: {
      'X-Worker-Key': 'felix_backend_2025'
    }
  });

  const result = await response.json();
  const customers = result.customers;

  // Render tabella
  const html = customers.map(c => `
    <tr>
      <td>${c.id}</td>
      <td>${c.vorname} ${c.nachname}</td>
      <td>${c.email}</td>
      <td>${c.ort || '-'}</td>
      <td>${c.pflegegrad || '-'}</td>
      <td>${c.created_at}</td>
    </tr>
  `).join('');

  document.getElementById('customers-table-body').innerHTML = html;
}
```

---

## 🐛 Troubleshooting

### Problema: "Nicht autorisiert"

**Causa:** JWT token scaduto o non valido

**Soluzione:**
```javascript
// Cancella localStorage e riprova login
localStorage.clear();
window.location.href = '/pages/login';
```

---

### Problema: "Diese E-Mail ist bereits registriert"

**Causa:** Cliente già esistente nel database

**Soluzione:**
1. Usa un'altra email
2. Oppure vai direttamente a login
3. Se hai dimenticato la password, usa il reset (da implementare)

---

### Problema: "E-Mail oder Passwort falsch"

**Causa:** Credenziali sbagliate

**Verifica nel database:**
```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT email, is_active FROM customers WHERE email='max@example.com'"
```

---

### Problema: Worker non risponde

**Verifica deployment:**
```bash
npx wrangler deployments list -c wrangler-auth.toml
```

**Testa direttamente:**
```bash
curl https://pflegeteufel-auth.massarocalogero1997.workers.dev/health
```

**Output atteso:**
```json
{
  "ok": true,
  "database": true,
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 📈 Prossimi Passi (Opzionali)

### 1. Email Verification
Implementa l'invio di email di verifica usando Resend:

```javascript
// In cloudflare-worker-auth.js, dopo registrazione
await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    from: 'noreply@pflegeteufel.de',
    to: email,
    subject: 'E-Mail bestätigen',
    html: `<a href="https://pflegeteufel.de/verify?token=${verificationToken}">Jetzt bestätigen</a>`
  })
});
```

### 2. Password Reset
Crea pagina `/pages/password-reset` per recupero password.

### 3. Two-Factor Authentication (2FA)
Aggiungi 2FA usando TOTP (Google Authenticator).

### 4. Integrazione con Shopify Customer API
Sincronizza i clienti registrati con Shopify Customers:

```javascript
// Crea cliente su Shopify
await fetch(`https://${SHOPIFY_SHOP}/admin/api/2024-10/customers.json`, {
  method: 'POST',
  headers: {
    'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    customer: {
      email: email,
      first_name: vorname,
      last_name: nachname,
      phone: telefon
    }
  })
});
```

### 5. Analytics
Traccia registrazioni e login con Google Analytics:

```javascript
gtag('event', 'sign_up', {
  method: 'Email'
});
```

---

## 📞 Support

Per problemi o domande:

1. Verifica i logs del worker:
   ```bash
   npx wrangler tail -c wrangler-auth.toml
   ```

2. Controlla il database:
   ```bash
   npx wrangler d1 execute pflegeteufel-customers --command="SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 10"
   ```

3. Testa le API con curl:
   ```bash
   curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@test.com","password":"Test1234","vorname":"Test","nachname":"User","marketing_consent":true}'
   ```

---

## ✅ Checklist Finale

- [ ] Database D1 creato e inizializzato
- [ ] Schema applicato con successo
- [ ] Worker deployato
- [ ] Secrets configurati (WORKER_SHARED_KEY, JWT_SECRET)
- [ ] Pagine Shopify create (registrierung, login, mein-konto)
- [ ] Template assegnati alle pagine
- [ ] Link aggiunti al menu
- [ ] Test registrazione completato
- [ ] Test login completato
- [ ] Test dashboard account completato
- [ ] Privacy policy aggiornata (opzionale ma consigliato)

---

**Sistema pronto per la produzione!** 🎉

Data creazione: 27 Novembre 2025
Versione: 1.0
