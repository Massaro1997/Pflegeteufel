# Shopify Webhook Setup - Email di Conferma Ordini

## ✅ Deploy Completato

Il Cloudflare Worker è stato aggiornato e deployato con successo:
- **URL**: https://shopify-backend.massarocalogero1997.workers.dev
- **Version ID**: d6dedca8-1377-425b-83c0-1fb6bc8bc320
- **Endpoint Webhook**: `/api/shopify/webhooks/orders/create`

## 📧 Sistema Email Doppio

Il sistema è configurato per inviare **DUE email** al cliente quando effettua un ordine:

1. **Email nativa di Shopify** (quella standard che Shopify invia sempre)
   - Conferma immediata dell'ordine
   - Design standard di Shopify
   - Senza PDF allegato

2. **Email personalizzata con PDF** (la nostra)
   - Arriva subito dopo quella di Shopify
   - Include il **PDF ufficiale dell'ordine generato da Shopify**
   - Design personalizzato con i colori del brand
   - Informazioni complete e dettagliate

✅ **Vantaggio**: Il cliente riceve prima la conferma rapida di Shopify (familiare e affidabile), poi la tua email personalizzata con il PDF per la documentazione.

---

## 📋 Configurazione Webhook su Shopify

Configura il webhook per attivare l'invio della nostra email personalizzata con PDF allegato:

### Passaggi:

1. **Accedi al tuo Shopify Admin**
   - Vai su: https://admin.shopify.com/store/[YOUR-STORE-NAME]

2. **Naviga in Impostazioni > Notifiche**
   - Clicca su **Settings** (in basso a sinistra)
   - Poi clicca su **Notifications**

3. **Vai alla sezione Webhooks**
   - Scrolla fino alla sezione **Webhooks**
   - Clicca su **Create webhook** (o **Aggiungi webhook**)

4. **Configura il Webhook**
   Inserisci i seguenti dati:

   - **Event**: `Order creation` (Ordine creato)
   - **Format**: `JSON`
   - **URL**: `https://shopify-backend.massarocalogero1997.workers.dev/api/shopify/webhooks/orders/create`
   - **API Version**: `2026-01` (Versione finale candidata)

5. **Salva il Webhook**
   - Clicca su **Save webhook** (Salva webhook)

## 🧪 Test del Webhook

Dopo aver configurato il webhook, puoi testarlo in due modi:

### Opzione 1: Test tramite Shopify Admin
1. Nel pannello Webhooks, trova il webhook appena creato
2. Clicca su **Send test notification**
3. Controlla i log del Cloudflare Worker per verificare che abbia ricevuto la notifica

### Opzione 2: Effettua un ordine di test
1. Crea un ordine di test sul tuo negozio Shopify
2. Il cliente dovrebbe ricevere automaticamente un'email di conferma
3. Verifica che l'email sia stata inviata correttamente

## 📧 Email che vengono inviate

### Email di Conferma Ordine (con PDF allegato)
Quando un cliente effettua un acquisto, riceverà automaticamente un'email con:

- ✅ **Ringraziamento** per l'ordine
- 📦 **Dettagli prodotti** ordinati con quantità e prezzi
- 💰 **Riepilogo totale** (subtotale, IVA, spedizione, totale)
- 📍 **Indirizzo di spedizione**
- 📋 **Prossimi passi**: Preparazione, invio tracking, tempistiche di consegna (2-4 giorni)
- 📎 **PDF ALLEGATO** con la conferma d'ordine completa
- 📞 **Contatti** per assistenza

**Il PDF allegato è:**
- 📄 **PDF ufficiale generato da Shopify** (non un PDF custom)
- Include tutti i dettagli dell'ordine nel formato standard di Shopify
- Pronto per essere stampato o archiviato dal cliente

### Email di Conferma Pflegebox
Quando un cliente compila il formulario pflegebox, riceve:

- ✅ **Ringraziamento** per la richiesta
- 📋 **Cosa succede ora**: Verifica documenti, invio alla Krankenkasse, contatto futuro
- 💡 **Rassicurazione**: "Non devi preoccuparti di niente, ci pensiamo noi!"
- 📄 **Riepilogo dati** del formulario
- 📎 **Allegato PDF** con il formulario compilato

## 🔒 Sicurezza (Opzionale)

Per maggiore sicurezza, puoi verificare l'autenticità delle richieste da Shopify controllando l'HMAC signature:

1. Nel codice del Worker, l'header `X-Shopify-Hmac-Sha256` viene già ricevuto
2. Se vuoi implementare la verifica HMAC, avrai bisogno del **Webhook Secret** che Shopify ti fornisce dopo aver creato il webhook
3. Puoi salvare questo secret come variabile d'ambiente in Cloudflare Workers

## 📝 Note Importanti

- Il webhook viene chiamato automaticamente da Shopify ogni volta che viene creato un nuovo ordine
- L'email viene inviata tramite Resend API (assicurati che `RESEND_API_KEY` sia configurato)
- Se l'invio email fallisce, l'ordine viene comunque processato normalmente (non blocca il checkout)
- Tutti gli eventi vengono loggati nei Cloudflare Worker logs

## 🎯 Email Mittente

Le email vengono inviate da:
- **Formulario Pflegebox**: `formular@pflegeteufel.de`
- **Conferma Ordine**: `bestellung@pflegeteufel.de`

Assicurati che questi domini siano verificati in Resend.

## 📞 Numero di Telefono

Ricorda di aggiornare il placeholder `[Ihre Telefonnummer hier einfügen]` nelle email con il tuo numero di telefono reale.

---

## ✨ Funzionalità Attive

✅ Email di conferma per formulario Pflegebox (con PDF custom allegato)
✅ Email personalizzata per ordini Shopify (con PDF ufficiale Shopify allegato)
✅ Sistema email doppio: email Shopify + email personalizzata con PDF
✅ PDF ufficiale Shopify automaticamente allegato
✅ Fallback a PDF custom se PDF Shopify non disponibile
✅ Riepilogo completo ordini con prodotti e totali
✅ Design professionale e responsive

---

**Creato il**: 02.11.2025
**Ultima modifica**: 02.11.2025
**Cloudflare Worker Version**: d6dedca8-1377-425b-83c0-1fb6bc8bc320
