# Configurazione Server MCP Shopify

## 1. Server MCP Disponibili

### A. Shopify Dev MCP (Ufficiale Shopify)
**Funzionalità:**
- Ricerca nella documentazione Shopify
- Esplorazione schema GraphQL Admin API
- Risposte aggiornate sulle API Shopify
- **NON richiede autenticazione** (solo per docs e schema)

### B. Shopify Admin MCP (@ajackus/shopify-mcp-server)
**Funzionalità:** 70+ strumenti per gestire:
- Prodotti
- Ordini
- Clienti
- Inventario
- Analytics
- E molto altro...
- **RICHIEDE autenticazione** (Admin API Access Token)

---

## 2. Installazione e Configurazione

### Opzione A: Configurazione tramite VSCode UI

1. Apri VSCode
2. Premi `Ctrl+Shift+P`
3. Cerca: **"Claude Code: Configure MCP Servers"**
4. Copia il contenuto del file `mcp-config.json` nella configurazione

### Opzione B: Configurazione manuale

Il file `mcp-config.json` contiene la configurazione completa.

---

## 3. Recupero SHOPIFY_ACCESS_TOKEN

Il token è già configurato su Cloudflare come secret. Per recuperarlo:

### Metodo 1: Cloudflare Dashboard
1. Vai su: https://dash.cloudflare.com
2. Seleziona il tuo account
3. Workers & Pages > shopify-backend
4. Settings > Variables and Secrets
5. Visualizza il secret `SHOPIFY_ADMIN_TOKEN`

### Metodo 2: Creare un nuovo token
1. Vai su Shopify Admin: https://admin.shopify.com/store/0phy01-hc
2. Settings > Apps and sales channels
3. **Develop apps** (in basso)
4. Seleziona l'app esistente o crea nuova
5. Configuration > Admin API integration
6. Configura gli scopes necessari:
   - `read_products, write_products`
   - `read_orders, write_orders`
   - `read_customers, write_customers`
   - `read_inventory, write_inventory`
   - `read_analytics`
   - Altri scopes secondo necessità
7. Install app
8. Copia l'**Admin API access token**

---

## 4. Attivazione Server MCP

### Shopify Dev MCP (Sempre attivo)
```json
{
  "shopify-dev": {
    "disabled": false
  }
}
```

### Shopify Admin MCP (Dopo aver inserito il token)
1. Apri `mcp-config.json`
2. Sostituisci `"INSERISCI_QUI_IL_TOKEN"` con il tuo token
3. Cambia `"disabled": true` in `"disabled": false`
4. Riavvia VSCode o ricarica la finestra (`Ctrl+Shift+P` > "Developer: Reload Window")

---

## 5. Test Connessione

### Test Shopify Dev MCP
Chiedi a Claude:
```
"Cerca nella documentazione Shopify come creare un customer"
```

### Test Shopify Admin MCP
Chiedi a Claude:
```
"Mostrami gli ultimi 5 ordini del mio store Shopify"
```

---

## 6. Variabili Ambiente Disponibili

Dal file `wrangler.toml` e secrets:

| Variabile | Tipo | Valore |
|-----------|------|--------|
| `SHOPIFY_API_VERSION` | Var | `2024-10` |
| `SHOPIFY_SHOP` | Secret | `0phy01-hc.myshopify.com` |
| `SHOPIFY_ADMIN_TOKEN` | Secret | (da recuperare) |
| `WORKER_SHARED_KEY` | Secret | `felix_backend_2025` |

---

## 7. Comandi Utili

```bash
# Lista tutti i secrets Wrangler
npx wrangler secret list

# Aggiungere/aggiornare un secret
npx wrangler secret put SHOPIFY_ADMIN_TOKEN

# Test chiamata API diretta (per verificare il token)
curl -H "X-Shopify-Access-Token: TUO_TOKEN" \
  "https://0phy01-hc.myshopify.com/admin/api/2024-10/shop.json"
```

---

## 8. Risoluzione Problemi

### Errore: "Cannot connect to MCP server"
- Verifica che Node.js sia installato (`node --version`)
- Riavvia VSCode
- Controlla che il comando npx funzioni: `npx -y @shopify/dev-mcp@latest`

### Errore: "Invalid access token"
- Verifica che il token sia corretto
- Controlla che l'app Shopify sia installata
- Verifica gli scopes necessari

### Errore Windows: "Command failed"
- Usa la configurazione alternativa con `cmd /k` per Windows

---

## 9. Links Utili

- [Shopify Dev MCP Docs](https://shopify.dev/docs/apps/build/devmcp)
- [Shopify Admin API Reference](https://shopify.dev/docs/api/admin)
- [@ajackus/shopify-mcp-server GitHub](https://github.com/ajackus/shopify-mcp-server)
- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
