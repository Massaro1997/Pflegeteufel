# 🚀 Istruzioni Deploy Sistema Pflegebox

## Metodo 1: Upload Manuale via Shopify Admin (PIÙ SEMPLICE)

### Step 1: Upload JavaScript File

1. **Vai su Shopify Admin**
2. **Online Store → Themes**
3. **Clicca "..." sul tema attivo → Edit code**
4. **Sezione "Assets"** (nella sidebar sinistra)
5. **Clicca "Add a new asset"**
6. **Upload file**: Seleziona `assets/pflegebox-form.js`
7. **Save**

✅ Verifica: Dovresti vedere `pflegebox-form.js` nella lista Assets

---

### Step 2: Upload Liquid Template

1. **Sempre in "Edit code"**
2. **Sezione "Templates"** (nella sidebar sinistra)
3. **Clicca "Add a new template"**
4. **Seleziona**: "page" dal dropdown
5. **Nome**: `bestellformular-pflegebox`
6. **Clicca "Create template"**
7. **Apri il file `templates/page.bestellformular-pflegebox.liquid`** dal tuo computer
8. **Copia TUTTO il contenuto**
9. **Incolla nel editor Shopify**
10. **Save**

✅ Verifica: Dovresti vedere `page.bestellformular-pflegebox.liquid` nella lista Templates

---

### Step 3: Crea la Pagina

1. **Vai su: Online Store → Pages**
2. **Clicca "Add page"**
3. **Compila:**
   - Title: `Bestellformular Pflegebox`
   - Content: (puoi lasciare vuoto o mettere testo introduttivo)
4. **Tema → Template suffix**
5. **Seleziona**: `bestellformular-pflegebox`
6. **Visibilità**: Visible
7. **Save**

✅ Verifica: La pagina è stata creata

---

### Step 4: Test

1. **Clicca "View page"** o vai su:
   `https://pflegeteufel.de/pages/bestellformular-pflegebox`

2. **Dovresti vedere:**
   - ✅ Form con 6 step
   - ✅ Progress bar
   - ✅ Step 1 con TUTTI i campi (inclusi Geburtsdatum, Versichertennummer, Pflegekasse)
   - ✅ Step 2 con la domanda "Ist die Pflegeperson dieselbe?"

3. **Test rapido:**
   - Compila Step 1
   - Vai a Step 2
   - Clicca "Ja" → Verifica che appaia box verde di conferma
   - Clicca "Nein" → Verifica che appaia il form completo

---

## Metodo 2: Via Shopify CLI (Se disponibile)

### Prerequisiti

```bash
# Installa Shopify CLI (se non hai)
npm install -g @shopify/cli @shopify/theme
```

### Deploy

```bash
cd D:\Work\www.pflegeteufel.de

# Login (prima volta)
shopify theme auth --store pflegeteufel.myshopify.com

# Push solo i file modificati
shopify theme push --only assets/pflegebox-form.js templates/page.bestellformular-pflegebox.liquid

# Oppure push tutto il tema
shopify theme push
```

---

## Metodo 3: Via API (Automatico - Avanzato)

Se vuoi automatizzare, posso creare uno script che usa l'API Shopify:

```javascript
// Richiede SHOPIFY_ACCESS_TOKEN
const uploadToShopify = async () => {
  // Upload asset
  await fetch(`https://pflegeteufel.myshopify.com/admin/api/2024-01/themes/{theme_id}/assets.json`, {
    method: 'PUT',
    headers: {
      'X-Shopify-Access-Token': 'YOUR_ACCESS_TOKEN',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      asset: {
        key: 'assets/pflegebox-form.js',
        value: fs.readFileSync('assets/pflegebox-form.js', 'utf8')
      }
    })
  });
};
```

---

## ✅ Checklist Post-Deploy

Dopo aver completato l'upload:

- [ ] File `pflegebox-form.js` visibile in Assets
- [ ] Template `page.bestellformular-pflegebox.liquid` visibile in Templates
- [ ] Pagina creata con template assegnato
- [ ] Pagina accessibile pubblicamente
- [ ] Form si carica correttamente
- [ ] Step 2 mostra toggle "Stessa persona?"
- [ ] Console browser (F12) senza errori JavaScript
- [ ] Network tab mostra che `pflegebox-form.js` si carica (Status 200)

---

## 🐛 Troubleshooting Deploy

### Problema: "Asset not found" quando carichi JS

**Soluzione:**
1. Verifica che il file sia in `assets/` (non in una sottocartella)
2. Nome file deve essere esattamente: `pflegebox-form.js` (minuscolo, con trattino)

### Problema: Template non appare nella lista

**Soluzione:**
1. Verifica che il file sia in `templates/`
2. Nome deve iniziare con `page.` → `page.bestellformular-pflegebox.liquid`
3. Refresh pagina "Edit code"

### Problema: Pagina mostra errore "Template not found"

**Soluzione:**
1. Vai su Pages → Edit page
2. Controlla sezione "Theme template"
3. Ri-seleziona `bestellformular-pflegebox` dal dropdown
4. Save

### Problema: JavaScript non si carica (console mostra 404)

**Soluzione:**
1. Apri template Liquid
2. Verifica questa riga:
   ```liquid
   <script src="{{ 'pflegebox-form.js' | asset_url }}"></script>
   ```
3. Assicurati che `pflegebox-form.js` sia esattamente il nome del file in Assets

---

## 📊 Verifica Deploy Riuscito

### Test Console Browser:

```javascript
// Apri console browser (F12) sulla pagina del form
// Digita:
window.pflegeboxForm

// Dovresti vedere:
// { toggleAngehoerigeSection: ƒ, editAngehoerigeData: ƒ, ... }
```

Se vedi l'oggetto → ✅ JavaScript caricato correttamente

Se vedi `undefined` → ❌ JavaScript non caricato

---

## 🔄 Update File Esistenti

Se devi aggiornare i file dopo modifiche:

### Via Admin:

1. **Assets → Trova `pflegebox-form.js`**
2. **Clicca sul file per aprirlo**
3. **Modifica o sostituisci contenuto**
4. **Save**

### Via CLI:

```bash
shopify theme push --only assets/pflegebox-form.js
```

---

## 📝 Note Importanti

1. **Backup:** Prima di modificare, fai sempre backup del tema:
   ```bash
   shopify theme pull --path backup-$(date +%Y%m%d)
   ```

2. **Testing:** Testa SEMPRE su tema di sviluppo prima di pushare su live

3. **Cache:** Dopo upload, fai hard refresh (Ctrl+Shift+R) per vedere modifiche

4. **Versioning:** Considera usare Git per versionare le modifiche:
   ```bash
   git add assets/pflegebox-form.js templates/page.bestellformular-pflegebox.liquid
   git commit -m "Add pflegebox form with conditional logic"
   ```

---

## 🎯 Prossimi Passi Dopo Deploy

1. ✅ Verifica form funzionante
2. ✅ Deploy endpoint Worker (vedi worker-pflegebox-endpoint.js)
3. ✅ Configura RESEND_API_KEY o SENDGRID_API_KEY
4. ✅ Test completo end-to-end (submit → email)
5. ✅ Collega pagina al menu navigazione
6. ✅ Test su mobile
7. ✅ Analytics/tracking se necessario

---

## 📞 Supporto

File di riferimento:
- [README_PFLEGEBOX_SYSTEM.md](./README_PFLEGEBOX_SYSTEM.md) - Documentazione completa
- [ISTRUZIONI_PFLEGEBOX_FORM.md](./ISTRUZIONI_PFLEGEBOX_FORM.md) - Modifiche alternative
- [worker-pflegebox-endpoint.js](./worker-pflegebox-endpoint.js) - Backend code

---

**✨ Buon Deploy!**
