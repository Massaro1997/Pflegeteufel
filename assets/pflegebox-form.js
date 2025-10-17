/**
 * Pflegebox Form - Sistema completo con auto-compilazione e logica condizionale
 * Autore: Calogero Massaro
 * Data: 2025
 */

// ==================== STATO GLOBALE ====================
const PflegeboxForm = {
  currentStep: 1,
  maxSteps: 7,
  canvas: null,
  ctx: null,
  isDrawing: false,
  signatureData: '',
  canvasBevollmaechtigter: null,
  ctxBevollmaechtigter: null,
  isDrawingBevollmaechtigter: false,
  signatureDataBevollmaechtigter: '',

  // Dati form
  formData: {
    versicherte: {},
    angehoerige: {
      isSamePerson: false,
      data: {}
    },
    pflegebox: {},
    delivery: {},
    invoice: {},
    signatures: {}
  },

  // Worker API URL
  workerBaseUrl: 'https://shopify-backend.massarocalogero1997.workers.dev',
  sharedKey: 'felix_backend_2025'
};

// ==================== INIT ====================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Pflegebox Form inizializzato');

  // Init signature canvas
  initCanvas();

  // Event listeners
  setupEventListeners();

  // Ripristina sessione se presente
  restoreFormState();

  // Update progress
  updateProgress();

  console.log('✅ Form pronto');
});

// ==================== SETUP EVENT LISTENERS ====================
function setupEventListeners() {
  // Radio buttons Sozialamt
  document.querySelectorAll('input[name="versicherte_typ"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      const sozialamtGroup = document.getElementById('sozialamt_group');
      if (sozialamtGroup) {
        sozialamtGroup.style.display = (this.value === 'sozialamt') ? 'block' : 'none';
      }
    });
  });

  // Checkbox handschuhe mostra opzioni
  const handschuheCheckbox = document.getElementById('handschuhe_checkbox');
  if (handschuheCheckbox) {
    handschuheCheckbox.addEventListener('change', function() {
      const handschuheOptions = document.getElementById('handschuhe_options');
      if (handschuheOptions) {
        handschuheOptions.style.display = this.checked ? 'block' : 'none';
      }
    });
  }

  // Checkbox bevollmaechtigter signature
  const consentVollmacht = document.getElementById('consent_vollmacht');
  if (consentVollmacht) {
    consentVollmacht.addEventListener('change', function() {
      const bevollmaechtigterSection = document.getElementById('bevollmaechtigter_signature');
      if (bevollmaechtigterSection) {
        bevollmaechtigterSection.style.display = this.checked ? 'block' : 'none';
        if (this.checked) {
          setTimeout(() => initCanvasBevollmaechtigter(), 100);
        }
      }
    });
  }

  // Bottoni navigazione
  document.querySelectorAll('.btn-next').forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        nextStep();
      }
    });
  });

  document.querySelectorAll('.btn-prev').forEach(btn => {
    btn.addEventListener('click', prevStep);
  });

  // Save form state on input changes
  const form = document.getElementById('pflegeboxForm');
  if (form) {
    form.addEventListener('input', saveFormState);
  }
}

// ==================== TOGGLE ANGEHÖRIGE SECTION (LOGICA CONDIZIONALE) ====================
function toggleAngehoerigeSection() {
  const isSameRadio = document.querySelector('input[name="angehoerige_same"]:checked');
  if (!isSameRadio) return;

  const isSame = isSameRadio.value === 'yes';
  const angehoerigeSection = document.getElementById('angehoerige_section');
  const angehoerigeConfirmation = document.getElementById('angehoerige_confirmation');

  if (isSame) {
    // Nascondi sezione e copia dati da Step 1
    if (angehoerigeSection) angehoerigeSection.style.display = 'none';

    PflegeboxForm.formData.angehoerige.isSamePerson = true;
    PflegeboxForm.formData.angehoerige.data = { ...collectStep1Data() };

    // Mostra conferma
    if (angehoerigeConfirmation) {
      const fullName = `${PflegeboxForm.formData.angehoerige.data.vorname || ''} ${PflegeboxForm.formData.angehoerige.data.name || ''}`.trim();
      angehoerigeConfirmation.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px; background: #e7f5e7; padding: 20px; border-radius: 8px; border: 2px solid #28a745;">
          <div style="font-size: 2.5rem;">✓</div>
          <div style="flex: 1;">
            <strong style="color: #28a745; font-size: 1.1rem;">Daten übernommen</strong>
            <p style="margin: 5px 0 0 0; color: #555;">
              Die Daten der Pflegeperson entsprechen denen des Antragstellers
              ${fullName ? `<strong>(${fullName})</strong>` : ''}
            </p>
          </div>
          <button type="button" onclick="window.pflegeboxForm.editAngehoerigeData()"
                  style="padding: 8px 16px; background: white; border: 2px solid #28a745; color: #28a745; border-radius: 6px; cursor: pointer; font-weight: 600;">
            Ändern
          </button>
        </div>
      `;
      angehoerigeConfirmation.style.display = 'block';
    }

    // Rimuovi required dai campi Angehörige
    setAngehoerigeFieldsRequired(false);

    console.log('✅ Angehörige: stessa persona del richiedente');

  } else {
    // Mostra sezione per compilazione manuale
    if (angehoerigeSection) angehoerigeSection.style.display = 'block';
    if (angehoerigeConfirmation) angehoerigeConfirmation.style.display = 'none';

    PflegeboxForm.formData.angehoerige.isSamePerson = false;
    PflegeboxForm.formData.angehoerige.data = {};

    // Aggiungi required ai campi Angehörige
    setAngehoerigeFieldsRequired(true);

    console.log('✅ Angehörige: persona diversa');
  }

  saveFormState();
}

function editAngehoerigeData() {
  const radioNo = document.querySelector('input[name="angehoerige_same"][value="no"]');
  if (radioNo) {
    radioNo.checked = true;
    toggleAngehoerigeSection();
  }
}

function setAngehoerigeFieldsRequired(required) {
  const fields = [
    'angehoerige_vorname',
    'angehoerige_name',
    'angehoerige_strasse',
    'angehoerige_plz',
    'angehoerige_ort'
  ];

  fields.forEach(fieldId => {
    const field = document.getElementById(fieldId);
    if (field) {
      if (required) {
        field.setAttribute('required', 'required');
      } else {
        field.removeAttribute('required');
      }
    }
  });

  // Radio button angehoerige_typ
  const angehoerigeTypRadios = document.querySelectorAll('input[name="angehoerige_typ"]');
  angehoerigeTypRadios.forEach(radio => {
    if (required) {
      radio.setAttribute('required', 'required');
    } else {
      radio.removeAttribute('required');
    }
  });
}

// ==================== COLLECT DATA FUNCTIONS ====================
function collectStep1Data() {
  const form = document.getElementById('pflegeboxForm');
  if (!form) return {};

  const plz = document.getElementById('versicherte_plz')?.value || '';
  const ort = document.getElementById('versicherte_ort')?.value || '';

  return {
    anrede: getRadioValue('versicherte_anrede'),
    vorname: document.getElementById('versicherte_vorname')?.value || '',
    name: document.getElementById('versicherte_name')?.value || '',
    strasse: document.getElementById('versicherte_strasse')?.value || '',
    plzOrt: `${plz} ${ort}`.trim(),
    telefon: document.getElementById('versicherte_telefon')?.value || '',
    email: document.getElementById('versicherte_email')?.value || '',
    geburtsdatum: document.getElementById('versicherte_geburtsdatum')?.value || '',
    versichertennummer: document.getElementById('versicherte_nummer')?.value || '',
    pflegegrad: getRadioValue('versicherte_pflegegrad'),
    versicherteTyp: getRadioValue('versicherte_typ'),
    sozialamt: document.getElementById('versicherte_sozialamt')?.value || '',
    pflegekasse: document.getElementById('versicherte_pflegekasse')?.value || ''
  };
}

function collectStep2Data() {
  if (PflegeboxForm.formData.angehoerige.isSamePerson) {
    return PflegeboxForm.formData.angehoerige.data;
  }

  const plz = document.getElementById('angehoerige_plz')?.value || '';
  const ort = document.getElementById('angehoerige_ort')?.value || '';

  return {
    anrede: getRadioValue('angehoerige_anrede'),
    vorname: document.getElementById('angehoerige_vorname')?.value || '',
    name: document.getElementById('angehoerige_name')?.value || '',
    strasse: document.getElementById('angehoerige_strasse')?.value || '',
    plzOrt: `${plz} ${ort}`.trim(),
    telefon: document.getElementById('angehoerige_telefon')?.value || '',
    email: document.getElementById('angehoerige_email')?.value || '',
    typ: getRadioValue('angehoerige_typ')
  };
}

function collectAllFormData() {
  const form = document.getElementById('pflegeboxForm');
  if (!form) return null;

  return {
    versicherte: collectStep1Data(),
    angehoerige: {
      isSamePerson: PflegeboxForm.formData.angehoerige.isSamePerson,
      data: collectStep2Data()
    },
    pflegebox: {
      products: {
        bettschutzeinlagen: isChecked('product_bettschutz'),
        fingerlinge: isChecked('product_fingerlinge'),
        ffp2: isChecked('product_ffp2'),
        einmalhandschuhe: isChecked('product_handschuhe'),
        mundschutz: isChecked('product_mundschutz'),
        essslaetzchen: isChecked('product_esslatzchen'),
        schutzschuerzenEinmal: isChecked('product_schutzschuerzen_einmal'),
        schutzschuerzenWieder: isChecked('product_schutzschuerzen_wieder'),
        flaechendesinfektion: isChecked('product_flaechendesinfektion'),
        flaechendesinfektionstuecher: isChecked('product_flaechentuecher'),
        haendedesinfektion: isChecked('product_haendedesinfektion'),
        haendedesinfektionstuecher: isChecked('product_haendetuecher')
      },
      handschuhGroesse: getRadioValue('handschuhe_groesse'),
      handschuhMaterial: getRadioValue('handschuhe_material')
    },
    lieferung: {
      an: getRadioValue('lieferung_an')
    },
    rechnung: {
      an: getRadioValue('rechnung_an')
    },
    signatures: {
      versicherte: PflegeboxForm.signatureData,
      bevollmaechtigter: PflegeboxForm.signatureDataBevollmaechtigter
    },
    consents: {
      agb: isChecked('consent_agb'),
      privacy: isChecked('consent_daten'),
      vollmacht: isChecked('consent_vollmacht')
    },
    timestamp: new Date().toISOString(),
    bestelldatum: new Date().toLocaleDateString('de-DE'),
    bestellzeit: new Date().toLocaleTimeString('de-DE')
  };
}

// ==================== HELPER FUNCTIONS ====================
function getRadioValue(name) {
  const radio = document.querySelector(`input[name="${name}"]:checked`);
  return radio ? radio.value : '';
}

function isChecked(name) {
  const checkbox = document.querySelector(`input[name="${name}"]`);
  return checkbox ? checkbox.checked : false;
}

// ==================== VALIDATION ====================
function validateCurrentStep() {
  const currentStepEl = document.querySelector(`.form-step[data-step="${PflegeboxForm.currentStep}"]`);
  if (!currentStepEl) return true;

  const requiredFields = currentStepEl.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (field.type === 'radio') {
      const radioGroup = currentStepEl.querySelectorAll(`input[name="${field.name}"]`);
      const isChecked = Array.from(radioGroup).some(radio => radio.checked);
      if (!isChecked) {
        isValid = false;
      }
    } else if (field.type === 'checkbox') {
      if (!field.checked) {
        isValid = false;
      }
    } else if (!field.value.trim()) {
      isValid = false;
    }
  });

  if (!isValid) {
    alert('Bitte füllen Sie alle erforderlichen Felder aus.');
  }

  return isValid;
}

// ==================== SIGNATURE CANVAS ====================
function initCanvas() {
  PflegeboxForm.canvas = document.getElementById('signaturePad');
  if (!PflegeboxForm.canvas) return;

  // Imposta dimensioni canvas
  const container = PflegeboxForm.canvas.parentElement;
  PflegeboxForm.canvas.width = container.clientWidth - 20;
  PflegeboxForm.canvas.height = 200;

  PflegeboxForm.ctx = PflegeboxForm.canvas.getContext('2d');

  // Mouse events
  PflegeboxForm.canvas.addEventListener('mousedown', startDrawing);
  PflegeboxForm.canvas.addEventListener('mousemove', draw);
  PflegeboxForm.canvas.addEventListener('mouseup', stopDrawing);
  PflegeboxForm.canvas.addEventListener('mouseleave', stopDrawing);

  // Touch events
  PflegeboxForm.canvas.addEventListener('touchstart', handleTouchStart);
  PflegeboxForm.canvas.addEventListener('touchmove', handleTouchMove);
  PflegeboxForm.canvas.addEventListener('touchend', stopDrawing);

  console.log('✅ Signature canvas inizializzato');
}

function initCanvasBevollmaechtigter() {
  PflegeboxForm.canvasBevollmaechtigter = document.getElementById('signaturePadBevollmaechtigter');
  if (!PflegeboxForm.canvasBevollmaechtigter) return;

  PflegeboxForm.ctxBevollmaechtigter = PflegeboxForm.canvasBevollmaechtigter.getContext('2d');

  // Mouse events
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('mousedown', startDrawingBevollmaechtigter);
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('mousemove', drawBevollmaechtigter);
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('mouseup', stopDrawingBevollmaechtigter);
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('mouseleave', stopDrawingBevollmaechtigter);

  // Touch events
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('touchstart', handleTouchStartBevollmaechtigter);
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('touchmove', handleTouchMoveBevollmaechtigter);
  PflegeboxForm.canvasBevollmaechtigter.addEventListener('touchend', stopDrawingBevollmaechtigter);

  console.log('✅ Bevollmächtigter signature canvas inizializzato');
}

function handleTouchStart(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  PflegeboxForm.canvas.dispatchEvent(mouseEvent);
}

function handleTouchMove(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  PflegeboxForm.canvas.dispatchEvent(mouseEvent);
}

function handleTouchStartBevollmaechtigter(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousedown', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  PflegeboxForm.canvasBevollmaechtigter.dispatchEvent(mouseEvent);
}

function handleTouchMoveBevollmaechtigter(e) {
  e.preventDefault();
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent('mousemove', {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  PflegeboxForm.canvasBevollmaechtigter.dispatchEvent(mouseEvent);
}

function startDrawing(e) {
  PflegeboxForm.isDrawing = true;
  const rect = PflegeboxForm.canvas.getBoundingClientRect();
  PflegeboxForm.ctx.beginPath();
  PflegeboxForm.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function draw(e) {
  if (!PflegeboxForm.isDrawing) return;
  const rect = PflegeboxForm.canvas.getBoundingClientRect();
  PflegeboxForm.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  PflegeboxForm.ctx.strokeStyle = '#2c3e50';
  PflegeboxForm.ctx.lineWidth = 2;
  PflegeboxForm.ctx.lineCap = 'round';
  PflegeboxForm.ctx.stroke();
}

function stopDrawing() {
  if (PflegeboxForm.isDrawing) {
    PflegeboxForm.isDrawing = false;
    PflegeboxForm.signatureData = PflegeboxForm.canvas.toDataURL();
  }
}

function startDrawingBevollmaechtigter(e) {
  PflegeboxForm.isDrawingBevollmaechtigter = true;
  const rect = PflegeboxForm.canvasBevollmaechtigter.getBoundingClientRect();
  PflegeboxForm.ctxBevollmaechtigter.beginPath();
  PflegeboxForm.ctxBevollmaechtigter.moveTo(e.clientX - rect.left, e.clientY - rect.top);
}

function drawBevollmaechtigter(e) {
  if (!PflegeboxForm.isDrawingBevollmaechtigter) return;
  const rect = PflegeboxForm.canvasBevollmaechtigter.getBoundingClientRect();
  PflegeboxForm.ctxBevollmaechtigter.lineTo(e.clientX - rect.left, e.clientY - rect.top);
  PflegeboxForm.ctxBevollmaechtigter.strokeStyle = '#2c3e50';
  PflegeboxForm.ctxBevollmaechtigter.lineWidth = 2;
  PflegeboxForm.ctxBevollmaechtigter.lineCap = 'round';
  PflegeboxForm.ctxBevollmaechtigter.stroke();
}

function stopDrawingBevollmaechtigter() {
  if (PflegeboxForm.isDrawingBevollmaechtigter) {
    PflegeboxForm.isDrawingBevollmaechtigter = false;
    PflegeboxForm.signatureDataBevollmaechtigter = PflegeboxForm.canvasBevollmaechtigter.toDataURL();
  }
}

function clearSignature() {
  if (PflegeboxForm.ctx && PflegeboxForm.canvas) {
    PflegeboxForm.ctx.clearRect(0, 0, PflegeboxForm.canvas.width, PflegeboxForm.canvas.height);
    PflegeboxForm.signatureData = '';
  }
}

function clearSignatureBevollmaechtigter() {
  if (PflegeboxForm.ctxBevollmaechtigter && PflegeboxForm.canvasBevollmaechtigter) {
    PflegeboxForm.ctxBevollmaechtigter.clearRect(0, 0, PflegeboxForm.canvasBevollmaechtigter.width, PflegeboxForm.canvasBevollmaechtigter.height);
    PflegeboxForm.signatureDataBevollmaechtigter = '';
  }
}

// ==================== NAVIGATION ====================
function updateProgress() {
  // Aggiorna progress bar
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    const percentage = ((PflegeboxForm.currentStep - 1) / (PflegeboxForm.maxSteps - 1)) * 100;
    progressFill.style.width = percentage + '%';
  }

  // Aggiorna progress steps
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNum = index + 1;
    const stepNumber = step.querySelector('.step-number');

    if (stepNum < PflegeboxForm.currentStep) {
      step.classList.add('completed');
      step.classList.remove('active');
      if (stepNumber) stepNumber.textContent = '✓';
    } else if (stepNum === PflegeboxForm.currentStep) {
      step.classList.add('active');
      step.classList.remove('completed');
      if (stepNumber) stepNumber.textContent = stepNum;
    } else {
      step.classList.remove('active', 'completed');
      if (stepNumber) stepNumber.textContent = stepNum;
    }
  });
}

function nextStep() {
  if (PflegeboxForm.currentStep < PflegeboxForm.maxSteps) {
    // Nascondi step corrente
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });

    PflegeboxForm.currentStep++;

    // Mostra nuovo step
    const nextStepEl = document.querySelector(`.form-step[data-step="${PflegeboxForm.currentStep}"]`);
    if (nextStepEl) {
      nextStepEl.classList.add('active');
    }

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Init canvas se arriviamo allo step 6 (Unterschrift)
    if (PflegeboxForm.currentStep === 6) {
      setTimeout(initCanvas, 100);
    }

    // Popola review se step 7
    if (PflegeboxForm.currentStep === 7) {
      populateReviewSection();
    }

    saveFormState();
  }
}

function prevStep() {
  if (PflegeboxForm.currentStep > 1) {
    // Nascondi step corrente
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });

    PflegeboxForm.currentStep--;

    // Mostra step precedente
    const prevStepEl = document.querySelector(`.form-step[data-step="${PflegeboxForm.currentStep}"]`);
    if (prevStepEl) {
      prevStepEl.classList.add('active');
    }

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    saveFormState();
  }
}

function populateReviewSection() {
  const reviewContent = document.getElementById('reviewContent');
  if (!reviewContent) return;

  const formData = collectAllFormData();
  if (!formData) return;

  let html = '<div class="review-data">';

  // Step 1
  html += '<h4>1. Antragsteller</h4>';
  html += `<p><strong>${formData.versicherte.anrede} ${formData.versicherte.vorname} ${formData.versicherte.name}</strong></p>`;
  html += `<p>${formData.versicherte.strasse}, ${formData.versicherte.plzOrt}</p>`;
  html += `<p>Pflegegrad: ${formData.versicherte.pflegegrad}</p>`;

  // Step 2
  html += '<h4>2. Pflegeperson</h4>';
  if (formData.angehoerige.isSamePerson) {
    html += '<p><em>Gleiche Person wie Antragsteller</em></p>';
  } else {
    html += `<p><strong>${formData.angehoerige.data.anrede} ${formData.angehoerige.data.vorname} ${formData.angehoerige.data.name}</strong></p>`;
    html += `<p>${formData.angehoerige.data.strasse}, ${formData.angehoerige.data.plzOrt}</p>`;
  }

  // Step 3 - Prodotti selezionati
  html += '<h4>3. Pflegebox Produkte</h4>';
  html += '<ul>';
  for (const [key, value] of Object.entries(formData.pflegebox.products)) {
    if (value) {
      html += `<li>${key}</li>`;
    }
  }
  html += '</ul>';

  html += '</div>';
  reviewContent.innerHTML = html;
}

// ==================== LOCAL STORAGE ====================
function saveFormState() {
  const formData = collectAllFormData();
  if (!formData) return;

  try {
    localStorage.setItem('pflegebox_form_data', JSON.stringify(formData));
    localStorage.setItem('pflegebox_form_timestamp', Date.now().toString());
    localStorage.setItem('pflegebox_form_step', PflegeboxForm.currentStep.toString());
  } catch (e) {
    console.warn('⚠️ LocalStorage non disponibile:', e);
  }
}

function restoreFormState() {
  try {
    const saved = localStorage.getItem('pflegebox_form_data');
    const timestamp = localStorage.getItem('pflegebox_form_timestamp');
    const savedStep = localStorage.getItem('pflegebox_form_step');

    if (saved && timestamp) {
      const age = Date.now() - parseInt(timestamp);
      const maxAge = 24 * 60 * 60 * 1000; // 24 ore

      if (age < maxAge) {
        if (confirm('Vuoi ripristinare i dati del modulo non completato?')) {
          const data = JSON.parse(saved);
          // TODO: Popolare i campi del form
          console.log('✅ Dati ripristinati:', data);

          if (savedStep) {
            PflegeboxForm.currentStep = parseInt(savedStep);
            // TODO: Mostrare lo step corretto
          }
        } else {
          clearFormState();
        }
      } else {
        clearFormState();
      }
    }
  } catch (e) {
    console.warn('⚠️ Errore ripristino stato:', e);
  }
}

function clearFormState() {
  try {
    localStorage.removeItem('pflegebox_form_data');
    localStorage.removeItem('pflegebox_form_timestamp');
    localStorage.removeItem('pflegebox_form_step');
  } catch (e) {
    console.warn('⚠️ Errore cancellazione stato:', e);
  }
}

// ==================== FORM SUBMIT ====================
document.getElementById('pflegeboxForm')?.addEventListener('submit', async function(e) {
  e.preventDefault();

  // Validazione firma
  if (!PflegeboxForm.signatureData) {
    alert('⚠️ Bitte unterschreiben Sie das Formular');
    return;
  }

  // Raccogli tutti i dati
  const formData = collectAllFormData();
  if (!formData) {
    alert('⚠️ Errore nella raccolta dei dati');
    return;
  }

  console.log('📤 Invio dati al backend:', formData);

  // Mostra loading
  const submitBtn = document.getElementById('submitBtn');
  const btnText = submitBtn?.querySelector('.btn-text');
  const btnLoader = submitBtn?.querySelector('.btn-loader');

  if (submitBtn) {
    submitBtn.disabled = true;
    if (btnText) btnText.style.display = 'none';
    if (btnLoader) btnLoader.style.display = 'inline';
  }

  try {
    // Invia al backend per generazione PDF e email
    const response = await fetch(`${PflegeboxForm.workerBaseUrl}/api/pflegebox/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Worker-Key': PflegeboxForm.sharedKey
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(errorData?.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Response dal backend:', result);

    // Mostra successo
    showSuccessPage(formData);

    // Pulisci localStorage
    clearFormState();

  } catch (error) {
    console.error('❌ Errore invio form:', error);
    alert('⚠️ Fehler beim Senden des Formulars. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.\n\nFehler: ' + error.message);

    // Ripristina bottone
    if (submitBtn) {
      submitBtn.disabled = false;
      if (btnText) btnText.style.display = 'inline';
      if (btnLoader) btnLoader.style.display = 'none';
    }
  }
});

function showSuccessPage(formData) {
  // Nascondi form e progress
  const form = document.getElementById('pflegeboxForm');
  const progressContainer = document.querySelector('.progress-container');

  if (form) form.style.display = 'none';
  if (progressContainer) progressContainer.style.display = 'none';

  // Mostra success message
  const successMessage = document.getElementById('successMessage');
  if (successMessage) {
    successMessage.style.display = 'block';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function generatePDFPreview(data) {
  let txt = '═══════════════════════════════════════════════════════════════════\n';
  txt += '                     PFLEGE TEUFEL - BESTELLFORMULAR\n';
  txt += '                         Pflegebox Bestellung\n';
  txt += '═══════════════════════════════════════════════════════════════════\n\n';
  txt += `Bestelldatum: ${data.bestelldatum}\n`;
  txt += `Bestellzeit: ${data.bestellzeit}\n\n`;
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '1. NAME DER/DES ANTRAGSTELLERS\n';
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += `Anrede: ${data.versicherte.anrede}\n`;
  txt += `Vorname: ${data.versicherte.vorname}\n`;
  txt += `Name: ${data.versicherte.name}\n`;
  txt += `Straße/Nr.: ${data.versicherte.strasse}\n`;
  txt += `PLZ/Ort: ${data.versicherte.plzOrt}\n`;
  txt += `Telefon: ${data.versicherte.telefon || 'nicht angegeben'}\n`;
  txt += `E-Mail: ${data.versicherte.email}\n`;
  txt += `Geburtsdatum: ${data.versicherte.geburtsdatum || 'nicht angegeben'}\n`;
  txt += `Versichertennummer: ${data.versicherte.versichertennummer || 'nicht angegeben'}\n`;
  txt += `Pflegegrad: ${data.versicherte.pflegegrad}\n`;
  txt += `Versicherte(r) ist: ${data.versicherte.versicherteTyp}\n`;
  if (data.versicherte.versicherteTyp === 'sozialamt') {
    txt += `Ortsamt/Sozialamt: ${data.versicherte.sozialamt || 'nicht angegeben'}\n`;
  }
  txt += `Pflegekasse: ${data.versicherte.pflegekasse || 'nicht angegeben'}\n`;
  txt += '\n───────────────────────────────────────────────────────────────────\n';
  txt += '2. ANGEHÖRIGE(R)/PFLEGEPERSON\n';
  txt += '───────────────────────────────────────────────────────────────────\n';

  if (data.angehoerige.isSamePerson) {
    txt += '⚠️ GLEICHE PERSON WIE ANTRAGSTELLER\n';
    txt += `(Daten entsprechen denen von ${data.versicherte.vorname} ${data.versicherte.name})\n\n`;
  } else {
    txt += `Anrede: ${data.angehoerige.data.anrede}\n`;
    txt += `Vorname: ${data.angehoerige.data.vorname}\n`;
    txt += `Name: ${data.angehoerige.data.name}\n`;
    txt += `Straße/Nr.: ${data.angehoerige.data.strasse}\n`;
    txt += `PLZ/Ort: ${data.angehoerige.data.plzOrt}\n`;
    txt += `Telefon: ${data.angehoerige.data.telefon || 'nicht angegeben'}\n`;
    txt += `E-Mail: ${data.angehoerige.data.email || 'nicht angegeben'}\n`;
    txt += `Pflegeperson ist: ${data.angehoerige.data.typ}\n\n`;
  }

  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '3. PFLEGEBOX\n';
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += 'Bestellte Produkte:\n\n';

  for (const [key, value] of Object.entries(data.pflegebox.products)) {
    txt += `  ${value ? '☑' : '☐'} ${key}\n`;
  }

  txt += `\nHandschuhgröße: ${data.pflegebox.handschuhGroesse}\n`;
  txt += `Handschuhmaterial: ${data.pflegebox.handschuhMaterial}\n\n`;
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '4. LIEFERADRESSE\n';
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += `Die monatliche Lieferung an: ${data.lieferung.an === 'versicherte' ? 'Versicherte(n)' : 'Angehörige(n)'}\n\n`;
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '5. RECHNUNGSEMPFÄNGER\n';
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += `${data.rechnung.an === 'versicherte' ? 'Versicherte(r)' : 'Angehörige(r)'}\n\n`;
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '6. UNTERSCHRIFT UND EINWILLIGUNGEN\n';
  txt += '───────────────────────────────────────────────────────────────────\n';
  txt += '☑ AGB zur Kenntnis genommen\n';
  txt += '☑ Datenverarbeitung zugestimmt\n\n';
  txt += `Unterschriftsdatum: ${data.bestelldatum}\n`;
  txt += `Uhrzeit: ${data.bestellzeit}\n\n`;
  txt += '[DIGITALE UNTERSCHRIFT - Siehe unten]\n\n';
  txt += '═══════════════════════════════════════════════════════════════════\n';
  txt += '                        Agentur Pflege Teufel\n';
  txt += '                        Regentenstraße 88\n';
  txt += '                            51063 Köln\n';
  txt += '                          IK: 590523228\n';
  txt += '═══════════════════════════════════════════════════════════════════\n';

  return txt;
}

// Esponi le funzioni globalmente
window.pflegeboxForm = {
  toggleAngehoerigeSection,
  editAngehoerigeData,
  clearSignature,
  clearSignatureBevollmaechtigter
};
