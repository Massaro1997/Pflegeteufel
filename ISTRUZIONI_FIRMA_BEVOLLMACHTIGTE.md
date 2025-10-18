# Istruzioni per aggiungere Firma Bevollmächtigte

## Modifiche da fare in `pflegebox-form-updated.html`:

### 1. Nello STEP 6, dopo il primo canvas firma (riga 323), aggiungi:

```html
<!-- Firma Bevollmächtigte (solo se Betreuer selezionato) -->
<div id="bevollmachtigteSignatureSection" class="signature-section" style="margin-top: 30px; display: none;">
    <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 10px;">Unterschrift Bevollmächtigte(r)</h3>
    <p style="font-size: 0.9rem; color: #666; margin-bottom: 15px;">Bitte unterschreiben Sie als Betreuer(in)</p>
    <canvas id="bevollmachtigteSignatureCanvas" class="signature-canvas" width="800" height="200"></canvas>
    <div class="signature-actions">
        <button type="button" class="clear-btn" onclick="clearBevollmachtigteSignature()">🗑️ Löschen</button>
        <span style="font-size: 0.85rem; color: #6c757d;">Im weißen Feld unterschreiben</span>
    </div>
</div>
```

### 2. Nello script JavaScript, modifica la sezione State (riga 363):

```javascript
// State
let currentStep = 1;
let canvas, ctx, isDrawing = false, signatureData = '';
let bevollmachtigteCanvas, bevollmachtigteCtx, isBevollmachtigteDrawing = false, bevollmachtigteSignatureData = '';
let angehoerigeSameAsPerson = false;
let isBevollmachtigte = false;  // Track se è selezionato Betreuer
```

### 3. Aggiungi listener per caregiverType nel DOMContentLoaded (dopo riga 376):

```javascript
// Listener per mostrare firma Bevollmächtigte
document.querySelectorAll('input[name="caregiverType"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        isBevollmachtigte = (this.value === 'Betreuer');
    });
});
```

### 4. Modifica la funzione initCanvas() per gestire entrambi i canvas (riga 401):

```javascript
// Signature Canvas
function initCanvas() {
    // Canvas versicherte
    canvas = document.getElementById('signatureCanvas');
    if (canvas) {
        ctx = canvas.getContext('2d');
        canvas.addEventListener('mousedown', (e) => startDrawing(e, 'versicherte'));
        canvas.addEventListener('mousemove', (e) => draw(e, 'versicherte'));
        canvas.addEventListener('mouseup', () => stopDrawing('versicherte'));
        canvas.addEventListener('mouseleave', () => stopDrawing('versicherte'));
        canvas.addEventListener('touchstart', (e) => handleTouchStart(e, 'versicherte'));
        canvas.addEventListener('touchmove', (e) => handleTouchMove(e, 'versicherte'));
        canvas.addEventListener('touchend', () => stopDrawing('versicherte'));
    }

    // Canvas bevollmächtigte (solo se Betreuer)
    if (isBevollmachtigte) {
        document.getElementById('bevollmachtigteSignatureSection').style.display = 'block';
        bevollmachtigteCanvas = document.getElementById('bevollmachtigteSignatureCanvas');
        if (bevollmachtigteCanvas) {
            bevollmachtigteCtx = bevollmachtigteCanvas.getContext('2d');
            bevollmachtigteCanvas.addEventListener('mousedown', (e) => startDrawing(e, 'bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('mousemove', (e) => draw(e, 'bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('mouseup', () => stopDrawing('bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('mouseleave', () => stopDrawing('bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('touchstart', (e) => handleTouchStart(e, 'bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('touchmove', (e) => handleTouchMove(e, 'bevollmachtigte'));
            bevollmachtigteCanvas.addEventListener('touchend', () => stopDrawing('bevollmachtigte'));
        }
    } else {
        document.getElementById('bevollmachtigteSignatureSection').style.display = 'none';
    }
}
```

### 5. Modifica funzioni drawing per supportare entrambi i canvas:

```javascript
function handleTouchStart(e, type) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {clientX: touch.clientX, clientY: touch.clientY});
    if (type === 'bevollmachtigte') {
        bevollmachtigteCanvas.dispatchEvent(mouseEvent);
    } else {
        canvas.dispatchEvent(mouseEvent);
    }
}

function handleTouchMove(e, type) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {clientX: touch.clientX, clientY: touch.clientY});
    if (type === 'bevollmachtigte') {
        bevollmachtigteCanvas.dispatchEvent(mouseEvent);
    } else {
        canvas.dispatchEvent(mouseEvent);
    }
}

function startDrawing(e, type) {
    const currentCanvas = type === 'bevollmachtigte' ? bevollmachtigteCanvas : canvas;
    const currentCtx = type === 'bevollmachtigte' ? bevollmachtigteCtx : ctx;

    if (type === 'bevollmachtigte') {
        isBevollmachtigteDrawing = true;
    } else {
        isDrawing = true;
    }

    const rect = currentCanvas.getBoundingClientRect();
    currentCtx.beginPath();
    currentCtx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e, type) {
    const currentCanvas = type === 'bevollmachtigte' ? bevollmachtigteCanvas : canvas;
    const currentCtx = type === 'bevollmachtigte' ? bevollmachtigteCtx : ctx;
    const currentIsDrawing = type === 'bevollmachtigte' ? isBevollmachtigteDrawing : isDrawing;

    if (!currentIsDrawing) return;
    const rect = currentCanvas.getBoundingClientRect();
    currentCtx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    currentCtx.strokeStyle = '#2c3e50';
    currentCtx.lineWidth = 2;
    currentCtx.lineCap = 'round';
    currentCtx.stroke();
}

function stopDrawing(type) {
    if (type === 'bevollmachtigte') {
        if (isBevollmachtigteDrawing) {
            isBevollmachtigteDrawing = false;
            bevollmachtigteSignatureData = bevollmachtigteCanvas.toDataURL();
        }
    } else {
        if (isDrawing) {
            isDrawing = false;
            signatureData = canvas.toDataURL();
        }
    }
}

function clearSignature() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    signatureData = '';
}

function clearBevollmachtigteSignature() {
    bevollmachtigteCtx.clearRect(0, 0, bevollmachtigteCanvas.width, bevollmachtigteCanvas.height);
    bevollmachtigteSignatureData = '';
}
```

### 6. Modifica collectFormData() per includere firma bevollmächtigte (riga 580):

```javascript
signatures: {
    versicherte: signatureData,
    bevollmachtigte: isBevollmachtigte ? bevollmachtigteSignatureData : null
},
```

### 7. Nel form submit, verifica entrambe le firme (riga 597):

```javascript
if (!signatureData) {
    alert('⚠️ Bitte unterschreiben Sie das Formular (Versicherte)');
    return;
}

if (isBevollmachtigte && !bevollmachtigteSignatureData) {
    alert('⚠️ Bitte unterschreiben Sie als Bevollmächtigte(r)');
    return;
}
```

---

## Modifiche nel Worker (`cloudflare-worker-pdf-template.js`):

### Nella Sezione 6, dopo la firma versicherte (circa riga 470), aggiungi:

```javascript
// Firma Bevollmächtigte (se presente)
if (formData.signatures?.bevollmachtigte && a.data?.typ === 'Betreuer') {
  console.log('✍️ Disegno firma Bevollmächtigte');
  try {
    const bevollmachtigteSignatureBytes = Uint8Array.from(
      atob(formData.signatures.bevollmachtigte.split(',')[1]),
      c => c.charCodeAt(0)
    );
    const bevollmachtigteSignatureImage = await pdfDoc.embedPng(bevollmachtigteSignatureBytes);

    const bevollmachtScale = 0.20;  // Stessa scala della firma versicherte
    const bevollmachtSignatureDims = bevollmachtigteSignatureImage.scale(bevollmachtScale);

    // Posiziona firma Bevollmächtigte a destra della firma Versicherte
    page1.drawImage(bevollmachtigteSignatureImage, {
      x: 300,  // A destra, DA CALIBRARE con settore
      y: 122,  // Stessa Y della firma versicherte
      width: bevollmachtSignatureDims.width,
      height: bevollmachtSignatureDims.height
    });

    console.log('✅ Firma Bevollmächtigte disegnata');
  } catch (err) {
    console.error('❌ Errore firma Bevollmächtigte:', err);
  }
}
```

---

Queste sono TUTTE le modifiche necessarie. Dopo averle applicate:

1. Deploy del worker
2. Test con caregiverType = "Betreuer"
3. Verifica che entrambe le firme appaiano nel PDF nella Sezione 6
4. Dammi il settore esatto per la posizione X della firma Bevollmächtigte guardando il PDF con la griglia
