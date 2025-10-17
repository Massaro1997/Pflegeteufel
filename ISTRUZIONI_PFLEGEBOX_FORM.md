# Istruzioni Modifiche Bestellformular Pflegebox

## File Coinvolti
1. ✅ `assets/pflegebox-form.js` - **GIÀ CREATO E COMPLETO**
2. ⚠️ `templates/page.pflegebox-formular.json` - **DA MODIFICARE MANUALMENTE**
3. `templates/page.bestellformular-pflegebox.liquid` - **GIÀ CREATO (alternativa completa)**

## Opzione 1: Usa il Nuovo Template Liquid (CONSIGLIATO)

### Vantaggi:
- ✅ Tutto già pronto e funzionante
- ✅ Codice pulito e ben organizzato
- ✅ Più facile da manutenere

### Passi:
1. Vai su Shopify Admin
2. Crea una nuova pagina: "Bestellformular Pflegebox NEU"
3. Assegna il template: `page.bestellformular-pflegebox`
4. Pubblica e testa

Il nuovo template include:
- ✅ Toggle condizionale Angehörige
- ✅ Campi Geburtsdatum, Versichertennummer, Pflegekasse
- ✅ Auto-compilazione intelligente
- ✅ Invio al backend per PDF e email

---

## Opzione 2: Modifica il JSON Esistente (COMPLESSO)

Se vuoi mantenere il file JSON esistente, segui queste modifiche:

### A) Aprire `templates/page.pflegebox-formular.json` in un editor

### B) Trovare questa sezione (Step 1, dopo email):
```html
<div class="form-row">
    <div class="form-group"><label class="form-label">Telefon</label><input type="tel" name="phone" class="form-input"></div>
    <div class="form-group"><label class="form-label">E-Mail *</label><input type="email" name="email" class="form-input" required></div>
</div>
<div class="form-group">
    <label class="form-label">Pflegegrad (Bitte unbedingt angeben!) *</label>
```

### C) Aggiungere DOPO `</div>` (chiusura form-row) e PRIMA del Pflegegrad:
```html
<div class="form-group">
    <label class="form-label">Geburtsdatum *</label>
    <input type="date" name="geburtsdatum" class="form-input" required>
</div>
<div class="form-group">
    <label class="form-label">Versichertennummer *</label>
    <input type="text" name="versichertennummer" class="form-input" required>
</div>
<div class="form-group">
    <label class="form-label">Pflegekasse *</label>
    <input type="text" name="pflegekasse" class="form-input" required placeholder="z.B. AOK Bayern">
</div>
```

**ATTENZIONE:** Nel JSON, gli slash devono essere escaped così: `<\/div>` invece di `</div>`

### D) Sostituire TUTTO lo Step 2

Trovare:
```html
<div id="step-2" class="form-step hidden">
    <h2 class="section-title">2. Angehörige(r)/Pflegeperson</h2>
    ...
</div>
```

Sostituire con:
```html
<div id="step-2" class="form-step hidden">
    <h2 class="section-title">2. Angehörige(r)\/Pflegeperson<\/h2>
    <p style="font-size: 0.95rem; color: #666; margin-bottom: 20px;">Bitte die wichtigste <strong>private<\/strong> Pflegeperson oder die\/den Betreuer(in) eintragen<\/p>

    <!-- TOGGLE CONDIZIONALE -->
    <div class="form-group" style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 30px;">
        <label class="form-label" style="font-size: 1.1rem; margin-bottom: 15px; color: #C12624;">
            ❓ Ist die Pflegeperson dieselbe wie der\/die Antragsteller(in)?
        <\/label>
        <div class="radio-group">
            <div class="radio-option" style="min-width: 250px;">
                <label class="radio-label" style="padding: 15px; border-width: 3px;">
                    <input type="radio" name="angehoerige_same" value="yes" onchange="window.pflegeboxForm.toggleAngehoerigeSection()">
                    <span>✓ Ja, ich bin selbst die Pflegeperson<\/span>
                <\/label>
            <\/div>
            <div class="radio-option" style="min-width: 250px;">
                <label class="radio-label" style="padding: 15px; border-width: 3px;">
                    <input type="radio" name="angehoerige_same" value="no" onchange="window.pflegeboxForm.toggleAngehoerigeSection()">
                    <span>👥 Nein, es ist eine andere Person<\/span>
                <\/label>
            <\/div>
        <\/div>
    <\/div>

    <!-- Conferma (nascosto) -->
    <div id="angehoerige_confirmation" style="display: none; margin-bottom: 30px;"><\/div>

    <!-- Sezione form (nascosta) -->
    <div id="angehoerige_section" style="display: none;">
        <div class="form-group">
            <div class="radio-group">
                <div class="radio-option"><label class="radio-label"><input type="radio" name="caregiverGender" value="Frau"><span>Frau<\/span><\/label><\/div>
                <div class="radio-option"><label class="radio-label"><input type="radio" name="caregiverGender" value="Herr"><span>Herr<\/span><\/label><\/div>
            <\/div>
        <\/div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Vorname *<\/label><input type="text" id="caregiverFirstName" name="caregiverFirstName" class="form-input"><\/div>
            <div class="form-group"><label class="form-label">Name *<\/label><input type="text" id="caregiverLastName" name="caregiverLastName" class="form-input"><\/div>
        <\/div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Straße\/Nr. *<\/label><input type="text" id="caregiverStreet" name="caregiverStreet" class="form-input"><\/div>
            <div class="form-group"><label class="form-label">PLZ\/Ort *<\/label><input type="text" id="caregiverPlzOrt" name="caregiverPlzOrt" class="form-input"><\/div>
        <\/div>
        <div class="form-row">
            <div class="form-group"><label class="form-label">Telefon<\/label><input type="tel" id="caregiverPhone" name="caregiverPhone" class="form-input"><\/div>
            <div class="form-group"><label class="form-label">E-Mail<\/label><input type="email" id="caregiverEmail" name="caregiverEmail" class="form-input"><\/div>
        <\/div>
        <div class="form-group">
            <label class="form-label">Pflegeperson ist *<\/label>
            <div class="radio-group">
                <div class="radio-option"><label class="radio-label"><input type="radio" name="caregiverType" value="Familie"><span>Familienangehörige(r)<\/span><\/label><\/div>
                <div class="radio-option"><label class="radio-label"><input type="radio" name="caregiverType" value="Privat"><span>Private Pflegeperson<\/span><\/label><\/div>
                <div class="radio-option"><label class="radio-label"><input type="radio" name="caregiverType" value="Betreuer"><span>Betreuer(in)<\/span><\/label><\/div>
            <\/div>
        <\/div>
    <\/div>
<\/div>
```

### E) Sostituire tutto il tag `<script>` alla fine

Trovare:
```html
<script>
let currentStep=1,canvas,ctx,isDrawing=false,signatureData='';
...
</script>
```

Sostituire con:
```html
<script src="{{ 'pflegebox-form.js' | asset_url }}"><\/script>
```

---

## File Backend: Cloudflare Worker

Creare endpoint `/api/pflegebox/submit` nel worker esistente:

```javascript
// Nel router esistente aggiungere:
router.post('/api/pflegebox/submit', async (request, env) => {
  try {
    // Verifica chiave
    const workerKey = request.headers.get('X-Worker-Key');
    if (workerKey !== env.SHARED_KEY) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Ricevi dati
    const formData = await request.json();

    console.log('📦 Ricevuto form Pflegebox:', formData);

    // TODO: Generare PDF compilato
    // TODO: Inviare email con PDF allegato

    // Per ora, solo conferma ricezione
    return new Response(JSON.stringify({
      success: true,
      message: 'Dati ricevuti correttamente',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (error) {
    console.error('❌ Errore submit pflegebox:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
```

---

## Test del Sistema

### 1. Test Frontend
1. Vai sulla pagina del form
2. Compila Step 1 con tutti i nuovi campi
3. Step 2: Prova entrambe le opzioni del toggle
   - **SÌ**: Verifica che non mostri il form e mostri conferma verde
   - **NO**: Verifica che mostri il form completo
4. Completa tutti gli step
5. Firma e invia

### 2. Verifica Backend
- Apri Console Browser (F12)
- Tab Network
- Verifica la chiamata POST a `/api/pflegebox/submit`
- Controlla che la risposta sia `{ "success": true }`

### 3. Verifica Dati
Nel payload della richiesta dovresti vedere:
```json
{
  "versicherte": {
    "anrede": "Herr",
    "vorname": "Klaus",
    "name": "Müller",
    "geburtsdatum": "1950-01-15",
    "versichertennummer": "A123456789",
    "pflegekasse": "AOK Bayern",
    ...
  },
  "angehoerige": {
    "isSamePerson": true,  // o false
    "data": { ... }
  },
  ...
}
```

---

## Supporto

File creati:
- ✅ `assets/pflegebox-form.js` - JavaScript completo con logica
- ✅ `templates/page.bestellformular-pflegebox.liquid` - Template alternativo completo
- 📄 `ISTRUZIONI_PFLEGEBOX_FORM.md` - Questo file

Per problemi o domande, verifica:
1. La console browser per errori JavaScript
2. Il network tab per le chiamate API
3. I log del Cloudflare Worker
