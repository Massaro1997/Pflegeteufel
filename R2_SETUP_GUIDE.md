# 📦 Cloudflare R2 Setup per PDF Template

**Obiettivo:** Caricare il template PDF su Cloudflare R2 Storage per usarlo nel Worker

---

## 🎯 **Cos'è Cloudflare R2?**

R2 è lo storage object di Cloudflare (simile ad Amazon S3):
- ✅ Illimitato upload/download (no costi egress)
- ✅ Integrazione diretta con Workers
- ✅ Piano gratuito: 10 GB storage

---

## 📋 **Step-by-Step: Configurazione R2**

### **Step 1: Crea un Bucket R2**

1. Vai su **Cloudflare Dashboard:** https://dash.cloudflare.com
2. Nel menu laterale, clicca **R2**
3. Clicca **"Create bucket"**
4. **Bucket name:** `pflegebox-templates`
5. **Location:** Automatic (o Europe se preferisci)
6. Clicca **"Create bucket"**

---

### **Step 2: Carica il PDF Template**

1. Apri il bucket `pflegebox-templates`
2. Clicca **"Upload"**
3. Seleziona il file: `Bestellformular_Pflegebox_senza_Vollmacht.pdf`
4. Clicca **"Upload"**

**IMPORTANTE:** Il nome del file deve essere esattamente:
```
Bestellformular_Pflegebox_senza_Vollmacht.pdf
```

---

### **Step 3: Collega R2 al Worker**

1. Vai su **Workers & Pages**
2. Seleziona il tuo Worker: `shopify-backend`
3. Vai su **Settings → Variables**
4. Scorri fino a **"R2 Bucket Bindings"**
5. Clicca **"Add binding"**

**Configurazione binding:**
```
Variable name: PDF_TEMPLATE
R2 bucket: pflegebox-templates
```

6. Clicca **"Save"**

---

### **Step 4: Aggiorna wrangler.toml**

Aggiungi la configurazione R2 nel file `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "PDF_TEMPLATE"
bucket_name = "pflegebox-templates"
```

---

## 🧪 **Test della Configurazione**

### **Metodo 1: Via Dashboard**

1. Vai su R2 → `pflegebox-templates`
2. Verifica che il file PDF sia presente
3. Clicca sul file per vedere i dettagli

### **Metodo 2: Via Worker (dopo deploy)**

Il Worker tenterà automaticamente di caricare il PDF da R2:

```javascript
const templateObject = await env.PDF_TEMPLATE.get('Bestellformular_Pflegebox_senza_Vollmacht.pdf');
```

Se il PDF esiste, lo userà come template.
Se non esiste, creerà un PDF da zero (fallback).

---

## 📊 **Come Funziona il Nuovo Sistema**

### **Flusso con Template:**

```
1. Form inviato
   ↓
2. Worker riceve dati
   ↓
3. Worker carica PDF template da R2
   ↓
4. Worker COMPILA i campi del PDF template
   ├─ Se PDF ha campi form → Compila i campi
   └─ Se PDF è statico → Scrive testo alle coordinate
   ↓
5. Worker aggiunge firma come immagine
   ↓
6. Worker salva PDF compilato
   ↓
7. Worker invia email con PDF allegato
   ↓
8. ✅ Email arriva con PDF professionale compilato
```

---

## 🎨 **Vantaggi del Template**

### **Prima (PDF da zero):**
- ❌ Layout fatto a mano con pdf-lib
- ❌ Nessun logo o branding
- ❌ Font e stile basic

### **Ora (con Template):**
- ✅ Layout professionale del tuo PDF ufficiale
- ✅ Logo Pflege Teufel incluso
- ✅ Stile e formattazione originali
- ✅ Campi nelle posizioni corrette
- ✅ Pronto per la Pflegekasse

---

## 🔍 **Verifica Campi PDF**

Per vedere se il tuo PDF ha campi compilabili:

### **Metodo 1: Adobe Acrobat**
1. Apri il PDF con Adobe Acrobat
2. Vai su **Tools → Prepare Form**
3. Se vedi campi evidenziati → Il PDF ha campi form ✅
4. Se non vedi campi → Il PDF è statico ❌

### **Metodo 2: pdf-lib (automatico)**

Il Worker fa questo controllo automaticamente:

```javascript
const form = pdfDoc.getForm();
const fields = form.getFields();

if (fields.length > 0) {
  console.log(`PDF ha ${fields.length} campi form`);
  // Compila i campi
} else {
  console.log('PDF statico, scrivo testo alle coordinate');
  // Scrivi testo
}
```

---

## 📝 **Nomi Campi PDF Comuni**

Se il PDF ha campi form, potrebbero chiamarsi:

**Antragsteller:**
- `vorname`, `firstName`, `first_name`
- `name`, `lastName`, `last_name`
- `strasse`, `street`, `address`
- `plz`, `zip`, `postal_code`
- `ort`, `city`, `town`
- `telefon`, `phone`, `tel`
- `email`, `e-mail`, `mail`
- `geburtsdatum`, `birth_date`, `dob`
- `versichertennummer`, `insurance_number`
- `pflegegrad`, `care_level`

**Checkbox/Radio:**
- `anrede_frau`, `anrede_herr`
- `pflegegrad_1`, `pflegegrad_2`, `pflegegrad_3`, etc.
- `versichert_gesetzlich`, `versichert_privat`

**Prodotti:**
- `bettschutzeinlagen`, `bed_pads`
- `fingerlinge`, `finger_cots`
- `ffp2`, `ffp2_masks`
- `einmalhandschuhe`, `disposable_gloves`

---

## 🐛 **Troubleshooting**

### **Problema: PDF non viene caricato da R2**

**Causa:** Binding non configurato o nome file sbagliato

**Soluzione:**
1. Verifica che il binding `PDF_TEMPLATE` esista nel Worker
2. Verifica che il file si chiami esattamente `Bestellformular_Pflegebox_senza_Vollmacht.pdf`
3. Ri-deploya il Worker dopo aver aggiunto il binding

### **Problema: Campi non vengono compilati**

**Causa:** Nomi campi non corrispondono

**Soluzione:**
1. Usa Adobe Acrobat per vedere i nomi esatti dei campi
2. Aggiorna il codice Worker con i nomi corretti
3. Verifica i log del Worker per vedere quali campi esistono

### **Problema: Firma non appare**

**Causa:** Coordinate sbagliate o pagina sbagliata

**Soluzione:**
1. Aggiusta le coordinate X/Y nel codice
2. Verifica che la firma vada sulla pagina corretta (es. pagina 3 invece di pagina 1)

---

## 💰 **Costi R2**

**Piano Gratuito:**
- ✅ 10 GB storage
- ✅ 1 milione di operazioni Class A/mese (write)
- ✅ 10 milioni di operazioni Class B/mese (read)
- ✅ **Egress gratuito** (a differenza di S3!)

Per Pflegebox:
- 1 PDF template: ~500 KB
- 1000 ordini/mese: ~1000 reads = **GRATIS** ✅

---

## 🚀 **Deploy del Nuovo Worker**

Una volta configurato R2:

```bash
# Aggiungi binding a wrangler.toml
# Poi deploy
npx wrangler deploy cloudflare-worker-pdf-template.js
```

---

## 📧 **Risultato Finale**

L'email ricevuta conterrà:

**Allegato:**
```
📎 Bestellformular_Pflegebox_Mustermann_18.10.2025.pdf
```

**Contenuto PDF:**
- ✅ Layout professionale originale
- ✅ Logo Pflege Teufel
- ✅ Tutti i campi compilati
- ✅ Firma del cliente
- ✅ Pronto da stampare e inviare alla Pflegekasse

---

**Created by:** Claude Code Assistant
**Date:** 18 Ottobre 2025
**Version:** 2.0.0 - PDF Template System
