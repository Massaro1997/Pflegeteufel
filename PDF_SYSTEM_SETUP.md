# 📄 Sistema Generazione PDF - Guida Completa

**Data:** 18 Ottobre 2025
**Status:** 🚧 Da deployare
**Scopo:** Generare PDF compilato dal form Pflegebox e inviarlo via email

---

## 🎯 **Cosa Fa il Sistema**

Quando un cliente compila il form su `pflegeteufel.de/pages/pflegebox-formular`:

```
1. Cliente compila form (6 steps) ✅
2. Form invia dati al Worker ✅
3. Worker genera PDF compilato 📄 (NUOVO!)
4. Worker invia email con PDF allegato 📧
5. Tu ricevi PDF pronto da firmare e inviare alla Pflegekasse ✅
```

---

## 📦 **File Creati**

| File | Scopo |
|------|-------|
| `cloudflare-worker-with-pdf.js` | Worker con generazione PDF |
| `package.json` | Dipendenze (pdf-lib) |
| `wrangler.toml` | Configurazione Worker |
| `PDF_SYSTEM_SETUP.md` | Questa guida |

---

## 🛠️ **Come Deployare il Worker**

### **Passo 1: Installa Node.js e Wrangler**

Se non hai già installato Node.js:
1. Scarica da: https://nodejs.org/
2. Installa la versione LTS

Poi installa Wrangler (CLI di Cloudflare):
```bash
npm install -g wrangler
```

### **Passo 2: Login a Cloudflare**

```bash
wrangler login
```

Questo aprirà il browser per autenticarti.

### **Passo 3: Installa Dipendenze**

```bash
cd d:\Work\www.pflegeteufel.de
npm install
```

Questo installerà `pdf-lib` e `wrangler`.

### **Passo 4: Deploy del Worker**

```bash
npm run deploy
```

Oppure:
```bash
wrangler deploy
```

---

## 🔑 **Configurazione Variabili d'Ambiente**

Dopo il deploy, configura le variabili su **Cloudflare Dashboard**:

1. Vai su https://dash.cloudflare.com
2. **Workers & Pages** → Trova `shopify-backend`
3. **Settings → Variables**

### **Variabili da Aggiungere:**

| Nome | Tipo | Valore | Note |
|------|------|--------|------|
| `RESEND_API_KEY` | Secret | `re_tuachiave` | Già configurata ✅ |
| `WORKER_SHARED_KEY` | Secret | `felix_backend_2025` | Già configurata ✅ |
| `SHOPIFY_ADMIN_TOKEN` | Secret | Il tuo token | Già configurata ✅ |
| `SHOPIFY_SHOP` | Secret | Il tuo shop | Già configurata ✅ |

---

## 📄 **Come Funziona la Generazione PDF**

### **Tecnologia Usata: pdf-lib**

`pdf-lib` è una libreria JavaScript per creare e modificare PDF.

### **Flusso:**

```javascript
1. Worker riceve dati form
   ↓
2. Crea nuovo PDF con pdf-lib
   ↓
3. Aggiunge tutte le informazioni:
   - Nome cliente
   - Indirizzo
   - Pflegegrad
   - Prodotti selezionati
   - Firma digitale (immagine PNG)
   ↓
4. Salva PDF come bytes
   ↓
5. Converte in base64
   ↓
6. Allega a email Resend
   ↓
7. Invia a pflegeteufelagentur@gmail.com
```

---

## 📊 **Struttura del PDF Generato**

### **Pagina 1: Bestellformular**

```
┌─────────────────────────────────────────┐
│  Bestellformular Pflegebox              │
│  Pflege Teufel                          │
│                                         │
│  1. Name der/des Antragstellers         │
│     Anrede: Herr                        │
│     Vorname: Max    Name: Mustermann    │
│     Straße/Nr.: Musterstraße 123        │
│     PLZ/Ort: 51063 Köln                 │
│     Telefon: +49 221 1234567            │
│     E-Mail: max@example.com             │
│     Geburtsdatum: 15.05.1950            │
│     Versichertennummer: M123456789      │
│     Pflegegrad: 3                       │
│     Pflegekasse: AOK                    │
│                                         │
│  2. Angehörige(r)/Pflegeperson          │
│     [Dati oppure "GLEICHE PERSON"]      │
│                                         │
│  3. Pflegebox                           │
│     Ausgewählte Produkte:               │
│     ✓ Bettschutzeinlagen                │
│     ✓ FFP2 Masken                       │
│     ✓ Einmalhandschuhe                  │
│     ... altri prodotti ...              │
│                                         │
│     Handschuhgröße: M  Material: Nitril │
│                                         │
│  6. Unterschrift                        │
│     [Immagine firma]                    │
│     Unterschrieben am: 18.10.2025       │
│                                         │
│  ────────────────────────────────────── │
│  Agentur Pflege Teufel                  │
│  Regentenstraße 88 • 51063 Köln         │
│  IK: 590523228                          │
└─────────────────────────────────────────┘
```

---

## 📧 **Email Inviata**

### **Subject:**
```
📦 Neue Pflegebox Bestellung - Max Mustermann
```

### **Body:**
```
Neue Pflegebox Bestellung eingegangen!

Kunde: Max Mustermann
Email: max@example.com
Datum: 18.10.2025 um 14:30:15

Das ausgefüllte Bestellformular finden Sie im Anhang als PDF.

Mit freundlichen Grüßen
Pflege Teufel System
```

### **Attachment:**
```
📎 Pflegebox_Mustermann_18.10.2025.pdf (circa 50-100 KB)
```

---

## 🔧 **Personalizzazione PDF**

Se vuoi modificare il layout del PDF, edita la funzione `generatePflegeboxPDF()` in `cloudflare-worker-with-pdf.js`:

### **Cambiare Posizione Testo:**
```javascript
page1.drawText('Il tuo testo', {
  x: 70,          // Posizione orizzontale (da sinistra)
  y: yPosition,   // Posizione verticale (dal basso)
  size: 11,       // Dimensione font
  font: helveticaFont
});
```

### **Cambiare Colore:**
```javascript
color: rgb(0.75, 0.15, 0.14)  // Rosso Pflege Teufel
color: rgb(0, 0.5, 0)         // Verde
color: rgb(0, 0, 0)           // Nero
```

### **Aggiungere Immagini:**
```javascript
const image = await pdfDoc.embedPng(imageBytes);
page1.drawImage(image, {
  x: 50,
  y: 400,
  width: 200,
  height: 100
});
```

---

## 🚀 **Test del Sistema**

### **Test Locale (con wrangler dev):**

```bash
wrangler dev
```

Poi testa con:
```bash
node test-worker.js
```

### **Test Produzione:**

1. Deploy:
   ```bash
   npm run deploy
   ```

2. Compila il form su:
   ```
   https://pflegeteufel.de/pages/pflegebox-formular
   ```

3. Controlla email:
   ```
   pflegeteufelagentur@gmail.com
   ```

4. Verifica PDF allegato!

---

## 🐛 **Troubleshooting**

### **Problema: pdf-lib non trovata**

**Causa:** Dipendenze non installate o bundle non creato

**Soluzione:**
```bash
npm install
wrangler deploy
```

### **Problema: PDF vuoto o corrotto**

**Causa:** Errore nella generazione o encoding base64

**Soluzione:**
1. Controlla i log del Worker su Cloudflare Dashboard
2. Verifica che la firma sia in formato PNG base64
3. Controlla console browser (F12) per errori

### **Problema: Email non arriva con PDF**

**Causa:** Resend ha limiti su dimensione allegati (10MB max)

**Soluzione:**
1. Verifica dimensione PDF nei log Worker
2. Ottimizza immagini se troppo grandi
3. Verifica Resend API key

---

## 📈 **Prossimi Miglioramenti (Opzionali)**

### **1. Usa Template PDF Reale**

Invece di creare PDF da zero, compila il template ufficiale `Bestellformular_Pflegebox_senza_Vollmacht.pdf`:

```javascript
// Carica template da R2 Storage
const templateBytes = await env.PDF_STORAGE.get('template.pdf');
const pdfDoc = await PDFDocument.load(templateBytes);

// Compila i campi del form PDF
const form = pdfDoc.getForm();
form.getTextField('vorname').setText(formData.versicherte.vorname);
form.getTextField('name').setText(formData.versicherte.name);
// ... altri campi
```

### **2. Salva PDF su R2 Storage**

Archivia ogni PDF generato:

```javascript
await env.PDF_STORAGE.put(
  `pflegebox/${formData.bestelldatum}_${formData.versicherte.name}.pdf`,
  pdfBytes
);
```

### **3. Download PDF dal Browser**

Aggiungi endpoint per scaricare PDF:

```javascript
if (path === "/api/pflegebox/download-pdf") {
  return new Response(pdfBytes, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="pflegebox.pdf"'
    }
  });
}
```

---

## ✅ **Checklist Deploy**

- [ ] Installato Node.js
- [ ] Installato Wrangler (`npm install -g wrangler`)
- [ ] Fatto login (`wrangler login`)
- [ ] Installate dipendenze (`npm install`)
- [ ] Deployato Worker (`npm run deploy`)
- [ ] Configurate variabili d'ambiente su Cloudflare
- [ ] Testato con form live
- [ ] Ricevuto email con PDF
- [ ] Verificato PDF si apre correttamente

---

## 📞 **Supporto**

**Documentazione pdf-lib:**
- https://pdf-lib.js.org/

**Documentazione Cloudflare Workers:**
- https://developers.cloudflare.com/workers/

**Documentazione Wrangler:**
- https://developers.cloudflare.com/workers/wrangler/

---

**Creato da:** Claude Code Assistant
**Data:** 18 Ottobre 2025
**Version:** 1.0.0 - PDF System
