# 🔌 API Examples - Sistema Autenticazione Clienti

Esempi pratici di chiamate API per testare il sistema di registrazione clienti.

---

## 🌐 Base URL

```
https://pflegeteufel-auth.massarocalogero1997.workers.dev
```

Sostituisci con l'URL del tuo worker deployato.

---

## 🔍 Health Check

Verifica che il worker sia attivo e il database connesso.

### Request

```bash
curl https://pflegeteufel-auth.massarocalogero1997.workers.dev/health
```

### Response

```json
{
  "ok": true,
  "database": true,
  "timestamp": "2025-11-27T10:30:00.000Z"
}
```

---

## 📝 Registrazione Cliente

Registra un nuovo cliente nel database.

### Request

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "max.mustermann@example.com",
    "password": "SecurePass123",
    "anrede": "Herr",
    "vorname": "Max",
    "nachname": "Mustermann",
    "telefon": "+49123456789",
    "geburtsdatum": "1985-05-15",
    "strasse": "Hauptstraße",
    "hausnummer": "123",
    "plz": "50667",
    "ort": "Köln",
    "land": "Germany",
    "pflegegrad": 3,
    "pflegekasse": "AOK",
    "versichertennummer": "A123456789",
    "newsletter": true,
    "marketing_consent": true
  }'
```

### Response Success

```json
{
  "success": true,
  "message": "Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail.",
  "customerId": 1
}
```

### Response Error - Email già esistente

```json
{
  "success": false,
  "error": "Diese E-Mail ist bereits registriert"
}
```

### Response Error - Password debole

```json
{
  "success": false,
  "error": "Passwort muss mindestens 8 Zeichen, eine Zahl und einen Buchstaben enthalten"
}
```

---

## 🔐 Login

Effettua login e ottieni JWT token.

### Request

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "max.mustermann@example.com",
    "password": "SecurePass123"
  }'
```

### Response Success

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjdXN0b21lcklkIjoxLCJlbWFpbCI6Im1heC5tdXN0ZXJtYW5uQGV4YW1wbGUuY29tIiwiZXhwIjoxNzM4MDY1MDAwfQ.abc123def456",
  "sessionToken": "a1b2c3d4e5f6g7h8i9j0",
  "refreshToken": "z9y8x7w6v5u4t3s2r1q0",
  "customer": {
    "id": 1,
    "email": "max.mustermann@example.com",
    "vorname": "Max",
    "nachname": "Mustermann",
    "is_verified": 0
  }
}
```

**Nota:** Salva il `token` per usarlo nelle richieste successive.

### Response Error - Credenziali sbagliate

```json
{
  "success": false,
  "error": "E-Mail oder Passwort falsch"
}
```

---

## 👤 Ottenere Profilo Cliente

Ottieni i dati completi del cliente autenticato.

### Request

```bash
curl -X GET https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Sostituisci il token con quello ricevuto dal login.

### Response Success

```json
{
  "success": true,
  "customer": {
    "id": 1,
    "email": "max.mustermann@example.com",
    "anrede": "Herr",
    "vorname": "Max",
    "nachname": "Mustermann",
    "telefon": "+49123456789",
    "geburtsdatum": "1985-05-15",
    "strasse": "Hauptstraße",
    "hausnummer": "123",
    "plz": "50667",
    "ort": "Köln",
    "land": "Germany",
    "pflegegrad": 3,
    "pflegekasse": "AOK",
    "newsletter": 1,
    "is_verified": 0,
    "created_at": "2025-11-27T10:00:00.000Z",
    "last_login": "2025-11-27T11:30:00.000Z"
  }
}
```

### Response Error - Token non valido

```json
{
  "success": false,
  "error": "Token ungültig oder abgelaufen"
}
```

---

## ✏️ Aggiornare Profilo Cliente

Aggiorna i dati del cliente (solo il cliente stesso può farlo).

### Request

```bash
curl -X PUT https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers/1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "anrede": "Herr",
    "vorname": "Maximilian",
    "nachname": "Mustermann",
    "telefon": "+49987654321",
    "strasse": "Neue Straße",
    "hausnummer": "456",
    "plz": "50668",
    "ort": "Köln",
    "pflegegrad": 4,
    "newsletter": false
  }'
```

### Response Success

```json
{
  "success": true,
  "message": "Profil aktualisiert"
}
```

---

## 🚪 Logout

Termina la sessione del cliente.

### Request

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "a1b2c3d4e5f6g7h8i9j0"
  }'
```

### Response Success

```json
{
  "success": true,
  "message": "Abgemeldet"
}
```

---

## 🗑️ Cancellare Account (GDPR)

Cancella completamente l'account del cliente.

### Request

```bash
curl -X DELETE https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers/1/delete \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Response Success

```json
{
  "success": true,
  "message": "Konto gelöscht"
}
```

---

## 👥 Lista Clienti (Admin)

Ottieni lista di tutti i clienti registrati (richiede chiave admin).

### Request

```bash
curl -X GET "https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers" \
  -H "X-Worker-Key: felix_backend_2025"
```

### Request con Ricerca

```bash
curl -X GET "https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers?search=Max" \
  -H "X-Worker-Key: felix_backend_2025"
```

### Response Success

```json
{
  "success": true,
  "customers": [
    {
      "id": 1,
      "email": "max.mustermann@example.com",
      "anrede": "Herr",
      "vorname": "Max",
      "nachname": "Mustermann",
      "telefon": "+49123456789",
      "ort": "Köln",
      "plz": "50667",
      "pflegegrad": 3,
      "pflegekasse": "AOK",
      "newsletter": 1,
      "is_verified": 0,
      "created_at": "2025-11-27T10:00:00.000Z",
      "last_login": "2025-11-27T11:30:00.000Z"
    },
    {
      "id": 2,
      "email": "anna.schmidt@example.com",
      "vorname": "Anna",
      "nachname": "Schmidt",
      "ort": "Berlin",
      "created_at": "2025-11-26T14:20:00.000Z"
    }
  ]
}
```

### Response Error - Non autorizzato

```json
{
  "success": false,
  "error": "Nicht autorisiert"
}
```

---

## 🧪 Test Flow Completo

### 1. Registrazione

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pflegeteufel.de",
    "password": "Test1234",
    "vorname": "Test",
    "nachname": "User",
    "marketing_consent": true
  }'
```

### 2. Login

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@pflegeteufel.de",
    "password": "Test1234"
  }'
```

Salva il `token` dalla response.

### 3. Ottieni Profilo

```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Aggiorna Profilo

```bash
curl -X PUT https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/customers/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "telefon": "+49555123456",
    "ort": "München"
  }'
```

### 5. Logout

```bash
curl -X POST https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/logout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionToken": "SESSION_TOKEN_QUI"
  }'
```

---

## 🔧 Testing con Postman

Importa questa collection in Postman:

```json
{
  "info": {
    "name": "Pflegeteufel Customer Auth",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/health"
      }
    },
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/register",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"password\": \"Test1234\",\n  \"vorname\": \"Max\",\n  \"nachname\": \"Test\",\n  \"marketing_consent\": true\n}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/auth/login",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"{{test_email}}\",\n  \"password\": \"Test1234\"\n}"
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/auth/me",
        "header": [{"key": "Authorization", "value": "Bearer {{jwt_token}}"}]
      }
    },
    {
      "name": "List Customers (Admin)",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/customers",
        "header": [{"key": "X-Worker-Key", "value": "felix_backend_2025"}]
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "https://pflegeteufel-auth.massarocalogero1997.workers.dev"
    },
    {
      "key": "test_email",
      "value": "test@pflegeteufel.de"
    },
    {
      "key": "jwt_token",
      "value": ""
    }
  ]
}
```

---

## 📊 Database Queries

### Verifica clienti registrati

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT id, email, vorname, nachname, created_at FROM customers ORDER BY created_at DESC LIMIT 10"
```

### Verifica sessioni attive

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT customer_id, created_at, ip_address FROM sessions WHERE expires_at > datetime('now') ORDER BY created_at DESC"
```

### Audit log ultimi eventi

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT customer_id, action, details, created_at FROM audit_log ORDER BY created_at DESC LIMIT 20"
```

### Statistiche clienti

```bash
npx wrangler d1 execute pflegeteufel-customers --command="SELECT COUNT(*) as total_customers, SUM(CASE WHEN is_verified=1 THEN 1 ELSE 0 END) as verified, SUM(CASE WHEN newsletter=1 THEN 1 ELSE 0 END) as newsletter_subscribers FROM customers"
```

---

## 🛠️ JavaScript Examples (Frontend)

### Registrazione da Form

```javascript
async function registerCustomer(formData) {
  try {
    const response = await fetch('https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    const result = await response.json();

    if (response.ok && result.success) {
      alert('Registrierung erfolgreich!');
      window.location.href = '/pages/login';
    } else {
      alert(result.error || 'Fehler bei der Registrierung');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ein Fehler ist aufgetreten');
  }
}
```

### Login e salvataggio token

```javascript
async function loginCustomer(email, password) {
  try {
    const response = await fetch('https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Salva token in localStorage
      localStorage.setItem('auth_token', result.token);
      localStorage.setItem('session_token', result.sessionToken);
      localStorage.setItem('customer', JSON.stringify(result.customer));

      // Redirect
      window.location.href = '/pages/mein-konto';
    } else {
      alert(result.error || 'Login fehlgeschlagen');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Ein Fehler ist aufgetreten');
  }
}
```

### Chiamata autenticata

```javascript
async function getCustomerProfile() {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    window.location.href = '/pages/login';
    return;
  }

  try {
    const response = await fetch('https://pflegeteufel-auth.massarocalogero1997.workers.dev/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      // Token scaduto o non valido
      localStorage.clear();
      window.location.href = '/pages/login';
      return;
    }

    const result = await response.json();
    return result.customer;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}
```

---

**Fine esempi API** ✅

Per la documentazione completa vedi `CUSTOMER_REGISTRATION_SETUP.md`.
