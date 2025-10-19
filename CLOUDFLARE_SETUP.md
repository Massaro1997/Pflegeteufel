# Cloudflare Worker Setup - Pflegebox Backend

Questa guida spiega come configurare e deployare il Cloudflare Worker per gestire i formulari Pflegebox e le API Shopify.

## Prerequisiti

- Account Cloudflare
- Wrangler CLI installato (`npm install -g wrangler`)
- Credenziali Shopify Admin API

## 1. Login a Cloudflare

```bash
wrangler login
```

## 2. Creare KV Namespace per le submissions

```bash
wrangler kv:namespace create "PFLEGEBOX_SUBMISSIONS"
```

Questo comando restituirà un ID simile a:
```
{ binding = "PFLEGEBOX_SUBMISSIONS", id = "abc123..." }
```

Copia l'ID e aggiornalo in `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "PFLEGEBOX_SUBMISSIONS"
id = "abc123..."  # <-- Inserisci qui l'ID ottenuto
```

## 3. Configurare i Secrets

Configura le credenziali Shopify e altre chiavi segrete:

```bash
# Shopify credentials
wrangler secret put SHOPIFY_ADMIN_TOKEN
# Inserisci: shpat_xxxxx...

wrangler secret put SHOPIFY_SHOP
# Inserisci: 0phy01-hc.myshopify.com

# Worker authentication key (già configurato nel codice: felix_backend_2025)
wrangler secret put WORKER_SHARED_KEY
# Inserisci: felix_backend_2025

# Email API (opzionale - per notifiche)
wrangler secret put RESEND_API_KEY
# Inserisci: re_xxxxx... (se usi Resend)
```

## 4. Deploy del Worker

```bash
wrangler deploy
```

Il worker sarà deployato su:
```
https://shopify-backend.massarocalogero1997.workers.dev
```

## 5. Testare il Worker

### Test Health Check
```bash
curl -H "X-Worker-Key: felix_backend_2025" https://shopify-backend.massarocalogero1997.workers.dev/health
```

### Test Pflegebox Submissions List
```bash
curl -H "X-Worker-Key: felix_backend_2025" https://shopify-backend.massarocalogero1997.workers.dev/api/pflegebox/submissions
```

### Test Shopify Orders
```bash
curl -H "X-Worker-Key: felix_backend_2025" "https://shopify-backend.massarocalogero1997.workers.dev/orders?limit=5"
```

## 6. Verificare il Backend Dashboard

Vai su: https://pflegeteufel.de/pages/backend-operaio

Il tab "Pflegebox Formulari" dovrebbe ora mostrare tutte le submissions salvate.

## Struttura Dati Pflegebox

Ogni submission viene salvata nel KV con questa struttura:

```json
{
  "id": "pflegebox_1234567890_abc123",
  "versicherte": {
    "anrede": "Herr",
    "vorname": "Max",
    "name": "Mustermann",
    "email": "max@example.com",
    "telefon": "+49123456789",
    "pflegegrad": "2",
    "pflegekasse": "AOK",
    ...
  },
  "angehoerige": { ... },
  "pflegebox": {
    "products": {
      "einmalhandschuhe": true,
      "mundschutz": true,
      ...
    },
    "handschuhGroesse": "M",
    "handschuhMaterial": "Nitril"
  },
  "signatures": {
    "versicherte": "data:image/png;base64,...",
    "bevollmachtigte": "data:image/png;base64,..."
  },
  "created_at": "2025-10-19T12:34:56.789Z",
  "status": "pending"
}
```

## API Endpoints

### Pflegebox

- `POST /api/pflegebox/submit` - Submit new pflegebox form
- `GET /api/pflegebox/submissions?search=&pflegegrad=&limit=250` - List submissions

### Shopify Admin API Proxy

- `GET /orders?limit=25&status=any` - List orders
- `GET /orders/:id` - Get order details
- `GET /customers?limit=250` - List customers
- `GET /customers/:id` - Get customer details
- `GET /customers/:id/orders` - Get customer orders
- `POST /customers` - Create customer
- `PUT /customers/:id` - Update customer
- `DELETE /customers/:id` - Delete customer
- `GET /products?limit=25` - List products
- `POST /products` - Create product
- `PUT /products/:id` - Update product
- `DELETE /products/:id` - Delete product
- `PUT /variants/:id` - Update variant (inventory)

## Troubleshooting

### "Unauthorized" error
Verifica che l'header `X-Worker-Key: felix_backend_2025` sia presente in ogni richiesta.

### "Shopify credentials not configured"
Configura i secrets SHOPIFY_ADMIN_TOKEN e SHOPIFY_SHOP.

### KV namespace not configured
Assicurati di aver creato il KV namespace e aggiornato l'ID in wrangler.toml.

### Submissions non appaiono nel dashboard
Controlla i logs del worker con:
```bash
wrangler tail
```

## Sviluppo Locale

Per testare il worker localmente:

```bash
wrangler dev
```

Il worker sarà disponibile su `http://localhost:8787`

## Monitoring

Visualizza i logs in tempo reale:

```bash
wrangler tail
```

Oppure vai su Cloudflare Dashboard → Workers & Pages → shopify-backend → Logs

## Note

- Il worker è già deployato su `https://shopify-backend.massarocalogero1997.workers.dev`
- Tutte le submissions vengono salvate nel KV storage di Cloudflare
- Il KV storage è gratuito fino a 100,000 read/day e 1,000 write/day
- I dati sono persistenti e non scadono automaticamente
- Le firme digitali vengono salvate come base64 data URLs

## Prossimi Step (Opzionali)

1. **Email Notifications**: Implementare l'invio email con Resend quando arriva una nuova submission
2. **PDF Generation**: Generare PDF della submission e salvarlo su R2
3. **Shopify Customer Integration**: Creare automaticamente un customer in Shopify da ogni submission
4. **Status Management**: Aggiungere stati (pending, processed, completed) alle submissions
5. **Admin Actions**: Aggiungere pulsanti per azioni (approva, rifiuta, esporta PDF)
