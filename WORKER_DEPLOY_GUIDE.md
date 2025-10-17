# 🚀 Guida Deploy Cloudflare Worker con Endpoint Pflegebox

## 📋 Panoramica

Il file `cloudflare-worker-fixed.js` è stato aggiornato con il nuovo endpoint per il form Pflegebox.

### ✅ Modifiche Apportate:

1. **Nuovo endpoint:** `POST /api/pflegebox/submit`
2. **Funzioni helper:**
   - `generatePflegeboxEmailHTML()` - Genera email HTML formattata
   - `sendPflegeboxEmail()` - Invia email via Resend o SendGrid
3. **Aggiornata lista endpoint disponibili**

---

## 🔧 Deploy su Cloudflare

### Metodo 1: Dashboard Web (PIÙ SEMPLICE)

1. **Login a Cloudflare:**
   - Vai su: https://dash.cloudflare.com/
   - Login con le tue credenziali

2. **Naviga al Worker:**
   - Workers & Pages → Overview
   - Clicca su: `shopify-backend` (il worker esistente)

3. **Edit Code:**
   - Clicca su "Quick Edit" o "Edit Code"
   - Seleziona tutto il codice esistente
   - **Sostituisci** con il contenuto del file: `cloudflare-worker-fixed.js`
   - Save and Deploy

4. **Configura Variabili d'Ambiente:**
   - Settings → Variables
   - Aggiungi una di queste due variabili (o entrambe):

#### Opzione A: Usa Resend (Consigliato)
```
Nome: RESEND_API_KEY
Valore: re_xxxxxxxxxxxxxxxxxxxxx
Type: Encrypted
```

**Come ottenere Resend API Key:**
- Vai su: https://resend.com/
- Registrati (piano gratuito: 3,000 email/mese)
- API Keys → Create API Key
- Copia la chiave

#### Opzione B: Usa SendGrid
```
Nome: SENDGRID_API_KEY
Valore: SG.xxxxxxxxxxxxxxxxxxxxx
Type: Encrypted
```

**Come ottenere SendGrid API Key:**
- Vai su: https://sendgrid.com/
- Registrati (piano gratuito: 100 email/giorno)
- Settings → API Keys → Create API Key
- Copia la chiave

5. **Save e Deploy:**
   - Save Settings
   - Il worker si riavvierà automaticamente

---

### Metodo 2: Wrangler CLI

```bash
# Installa Wrangler (se non hai)
npm install -g wrangler

# Login Cloudflare
wrangler login

# Deploy worker
cd D:\Work\www.pflegeteufel.de
wrangler deploy cloudflare-worker-fixed.js --name shopify-backend

# Configura variabili
wrangler secret put RESEND_API_KEY --name shopify-backend
# Incolla la tua API key quando richiesto
```

---

## ✅ Verifica Deploy

### 1. Test Health Endpoint

```bash
curl https://shopify-backend.massarocalogero1997.workers.dev/health
```

**Risposta attesa:**
```json
{
  "ok": true,
  "origin": "...",
  "allowed": true,
  "timestamp": "2025-10-17T...",
  "version": "2024-01"
}
```

### 2. Test Pflegebox Endpoint

```bash
curl -X POST https://shopify-backend.massarocalogero1997.workers.dev/api/pflegebox/submit \
  -H "Content-Type: application/json" \
  -H "X-Worker-Key: felix_backend_2025" \
  -d '{
    "versicherte": {
      "anrede": "Herr",
      "vorname": "Test",
      "name": "User",
      "strasse": "Teststrasse 123",
      "plzOrt": "12345 Berlin",
      "telefon": "+49 123 456789",
      "email": "test@example.com",
      "geburtsdatum": "1950-01-15",
      "versichertennummer": "A123456789",
      "pflegegrad": "3",
      "versicherteTyp": "gesetzlich",
      "pflegekasse": "AOK Bayern"
    },
    "angehoerige": {
      "isSamePerson": true,
      "data": {}
    },
    "pflegebox": {
      "products": {
        "bettschutzeinlagen": true,
        "ffp2": true
      },
      "handschuhGroesse": "M",
      "handschuhMaterial": "Nitril"
    },
    "lieferung": {
      "an": "versicherte"
    },
    "rechnung": {
      "an": "versicherte"
    },
    "signatures": {
      "versicherte": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    },
    "consents": {
      "agb": true,
      "privacy": true
    },
    "bestelldatum": "17.10.2025",
    "bestellzeit": "14:30:00",
    "timestamp": "2025-10-17T14:30:00.000Z"
  }'
```

**Risposta attesa (successo):**
```json
{
  "success": true,
  "message": "Antrag erfolgreich übermittelt",
  "timestamp": "2025-10-17T...",
  "data": {
    "versicherte": {
      "name": "Test User",
      "email": "test@example.com"
    },
    "bestelldatum": "17.10.2025"
  }
}
```

### 3. Verifica Email

Se hai configurato `RESEND_API_KEY` o `SENDGRID_API_KEY`:
- ✅ Controlla inbox: `info@pflegeteufel.de`
- ✅ Oggetto: "📦 Neue Pflegebox Bestellung - Test User"
- ✅ Email HTML ben formattata con tutti i dati

---

## 🔍 Troubleshooting

### Problema: "Unauthorized"

**Causa:** Chiave worker non valida

**Soluzione:**
```javascript
// Nel frontend (pflegebox-form.js) assicurati di inviare:
headers: {
  'X-Worker-Key': 'felix_backend_2025'
}
```

### Problema: "Firma mancante"

**Causa:** Campo `signatures.versicherte` vuoto o non presente

**Soluzione:**
- Verifica che il canvas firma funzioni
- Controlla che `signatureData` non sia vuoto prima di inviare

### Problema: "Email non arriva"

**Causa:** API key email non configurata

**Verifica:**
```bash
# Controlla le variabili configurate
wrangler secret list --name shopify-backend
```

**Soluzione:**
1. Verifica che `RESEND_API_KEY` o `SENDGRID_API_KEY` sia configurata
2. Controlla i log Worker per errori:
   - Dashboard Cloudflare → Worker → Logs (Real-time)
3. Verifica dominio email verificato su Resend/SendGrid

### Problema: "Resend API error: 403"

**Causa:** Dominio email non verificato

**Soluzione (Resend):**
1. Vai su Resend dashboard → Domains
2. Aggiungi dominio: `pflegeteufel.de`
3. Configura record DNS:
   ```
   Type: TXT
   Name: _resend
   Value: [fornito da Resend]
   ```
4. Verifica dominio
5. Dopo verifica, aggiorna `fromEmail` nel worker:
   ```javascript
   const fromEmail = 'noreply@pflegeteufel.de';
   ```

### Problema: Log Worker non visibili

**Soluzione:**
```bash
# Usa Wrangler per vedere log in real-time
wrangler tail --name shopify-backend
```

---

## 📊 Monitoring

### Log Console Cloudflare

Nel dashboard Worker puoi vedere:
- ✅ Numero richieste al secondo
- ✅ Errori 4xx/5xx
- ✅ Tempo medio risposta
- ✅ Log console in real-time

### Test Periodico

Aggiungi questo endpoint al monitoring (Uptime Robot, Pingdom, etc.):
```
URL: https://shopify-backend.massarocalogero1997.workers.dev/health
Intervallo: 5 minuti
```

---

## 🔒 Sicurezza

### Headers Required

Il worker richiede SEMPRE (tranne /health):
```
X-Worker-Key: felix_backend_2025
```

### CORS Configurato

Origine permesse (configurate in `ALLOWED_ORIGIN`):
- `https://pflegeteufel.de`
- `https://www.pflegeteufel.de`
- `*` (se vuoi permettere tutte)

### Rate Limiting

Cloudflare Workers ha built-in rate limiting:
- Piano gratuito: 100,000 richieste/giorno
- Oltre: $0.50 per milione richieste

---

## 📝 Modifiche Future

### Aggiungere nuovo endpoint

1. Trova la sezione `Route handling` (dopo riga 143)
2. Aggiungi il tuo endpoint:

```javascript
// ========== NUOVO ENDPOINT ==========
else if (path === "/api/mio-endpoint" && method === "POST") {
  try {
    const data = body;
    // Logica endpoint
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
```

3. Aggiungi alla lista endpoint (riga 386):
```javascript
availableEndpoints: [
  // ... existing endpoints
  "/api/mio-endpoint (POST)" // <-- ADD
]
```

### Aggiungere funzione helper

Aggiungi prima della chiusura finale (prima di riga 664):

```javascript
function miaFunzione(data) {
  // Logica
  return result;
}
```

---

## 🎯 Checklist Deploy Completo

- [ ] Worker deployato su Cloudflare
- [ ] Variabile `RESEND_API_KEY` o `SENDGRID_API_KEY` configurata
- [ ] Test `/health` → risponde 200 OK
- [ ] Test `/api/pflegebox/submit` → risponde 200 OK
- [ ] Email test ricevuta a `info@pflegeteufel.de`
- [ ] Frontend `pflegebox-form.js` punta all'URL corretto del worker
- [ ] Variabile `workerBaseUrl` nel JS:
  ```javascript
  workerBaseUrl: 'https://shopify-backend.massarocalogero1997.workers.dev'
  ```
- [ ] Variabile `sharedKey` nel JS:
  ```javascript
  sharedKey: 'felix_backend_2025'
  ```

---

## 🔗 Link Utili

- **Worker URL:** https://shopify-backend.massarocalogero1997.workers.dev
- **Dashboard Cloudflare:** https://dash.cloudflare.com/
- **Resend Dashboard:** https://resend.com/
- **SendGrid Dashboard:** https://sendgrid.com/
- **Wrangler Docs:** https://developers.cloudflare.com/workers/wrangler/

---

## 📧 Email di Test

Per testare l'invio email senza compilare tutto il form:

```javascript
// Usa questo payload minimo
{
  "versicherte": {
    "vorname": "Test",
    "name": "User",
    "email": "test@example.com",
    "pflegegrad": "3"
  },
  "angehoerige": {
    "isSamePerson": true,
    "data": {}
  },
  "pflegebox": {
    "products": {"ffp2": true},
    "handschuhGroesse": "M",
    "handschuhMaterial": "Nitril"
  },
  "lieferung": {"an": "versicherte"},
  "rechnung": {"an": "versicherte"},
  "signatures": {
    "versicherte": "data:image/png;base64,iVBORw0KGgo..."
  },
  "bestelldatum": "17.10.2025",
  "bestellzeit": "14:30:00"
}
```

---

**✨ Deploy Completato! Il sistema Pflegebox è ora funzionante.**

Se hai problemi, controlla sempre i log Worker:
```bash
wrangler tail --name shopify-backend
```
