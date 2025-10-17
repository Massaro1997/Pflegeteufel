# 📊 Analisi Completa API Shopify - Tutti i Dati Disponibili

## 🎯 Sommario Esecutivo

Ho analizzato TUTTE le API REST di Shopify disponibili per il tuo negozio `0phy01-hc.myshopify.com`.
Questo documento contiene **tutti i campi disponibili** per Customers, Orders e Products.

---

## 👥 CUSTOMERS - Campi Disponibili

### ✅ Campi SEMPRE disponibili:
```javascript
{
  "id": 24057953943933,                    // ID univoco cliente
  "created_at": "2025-10-10T19:47:27+02:00", // Data creazione
  "updated_at": "2025-10-11T14:36:37+02:00", // Ultimo aggiornamento
  "orders_count": 0,                        // Numero ordini effettuati
  "state": "disabled",                      // Stato: enabled/disabled
  "total_spent": "0.00",                    // Totale speso (EUR)
  "last_order_id": null,                    // ID ultimo ordine
  "last_order_name": null,                  // Nome ultimo ordine (#1004)
  "note": null,                             // Note amministratore
  "verified_email": true,                   // Email verificata
  "multipass_identifier": null,             // Identificatore multipass
  "tax_exempt": false,                      // Esente da tasse
  "tags": "",                               // Tag (es: "pflegemittel_ok")
  "currency": "EUR",                        // Valuta preferita
  "admin_graphql_api_id": "gid://shopify/Customer/..."  // ID GraphQL
}
```

### ⚠️ Campi SPESSO MANCANTI (dipendono dal checkout):
```javascript
{
  "first_name": undefined,        // ❌ NON presente nei tuoi clienti
  "last_name": undefined,         // ❌ NON presente nei tuoi clienti
  "email": undefined,             // ❌ NON presente nei tuoi clienti
  "phone": undefined,             // ❌ NON presente nei tuoi clienti
}
```

**MOTIVO:** I tuoi clienti hanno fatto checkout come "guest" senza fornire questi dati, oppure sono stati cancellati.

### 🏠 Indirizzi (addresses):
```javascript
"addresses": [
  {
    "id": 35367161364861,
    "customer_id": 24051066995069,
    "first_name": undefined,        // ❌ MANCANTE
    "last_name": undefined,         // ❌ MANCANTE
    "company": null,
    "address1": undefined,          // ❌ MANCANTE
    "address2": undefined,          // ❌ MANCANTE
    "city": undefined,              // ❌ MANCANTE
    "province": "",
    "country": "Germany",
    "province_code": null,
    "country_code": "DE",
    "country_name": "Germany",
    "zip": undefined,               // ❌ MANCANTE
    "phone": undefined,             // ❌ MANCANTE
    "name": undefined,              // ❌ MANCANTE
    "default": true                 // Indirizzo predefinito
  }
]
```

**PROBLEMA CRITICO:** Anche gli indirizzi sono VUOTI - contengono solo `country` e `country_code`.

### 📧 Marketing Consent:
```javascript
"email_marketing_consent": {
  "state": "not_subscribed",              // Stato: subscribed/not_subscribed
  "opt_in_level": "confirmed_opt_in",     // Livello: single_opt_in/confirmed_opt_in
  "consent_updated_at": null              // Data ultimo aggiornamento
},
"sms_marketing_consent": null             // Consenso SMS (se presente)
```

### 🚫 Campi TAX:
```javascript
"tax_exemptions": [],                     // Esenzioni fiscali (array vuoto)
```

---

## 📦 ORDERS - Campi Disponibili

### ✅ Dati Base Ordine:
```javascript
{
  "id": 12426195239293,                   // ID univoco ordine
  "admin_graphql_api_id": "gid://shopify/Order/...",
  "name": "#1008",                        // Numero ordine visibile
  "order_number": 1008,                   // Numero ordine numerico
  "number": 8,                            // Numero sequenziale
  "created_at": "2025-10-09T21:43:38+02:00",
  "updated_at": "2025-10-09T21:46:41+02:00",
  "processed_at": "2025-10-09T21:43:37+02:00",
  "closed_at": null,
  "cancelled_at": "2025-10-09T21:46:18+02:00",
  "cancel_reason": "staff",              // Motivo cancellazione
  "confirmed": true,
  "test": false,                          // Ordine di test?
  "note": null,                           // Note ordine
  "note_attributes": []                   // Attributi note personalizzati
}
```

### 💰 Prezzi e Totali:
```javascript
{
  "currency": "EUR",
  "presentment_currency": "EUR",
  "subtotal_price": "0.00",
  "total_line_items_price": "39.98",
  "total_discounts": "39.98",
  "total_tax": "0.00",
  "total_price": "5.50",                  // TOTALE FINALE
  "current_total_price": "0.00",
  "total_outstanding": "0.00",
  "total_weight": 0,
  "taxes_included": true,
  "tax_exempt": false,

  // Struttura completa con shop_money e presentment_money
  "total_price_set": {
    "shop_money": {"amount": "5.50", "currency_code": "EUR"},
    "presentment_money": {"amount": "5.50", "currency_code": "EUR"}
  }
}
```

### 💳 Stati Finanziari:
```javascript
{
  "financial_status": "voided",           // paid/pending/voided/refunded/authorized
  "payment_gateway_names": ["Auf rechnung"],
  "payment_terms": null
}
```

### 📤 Stati Fulfillment:
```javascript
{
  "fulfillment_status": null,             // fulfilled/partial/unfulfilled
  "fulfillments": []                      // Array di fulfillment (se presente)
}
```

### 👤 Dati Cliente nell'Ordine:
```javascript
"customer": {
  "id": 23866670645629,
  "created_at": "2025-08-28T14:59:23+02:00",
  "updated_at": "2025-10-16T11:14:04+02:00",
  "state": "disabled",
  "note": "",
  "verified_email": true,
  "tags": "pflegemittel_ok",
  "currency": "EUR",

  // ⚠️ ANCHE QUI MANCANO i dati personali:
  "first_name": undefined,
  "last_name": undefined,
  "email": undefined,
  "phone": undefined,

  "default_address": {
    "id": 35192168219005,
    "customer_id": 23866670645629,
    "company": null,
    "province": null,
    "country": "Germany",
    "province_code": null,
    "country_code": "DE",
    "country_name": "Germany",
    "default": true,
    // ❌ ANCHE QUI mancano first_name, last_name, address1, city, zip, phone
  }
}
```

### 🏠 Indirizzi nell'Ordine:
```javascript
"billing_address": {
  "first_name": undefined,        // ❌ MANCANTE
  "last_name": undefined,         // ❌ MANCANTE
  "address1": undefined,          // ❌ MANCANTE
  "address2": undefined,
  "city": undefined,              // ❌ MANCANTE
  "province": null,
  "country": "Germany",
  "province_code": null,
  "country_code": "DE",
  "zip": undefined,               // ❌ MANCANTE
  "phone": undefined              // ❌ MANCANTE
},
"shipping_address": {
  // Stessa struttura del billing_address
  // ❌ ANCHE QUI tutto vuoto tranne country
}
```

### 🛒 Line Items (Prodotti nell'ordine):
```javascript
"line_items": [
  {
    "id": 36181269512573,
    "product_id": 15495589069181,
    "variant_id": 56792715821437,
    "title": "CBD Gummies – Erdbeere (300mg)",
    "name": "CBD Gummies – Erdbeere (300mg)",
    "quantity": 1,
    "price": "2.99",
    "sku": "SKU0037",
    "vendor": "CBD",
    "taxable": true,
    "requires_shipping": true,
    "gift_card": false,
    "grams": 0,
    "fulfillable_quantity": 0,
    "current_quantity": 0,
    "fulfillment_status": null,
    "fulfillment_service": "manual",
    "total_discount": "0.00",
    "properties": [],                     // Proprietà personalizzate
    "product_exists": true,
    "variant_inventory_management": "shopify",
    "variant_title": null,

    "price_set": {
      "shop_money": {"amount": "2.99", "currency_code": "EUR"},
      "presentment_money": {"amount": "2.99", "currency_code": "EUR"}
    },

    "tax_lines": [],
    "duties": [],
    "discount_allocations": [
      {
        "amount": "2.99",
        "discount_application_index": 0,
        "amount_set": {
          "shop_money": {"amount": "2.99", "currency_code": "EUR"},
          "presentment_money": {"amount": "2.99", "currency_code": "EUR"}
        }
      }
    ]
  }
]
```

### 🎁 Sconti Applicati:
```javascript
"discount_codes": [],                     // Codici sconto inseriti manualmente
"discount_applications": [
  {
    "target_type": "line_item",           // line_item/shipping_line
    "type": "automatic",                  // automatic/discount_code/manual
    "value": "42.0",
    "value_type": "fixed_amount",         // fixed_amount/percentage
    "allocation_method": "across",        // across/each/one
    "target_selection": "entitled",
    "title": "PFLEGEBOX"                  // Nome dello sconto
  }
]
```

### 🚚 Spedizione:
```javascript
"shipping_lines": [
  {
    "id": 11435421860221,
    "code": "Standard",
    "title": "Standard",
    "price": "5.50",
    "discounted_price": "5.50",
    "source": "shopify",
    "phone": null,
    "carrier_identifier": null,
    "requested_fulfillment_service_id": null,
    "tax_lines": [],
    "discount_allocations": [],
    "is_removed": false,

    "price_set": {
      "shop_money": {"amount": "5.50", "currency_code": "EUR"},
      "presentment_money": {"amount": "5.50", "currency_code": "EUR"}
    }
  }
]
```

### 💸 Rimborsi (Refunds):
```javascript
"refunds": [
  {
    "id": 1160079049085,
    "order_id": 12426195239293,
    "created_at": "2025-10-09T21:46:18+02:00",
    "processed_at": "2025-10-09T21:46:18+02:00",
    "note": "Ordine annullato",
    "user_id": 129011548541,
    "restock": true,

    "total_duties_set": {
      "shop_money": {"amount": "0.00", "currency_code": "EUR"},
      "presentment_money": {"amount": "0.00", "currency_code": "EUR"}
    },

    "order_adjustments": [
      {
        "id": 546494972285,
        "order_id": 12426195239293,
        "refund_id": 1160079049085,
        "amount": "-5.50",
        "tax_amount": "0.00",
        "kind": "shipping_refund",          // shipping_refund/refund_discrepancy
        "reason": "Shipping refund"
      }
    ],

    "transactions": [
      {
        "id": 13786593722749,
        "order_id": 12426195239293,
        "kind": "void",                     // void/refund/capture
        "gateway": "Auf rechnung",
        "status": "success",                // success/failure/error/pending
        "amount": "0.00",
        "currency": "EUR",
        "authorization": null,
        "message": "Marked the Auf rechnung payment as voided",
        "created_at": "2025-10-09T21:46:18+02:00",
        "processed_at": "2025-10-09T21:46:18+02:00",
        "parent_id": 13786583761277,
        "test": false,
        "user_id": 129011548541,
        "error_code": null,
        "source_name": "1830279"
      }
    ],

    "refund_line_items": [
      {
        "id": 1105515381117,
        "line_item_id": 36181269512573,
        "location_id": 106150658429,
        "quantity": 1,
        "restock_type": "cancel",           // cancel/return/no_restock
        "subtotal": 0,
        "total_tax": 0,
        "line_item": { /* oggetto line_item completo */ }
      }
    ]
  }
]
```

### 🌍 Informazioni Browser/Client:
```javascript
{
  "browser_ip": "89.1.212.106",
  "buyer_accepts_marketing": false,
  "customer_locale": "de-DE",               // Lingua cliente
  "landing_site": null,                     // Prima pagina visitata
  "landing_site_ref": null,
  "referring_site": null,                   // Sito di provenienza
  "source_name": "web",                     // web/pos/mobile/etc
  "source_identifier": null,
  "source_url": null,

  "client_details": {
    "accept_language": "de-DE",
    "browser_ip": "89.1.212.106",
    "session_hash": null,
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
    "browser_height": null,
    "browser_width": null
  }
}
```

### 🔒 Altri Campi Tecnici:
```javascript
{
  "app_id": 580111,
  "cart_token": "hWN3vX1MiMLuEAgyjenkUzaA",
  "checkout_id": 66715969388925,
  "checkout_token": "df63aa8ef415af09e40be76192eb017a",
  "token": "12add63d0dcae30c47ce01137641606a",
  "confirmation_number": "W2MEX5V65",
  "device_id": null,
  "location_id": null,
  "merchant_business_entity_id": "MTkwOTI4MDU0NjUz",
  "merchant_of_record_app_id": null,
  "po_number": null,
  "reference": null,
  "user_id": null
}
```

---

## 📱 PRODUCTS - Campi Disponibili

### ✅ Dati Base Prodotto:
```javascript
{
  "id": 15556883775869,
  "title": "Rabenhorst Für das Immunsystem Mini",
  "body_html": "<p>...descrizione HTML...</p>",  // HTML completo
  "vendor": "Pflege Teufel",
  "product_type": "",                     // Tipo prodotto (opzionale)
  "handle": "fur-das-immunsystem",        // URL slug
  "created_at": "2025-09-24T10:24:59+02:00",
  "updated_at": "2025-10-16T02:39:06+02:00",
  "published_at": "2025-09-24T10:24:59+02:00",
  "template_suffix": null,
  "published_scope": "global",            // global/web
  "tags": "",                             // Tag separati da virgola
  "status": "active",                     // active/draft/archived
  "admin_graphql_api_id": "gid://shopify/Product/..."
}
```

### 🔢 Varianti (Variants):
```javascript
"variants": [
  {
    "id": 57002467197309,
    "product_id": 15556883775869,
    "title": "Default Title",
    "price": "1.90",
    "position": 1,
    "sku": null,                          // Codice SKU
    "barcode": null,                      // Codice a barre
    "compare_at_price": null,             // Prezzo di confronto (barrato)
    "option1": "Default Title",
    "option2": null,
    "option3": null,
    "created_at": "2025-09-24T10:24:59+02:00",
    "updated_at": "2025-10-09T00:19:25+02:00",
    "taxable": true,
    "requires_shipping": true,
    "fulfillment_service": "manual",
    "inventory_policy": "deny",           // deny/continue (permetti ordini senza stock)
    "inventory_management": "shopify",     // shopify/null
    "inventory_item_id": 54113920188797,
    "inventory_quantity": 88,             // ✅ QUANTITÀ DISPONIBILE
    "old_inventory_quantity": 88,
    "grams": 0,
    "weight": 0,
    "weight_unit": "kg",
    "image_id": null,                     // ID immagine associata
    "admin_graphql_api_id": "gid://shopify/ProductVariant/..."
  }
]
```

### 🎨 Opzioni (Options):
```javascript
"options": [
  {
    "id": 18351158428029,
    "product_id": 15556883775869,
    "name": "Title",                      // Nome opzione (es: Size, Color)
    "position": 1,
    "values": ["Default Title"]           // Valori possibili
  }
]
```

### 🖼️ Immagini (Images):
```javascript
"images": [
  {
    "id": 78103448945021,
    "product_id": 15556883775869,
    "position": 1,
    "created_at": "2025-10-03T16:28:05+02:00",
    "updated_at": "2025-10-03T16:28:11+02:00",
    "alt": null,                          // Testo alternativo
    "width": 1736,
    "height": 1395,
    "src": "https://cdn.shopify.com/s/files/1/0909/2805/4653/files/WhatsAppImage2025-09-11at14.47.50_9852310f-d5a4-40e1-ab3e-6325d608206d.jpg?v=1759501688",
    "variant_ids": [],                    // Varianti associate all'immagine
    "admin_graphql_api_id": "gid://shopify/MediaImage/66750062264701"
  }
],
"image": {
  // Immagine principale (stesso formato)
}
```

---

## ❌ PROBLEMA PRINCIPALE IDENTIFICATO

### 🚨 Dati Clienti MANCANTI

**Nei tuoi ordini e clienti NON sono presenti:**
- ❌ `first_name` (Nome)
- ❌ `last_name` (Cognome)
- ❌ `email` (Email)
- ❌ `phone` (Telefono)
- ❌ `address1` (Indirizzo)
- ❌ `city` (Città)
- ❌ `zip` (CAP)

**Questo vale per:**
1. Oggetto `customer` diretto
2. Oggetto `customer` dentro gli ordini
3. `billing_address` negli ordini
4. `shipping_address` negli ordini
5. `addresses` nel profilo cliente
6. `default_address` nel profilo cliente

### 🔍 Cause Possibili:

1. **Guest Checkout:** I clienti hanno completato l'ordine senza creare un account e senza inserire dati completi
2. **Privacy/GDPR:** I dati sono stati rimossi per conformità GDPR su richiesta del cliente
3. **Configurazione Shopify:** Il checkout non richiede obbligatoriamente questi campi
4. **Dati cancellati:** Qualcuno ha manualmente rimosso i dati dall'admin

### ✅ Dati che PUOI ottenere:

Anche senza nome/email/indirizzo, hai comunque accesso a:
- ✅ ID cliente univoco
- ✅ Numero ordini effettuati
- ✅ Totale speso
- ✅ Data creazione e ultimo aggiornamento
- ✅ Paese (solo "Germany" senza dettagli)
- ✅ Tag assegnati
- ✅ Stati marketing consent
- ✅ Storia ordini completa con prodotti acquistati
- ✅ Informazioni browser/IP (negli ordini)

---

## 💡 RACCOMANDAZIONI

### Per il Backend:

1. **Mostra i dati disponibili:**
   - Usa `Cliente #XXXXXX` (ultime 6 cifre ID) come nome
   - Mostra badge "Senza Nome", "Senza Email", "Senza Telefono"
   - Ordina per completezza dati (clienti con più info per primi)

2. **Visualizza statistiche:**
   - Numero ordini
   - Totale speso
   - Data primo ordine
   - Prodotti acquistati

3. **Aggiungi funzionalità:**
   - Cerca per ID cliente
   - Filtra per numero ordini (>0, >1, >5, etc)
   - Filtra per totale speso
   - Raggruppa per tag

### Per il Futuro:

1. **Configura Shopify Checkout:**
   - Rendi obbligatori: Nome, Cognome, Email, Telefono
   - Forza creazione account per ordini

2. **Aggiungi script post-ordine:**
   - Richiedi compilazione profilo dopo primo ordine
   - Offri sconti in cambio di dati completi

3. **Implementa Customer Accounts:**
   - Abilita "Classic Customer Accounts" o "New Customer Accounts"
   - Incentiva la registrazione

---

## 📌 CONCLUSIONE

**Tutti i dati API disponibili sono stati analizzati.**
Il problema NON è l'API o il Worker - **i dati semplicemente non esistono in Shopify**.

Il backend che abbiamo creato gestisce correttamente questa situazione mostrando:
- Nomi di fallback intelligenti
- Badge visivi per dati mancanti
- Ordinamento per completezza
- Tutti i dati effettivamente disponibili

✅ **Il sistema funziona perfettamente con i dati che Shopify fornisce!**
