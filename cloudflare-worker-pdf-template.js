// ==================== PFLEGEBOX WORKER CON PDF TEMPLATE UFFICIALE ====================
// Questo Worker compila il template PDF ufficiale invece di creare PDF da zero

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default {
  async fetch(request, env) {
    const {
      ALLOWED_ORIGIN,
      WORKER_SHARED_KEY,
      RESEND_API_KEY,
      PDF_TEMPLATE  // R2 Bucket per template PDF
    } = env;

    // CORS headers
    const origin = request.headers.get("Origin") || "";
    const allowedEnv = (ALLOWED_ORIGIN || "").trim();
    const allowAll = allowedEnv === "*";
    const allowedList = allowAll
      ? []
      : allowedEnv.split(",").map(s => s.trim().replace(/\/$/, "")).filter(Boolean);
    const normalizedOrigin = origin.replace(/\/$/, "");
    const isAllowed = allowAll || allowedList.includes(normalizedOrigin);

    const corsHeaders = {
      "Access-Control-Allow-Origin": isAllowed ? origin : "null",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Worker-Key, X-Shared-Key",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        pdfTemplateAvailable: !!env.PDF_TEMPLATE,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse body for POST
    let body = null;
    if (request.method === "POST") {
      try {
        const text = await request.text();
        if (text) body = JSON.parse(text);
      } catch (e) {
        console.log('Parse body error:', e);
      }
    }

    // ========== PFLEGEBOX FORM SUBMIT WITH PDF TEMPLATE ==========
    if (path === "/api/pflegebox/submit" && request.method === "POST") {
      try {
        const formData = body;

        console.log('📦 Pflegebox Form Submit (PDF Template):', {
          versicherte: formData.versicherte?.vorname + ' ' + formData.versicherte?.name,
          timestamp: formData.timestamp
        });

        // Validazione
        if (!formData.versicherte?.vorname || !formData.versicherte?.name) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Dati richiedente mancanti'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!formData.signatures?.versicherte) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Firma mancante'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // 🎯 COMPILA IL PDF TEMPLATE UFFICIALE
        const pdfBytes = await fillPDFTemplate(formData, env);

        // 📧 INVIA EMAIL CON PDF ALLEGATO
        await sendPflegeboxEmailWithPDF(env, formData, pdfBytes);

        console.log('✅ PDF template compilato e inviato con successo');

        return new Response(JSON.stringify({
          success: true,
          message: 'Antrag erfolgreich übermittelt',
          timestamp: new Date().toISOString(),
          data: {
            versicherte: {
              name: `${formData.versicherte.vorname} ${formData.versicherte.name}`,
              email: formData.versicherte.email
            },
            bestelldatum: formData.bestelldatum,
            pdfGenerated: true,
            usingTemplate: true
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore compilazione PDF template:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message,
          stack: error.stack
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default 404
    return new Response(JSON.stringify({
      error: "Not found",
      availableEndpoints: ["/health", "/api/pflegebox/submit (POST)"]
    }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
};

// ==================== PDF TEMPLATE FILLING FUNCTION ====================

async function fillPDFTemplate(formData, env) {
  console.log('📄 Inizio compilazione PDF template...');

  let pdfDoc;

  // Prova a caricare il template da R2
  if (env.PDF_TEMPLATE) {
    try {
      console.log('📥 Caricamento template da R2...');
      const templateObject = await env.PDF_TEMPLATE.get('Bestellformular_Pflegebox_senza_Vollmacht.pdf');

      if (templateObject) {
        const templateBytes = await templateObject.arrayBuffer();
        pdfDoc = await PDFDocument.load(templateBytes);
        console.log('✅ Template PDF caricato da R2');
      } else {
        console.warn('⚠️ Template non trovato in R2, creo PDF da zero');
        pdfDoc = await PDFDocument.create();
      }
    } catch (error) {
      console.error('❌ Errore caricamento R2:', error);
      console.log('📄 Fallback: creo PDF da zero');
      pdfDoc = await PDFDocument.create();
    }
  } else {
    console.log('📄 R2 non configurato, creo PDF da zero');
    pdfDoc = await PDFDocument.create();
  }

  // Font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Prova a compilare i campi form (se esistono)
  const form = pdfDoc.getForm();
  const fields = form.getFields();

  if (fields.length > 0) {
    console.log(`📝 PDF ha ${fields.length} campi form compilabili`);

    // Mappa i campi del web form ai campi del PDF
    try {
      // Sezione 1: Antragsteller
      const v = formData.versicherte;

      setFieldIfExists(form, 'vorname', v.vorname);
      setFieldIfExists(form, 'name', v.name);
      setFieldIfExists(form, 'firstName', v.vorname);
      setFieldIfExists(form, 'lastName', v.name);
      setFieldIfExists(form, 'strasse', v.strasse);
      setFieldIfExists(form, 'street', v.strasse);
      setFieldIfExists(form, 'plz', v.plzOrt.split(' ')[0]);
      setFieldIfExists(form, 'ort', v.plzOrt.split(' ').slice(1).join(' '));
      setFieldIfExists(form, 'telefon', v.telefon);
      setFieldIfExists(form, 'phone', v.telefon);
      setFieldIfExists(form, 'email', v.email);
      setFieldIfExists(form, 'geburtsdatum', v.geburtsdatum);
      setFieldIfExists(form, 'versichertennummer', v.versichertennummer);
      setFieldIfExists(form, 'pflegegrad', v.pflegegrad);
      setFieldIfExists(form, 'pflegekasse', v.pflegekasse);

      // Anrede (checkbox o radio)
      if (v.anrede === 'Frau') {
        setCheckboxIfExists(form, 'anrede_frau', true);
        setRadioIfExists(form, 'anrede', 'Frau');
      } else if (v.anrede === 'Herr') {
        setCheckboxIfExists(form, 'anrede_herr', true);
        setRadioIfExists(form, 'anrede', 'Herr');
      }

      // Versicherungstyp
      if (v.versicherteTyp === 'gesetzlich') {
        setCheckboxIfExists(form, 'versichert_gesetzlich', true);
      } else if (v.versicherteTyp === 'privat') {
        setCheckboxIfExists(form, 'versichert_privat', true);
      }

      // Sezione 2: Angehörige
      const a = formData.angehoerige;
      if (!a.isSamePerson && a.data) {
        setFieldIfExists(form, 'caregiver_vorname', a.data.vorname);
        setFieldIfExists(form, 'caregiver_name', a.data.name);
        setFieldIfExists(form, 'caregiver_strasse', a.data.strasse);
        setFieldIfExists(form, 'caregiver_plz', a.data.plzOrt.split(' ')[0]);
        setFieldIfExists(form, 'caregiver_ort', a.data.plzOrt.split(' ').slice(1).join(' '));
        setFieldIfExists(form, 'caregiver_telefon', a.data.telefon);
        setFieldIfExists(form, 'caregiver_email', a.data.email);
      }

      // Sezione 3: Pflegebox prodotti
      const p = formData.pflegebox;
      setCheckboxIfExists(form, 'bettschutzeinlagen', p.products.bettschutzeinlagen);
      setCheckboxIfExists(form, 'fingerlinge', p.products.fingerlinge);
      setCheckboxIfExists(form, 'ffp2', p.products.ffp2);
      setCheckboxIfExists(form, 'einmalhandschuhe', p.products.einmalhandschuhe);
      setCheckboxIfExists(form, 'mundschutz', p.products.mundschutz);
      setCheckboxIfExists(form, 'essslaetzchen', p.products.essslaetzchen);

      // Handschuhe
      setFieldIfExists(form, 'handschuh_groesse', p.handschuhGroesse);
      setFieldIfExists(form, 'handschuh_material', p.handschuhMaterial);

      console.log('✅ Campi form compilati');
    } catch (error) {
      console.error('⚠️ Errore compilazione campi:', error);
    }
  } else {
    console.log('⚠️ PDF non ha campi form, scrivo testo alle coordinate');

    // Se il PDF non ha campi form, scrivo il testo alle coordinate
    const pages = pdfDoc.getPages();
    const page1 = pages[0] || pdfDoc.addPage([595, 842]); // A4

    const v = formData.versicherte;
    let yPos = 700; // Parti dall'alto

    // Scrivi i dati alle coordinate (devi aggiustare in base al tuo template)
    page1.drawText(`${v.vorname} ${v.name}`, {
      x: 150,
      y: yPos,
      size: 10,
      font: helveticaFont
    });

    // Continua con altri campi...
    // (Questa parte richiede di conoscere le coordinate esatte del tuo PDF)
  }

  // Aggiungi la firma come immagine
  if (formData.signatures.versicherte) {
    try {
      const signatureBase64 = formData.signatures.versicherte.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();

      // Aggiungi firma alla prima pagina (o alla pagina corretta del tuo template)
      const signaturePage = pages[0] || pages[pages.length - 1];
      const signatureDims = signatureImage.scale(0.2);

      signaturePage.drawImage(signatureImage, {
        x: 100, // Aggiusta coordinate in base al tuo template
        y: 100,
        width: signatureDims.width,
        height: signatureDims.height
      });

      console.log('✅ Firma aggiunta al PDF');
    } catch (err) {
      console.error('⚠️ Errore aggiunta firma:', err);
    }
  }

  // Salva il PDF
  const pdfBytes = await pdfDoc.save();
  console.log(`✅ PDF template compilato: ${pdfBytes.length} bytes`);

  return pdfBytes;
}

// Helper functions per compilare i campi
function setFieldIfExists(form, fieldName, value) {
  try {
    const field = form.getTextField(fieldName);
    if (field && value) {
      field.setText(String(value));
    }
  } catch (e) {
    // Campo non esiste o non è un text field
  }
}

function setCheckboxIfExists(form, fieldName, checked) {
  try {
    const field = form.getCheckBox(fieldName);
    if (field) {
      if (checked) {
        field.check();
      } else {
        field.uncheck();
      }
    }
  } catch (e) {
    // Campo non esiste o non è un checkbox
  }
}

function setRadioIfExists(form, fieldName, value) {
  try {
    const field = form.getRadioGroup(fieldName);
    if (field) {
      field.select(value);
    }
  } catch (e) {
    // Campo non esiste o non è un radio group
  }
}

// ==================== EMAIL WITH PDF ATTACHMENT ====================

async function sendPflegeboxEmailWithPDF(env, formData, pdfBytes) {
  const toEmail = 'pflegeteufelagentur@gmail.com';
  const fromEmail = 'bestellung@pflegeteufel.de';
  const subject = `📦 Neue Pflegebox Bestellung - ${formData.versicherte.vorname} ${formData.versicherte.name}`;

  // Converti PDF in base64 per l'allegato (metodo sicuro per file grandi)
  const uint8Array = new Uint8Array(pdfBytes);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  const pdfBase64 = btoa(binaryString);

  // Email body
  const emailText = `
Neue Pflegebox Bestellung eingegangen!

Kunde: ${formData.versicherte.vorname} ${formData.versicherte.name}
Email: ${formData.versicherte.email}
Datum: ${formData.bestelldatum} um ${formData.bestellzeit}

Das ausgefüllte Bestellformular finden Sie im Anhang als PDF.

Mit freundlichen Grüßen
Pflege Teufel System
  `.trim();

  // Resend API
  if (env.RESEND_API_KEY) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: fromEmail,
        to: toEmail,
        subject: subject,
        text: emailText,
        attachments: [
          {
            filename: `Bestellformular_Pflegebox_${formData.versicherte.name}_${formData.bestelldatum}.pdf`,
            content: pdfBase64
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Email con PDF inviata via Resend:', result.id);
    return result;
  }

  console.warn('⚠️ Nessun servizio email configurato');
  return { success: false, note: 'No email service configured' };
}
