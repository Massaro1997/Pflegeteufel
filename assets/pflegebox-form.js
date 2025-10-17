/**
 * Pflegebox Form - Sistema completo con auto-compilazione e logica condizionale
 * Autore: Calogero Massaro
 * Data: 2025
 */

// ==================== STATO GLOBALE ====================
const PflegeboxForm = {
  currentStep: 1,
  maxSteps: 6,
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
  document.querySelectorAll('input[name="insuranceType"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
      const sozialamtField = document.getElementById('sozialamtField');
      if (sozialamtField) {
        sozialamtField.style.display = (this.value === 'sozialamt') ? 'block' : 'none';
      }
    });
  });

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

  // Save form state on input changes
  document.getElementById('pflegeboxForm').addEventListener('input', saveFormState);
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

  return {
    anrede: getRadioValue('gender'),
    vorname: form.firstName?.value || '',
    name: form.lastName?.value || '',
    strasse: form.street?.value || '',
    plzOrt: form.plzOrt?.value || '',
    telefon: form.phone?.value || '',
    email: form.email?.value || '',
    geburtsdatum: form.geburtsdatum?.value || '',
    versichertennummer: form.versichertennummer?.value || '',
    pflegegrad: getRadioValue('pflegegrad'),
    versicherteTyp: getRadioValue('insuranceType'),
    sozialamt: form.socialOffice?.value || '',
    pflegekasse: form.pflegekasse?.value || ''
  };
}

function collectStep2Data() {
  if (PflegeboxForm.formData.angehoerige.isSamePerson) {
    return PflegeboxForm.formData.angehoerige.data;
  }

  const form = document.getElementById('pflegeboxForm');
  if (!form) return {};

  return {
    anrede: getRadioValue('caregiverGender'),
    vorname: form.caregiverFirstName?.value || '',
    name: form.caregiverLastName?.value || '',
    strasse: form.caregiverStreet?.value || '',
    plzOrt: form.caregiverPlzOrt?.value || '',
    telefon: form.caregiverPhone?.value || '',
    email: form.caregiverEmail?.value || '',
    typ: getRadioValue('caregiverType')
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
        bettschutzeinlagen: isChecked('bettschutzeinlagen'),
        fingerlinge: isChecked('fingerlinge'),
        ffp2: isChecked('ffp2'),
        einmalhandschuhe: isChecked('einmalhandschuhe'),
        mundschutz: isChecked('mundschutz'),
        essslaetzchen: isChecked('essslaetzchen'),
        schutzschuerzenEinmal: isChecked('schutzschuerzenEinmal'),
        schutzschuerzenWieder: isChecked('schutzschuerzenWieder'),
        flaechendesinfektion: isChecked('flaechendesinfektion'),
        flaechendesinfektionstuecher: isChecked('flaechendesinfektionstuecher'),
        haendedesinfektion: isChecked('haendedesinfektion')
      },
      handschuhGroesse: getRadioValue('gloveSize'),
      handschuhMaterial: getRadioValue('gloveMaterial')
    },
    lieferung: {
      an: getRadioValue('deliveryTo')
    },
    rechnung: {
      an: getRadioValue('invoiceTo')
    },
    signatures: {
      versicherte: PflegeboxForm.signatureData,
      bevollmaechtigter: PflegeboxForm.signatureDataBevollmaechtigter
    },
    consents: {
      agb: isChecked('agb'),
      privacy: isChecked('privacy')
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

// ==================== SIGNATURE CANVAS ====================
function initCanvas() {
  PflegeboxForm.canvas = document.getElementById('signatureCanvas');
  if (!PflegeboxForm.canvas) return;

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
function toggleCheckbox(card) {
  const checkbox = card.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.checked = !checkbox.checked;
    checkbox.checked ? card.classList.add('checked') : card.classList.remove('checked');
  }
}

function updateProgress() {
  for (let i = 1; i <= PflegeboxForm.maxSteps; i++) {
    const circle = document.getElementById('circle-' + i);
    const label = document.getElementById('label-' + i);

    if (!circle || !label) continue;

    if (i < PflegeboxForm.currentStep) {
      // Completato
      circle.classList.add('completed');
      circle.classList.remove('active');
      circle.textContent = '✓';
      label.classList.remove('active');
    } else if (i === PflegeboxForm.currentStep) {
      // Attivo
      circle.classList.add('active');
      circle.classList.remove('completed');
      circle.textContent = i;
      label.classList.add('active');
    } else {
      // Non ancora
      circle.classList.remove('active', 'completed');
      circle.textContent = i;
      label.classList.remove('active');
    }
  }
}

function nextStep() {
  if (PflegeboxForm.currentStep < PflegeboxForm.maxSteps) {
    const currentStepEl = document.getElementById('step-' + PflegeboxForm.currentStep);
    if (currentStepEl) currentStepEl.classList.add('hidden');

    PflegeboxForm.currentStep++;

    const nextStepEl = document.getElementById('step-' + PflegeboxForm.currentStep);
    if (nextStepEl) nextStepEl.classList.remove('hidden');

    updateProgress();
    updateButtons();
    window.scrollTo(0, 0);

    // Init canvas se arriviamo allo step 6
    if (PflegeboxForm.currentStep === 6) {
      setTimeout(initCanvas, 100);
    }
  }
}

function prevStep() {
  if (PflegeboxForm.currentStep > 1) {
    const currentStepEl = document.getElementById('step-' + PflegeboxForm.currentStep);
    if (currentStepEl) currentStepEl.classList.add('hidden');

    PflegeboxForm.currentStep--;

    const prevStepEl = document.getElementById('step-' + PflegeboxForm.currentStep);
    if (prevStepEl) prevStepEl.classList.remove('hidden');

    updateProgress();
    updateButtons();
    window.scrollTo(0, 0);
  }
}

function updateButtons() {
  const backBtn = document.getElementById('backBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  if (backBtn) {
    if (PflegeboxForm.currentStep === 1) {
      backBtn.classList.add('hidden');
    } else {
      backBtn.classList.remove('hidden');
    }
  }

  if (nextBtn && submitBtn) {
    if (PflegeboxForm.currentStep === PflegeboxForm.maxSteps) {
      nextBtn.classList.add('hidden');
      submitBtn.classList.remove('hidden');
    } else {
      nextBtn.classList.remove('hidden');
      submitBtn.classList.add('hidden');
    }
  }
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
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Wird verarbeitet...';
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Response dal backend:', result);

    // Mostra successo
    showSuccessPage(formData);

    // Pulisci localStorage
    clearFormState();

  } catch (error) {
    console.error('❌ Errore invio form:', error);
    alert('⚠️ Fehler beim Senden des Formulars. Bitte versuchen Sie es erneut oder kontaktieren Sie uns direkt.');

    // Ripristina bottone
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = '✓ Absenden';
    }
  }
});

function showSuccessPage(formData) {
  // Nascondi form
  document.getElementById('pflegeboxForm')?.classList.add('hidden');
  document.querySelector('.progress-section')?.classList.add('hidden');

  // Mostra success page
  const successPage = document.getElementById('successPage');
  if (successPage) {
    successPage.classList.remove('hidden');

    // Genera preview PDF testuale
    const pdfPreview = generatePDFPreview(formData);
    const pdfContent = document.getElementById('pdfContent');
    if (pdfContent) {
      pdfContent.textContent = pdfPreview;
    }

    // Mostra firma
    const signatureImg = document.getElementById('signatureImg');
    if (signatureImg && PflegeboxForm.signatureData) {
      signatureImg.src = PflegeboxForm.signatureData;
    }
  }

  window.scrollTo(0, 0);
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
