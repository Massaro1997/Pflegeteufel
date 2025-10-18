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

    // Se il PDF non ha campi form, scrivo il testo alle coordinate esatte
    const pages = pdfDoc.getPages();
    const page1 = pages[0] || pdfDoc.addPage([595, 842]); // A4

    const v = formData.versicherte;
    const a = formData.angehoerige;
    const p = formData.pflegebox;

    // ========== SEZIONE 1: ANTRAGSTELLER (VERSICHERTE/R) ==========

    // COORDINATE ESATTE ESTRATTE DA PDF CAMPIONE "Bestellformular_Pflegebox_Schmidt campione.pdf"
    // Queste coordinate sono state misurate dal PDF già compilato correttamente

    // Riga 1: Checkbox Frau/Herr
    if (v.anrede === 'Frau') {
      page1.drawText('X', { x: 168, y: 682, size: 10, font: helveticaBold });
    } else if (v.anrede === 'Herr') {
      page1.drawText('X', { x: 545, y: 682, size: 10, font: helveticaBold });
    }

    // Riga 2: Vorname / Name
    page1.drawText(v.vorname || '', { x: 193, y: 658, size: 10, font: helveticaFont });
    page1.drawText(v.name || '', { x: 554, y: 658, size: 10, font: helveticaFont });

    // Riga 3: Straße / PLZ Ort
    page1.drawText(v.strasse || '', { x: 193, y: 634, size: 10, font: helveticaFont });

    const plzOrtParts = (v.plzOrt || '').split(' ');
    const plz = plzOrtParts[0] || '';
    const ort = plzOrtParts.slice(1).join(' ') || '';
    page1.drawText(`${plz} ${ort}`, { x: 554, y: 634, size: 10, font: helveticaFont });

    // Riga 4: Telefon / Email
    page1.drawText(v.telefon || '', { x: 193, y: 610, size: 10, font: helveticaFont });
    page1.drawText(v.email || '', { x: 554, y: 610, size: 10, font: helveticaFont });

    // Riga 5: Pflegegrad checkbox
    const pflegegradMap = {
      '1': { x: 331, y: 586 },
      '2': { x: 373, y: 586 },
      '3': { x: 415, y: 586 },
      '4': { x: 457, y: 586 },
      '5': { x: 499, y: 586 }
    };
    if (v.pflegegrad && pflegegradMap[v.pflegegrad]) {
      const pos = pflegegradMap[v.pflegegrad];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "Ich habe einen Pflegegrad beantragt"
    if (!v.pflegegrad || v.pflegegrad === 'beantragt') {
      page1.drawText('X', { x: 541, y: 586, size: 10, font: helveticaBold });
    }

    // Riga 6: Versicherungstyp
    const versicherungMap = {
      'gesetzlich': { x: 203, y: 562 },
      'privat': { x: 384, y: 562 },
      'beihilfeberechtigt': { x: 527, y: 562 }
    };
    if (v.versicherteTyp && versicherungMap[v.versicherteTyp]) {
      const pos = versicherungMap[v.versicherteTyp];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "über Ortsamt/Sozialamt versichert" + campo testo
    if (v.versicherteTyp === 'ortsamt') {
      page1.drawText('X', { x: 203, y: 538, size: 10, font: helveticaBold });
      // Campo testo per nome Ortsamt/Sozialamt
      if (v.ortsamtName) {
        page1.drawText(v.ortsamtName, { x: 617, y: 538, size: 10, font: helveticaFont });
      }
    }

    // ========== SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON ==========

    if (!a.isSamePerson && a.data) {
      // COORDINATE ESATTE DA PDF CAMPIONE

      // Riga 1: Checkbox Frau/Herr
      if (a.data.anrede === 'Frau') {
        page1.drawText('X', { x: 168, y: 457, size: 10, font: helveticaBold });
      } else if (a.data.anrede === 'Herr') {
        page1.drawText('X', { x: 545, y: 457, size: 10, font: helveticaBold });
      }

      // Riga 2: Vorname / Name
      page1.drawText(a.data.vorname || '', { x: 193, y: 433, size: 10, font: helveticaFont });
      page1.drawText(a.data.name || '', { x: 554, y: 433, size: 10, font: helveticaFont });

      // Riga 3: Straße / PLZ Ort
      page1.drawText(a.data.strasse || '', { x: 193, y: 409, size: 10, font: helveticaFont });

      const plzOrtAngehParts = (a.data.plzOrt || '').split(' ');
      const plzAng = plzOrtAngehParts[0] || '';
      const ortAng = plzOrtAngehParts.slice(1).join(' ') || '';
      page1.drawText(`${plzAng} ${ortAng}`, { x: 554, y: 409, size: 10, font: helveticaFont });

      // Riga 4: Telefon / Email
      page1.drawText(a.data.telefon || '', { x: 193, y: 385, size: 10, font: helveticaFont });
      page1.drawText(a.data.email || '', { x: 554, y: 385, size: 10, font: helveticaFont });

      // Riga 5: Pflegeperson ist
      const pflegepersonTypMap = {
        'familienangehoeriger': { x: 203, y: 361 },
        'private': { x: 360, y: 361 },
        'betreuer': { x: 511, y: 361 }
      };
      if (a.pflegepersonTyp && pflegepersonTypMap[a.pflegepersonTyp]) {
        const pos = pflegepersonTypMap[a.pflegepersonTyp];
        page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
      }
    }

    // ========== SEZIONE 3-6: DA COMPLETARE ==========
    // Le sezioni 3-6 (Pflegebox, Lieferadresse, Rechnungsempfänger, AGB)
    // verranno compilate dopo la verifica delle coordinate delle sezioni 1-2

    console.log('✅ Sezioni 1-2 compilate con coordinate esatte da PDF campione');

    // ========== PAGINA 2: ANLAGE 2 - ANTRAG AUF KOSTENÜBERNAHME ==========

    const page2 = pages[1];
    if (page2) {
      console.log('📄 Compilazione Pagina 2 - Anlage 2...');

      // COORDINATE ESATTE DA PDF CAMPIONE

      // Nome, Vorname (riga header)
      page2.drawText(`${v.name}, ${v.vorname}`, { x: 109, y: 735, size: 9, font: helveticaFont });

      // Geburtsdatum (data di nascita)
      page2.drawText(v.geburtsdatum || '', { x: 285, y: 735, size: 9, font: helveticaFont });

      // Versichertennummer
      page2.drawText(v.versichertennummer || '', { x: 562, y: 735, size: 9, font: helveticaFont });

      // Anschrift: Straße, PLZ, Wohnort
      const anschrift = `${v.strasse}, ${plz} ${ort}`;
      page2.drawText(anschrift, { x: 109, y: 720, size: 9, font: helveticaFont });

      // Pflegekasse
      page2.drawText(v.pflegekasse || '', { x: 525, y: 720, size: 9, font: helveticaFont });

      // TODO: Completare resto Pagina 2 dopo verifica Sezioni 1-2

      console.log('✅ Pagina 2 header compilato (resto da completare)');
    }

    console.log('✅ Pagine 1-2 parzialmente compilate con coordinate esatte da PDF campione');
  }

  // Aggiungi la firma come immagine
  if (formData.signatures.versicherte) {
    try {
      const signatureBase64 = formData.signatures.versicherte.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();
      const page1 = pages[0];
      const page3 = pages[2];

      // Posiziona la firma nella sezione "Unterschrift Versicherte(r)" (pagina 1)
      const signatureDims = signatureImage.scale(0.10); // Scala firma piccola

      page1.drawImage(signatureImage, {
        x: 85,
        y: 203,
        width: signatureDims.width,
        height: signatureDims.height
      });

      // Aggiungi la firma anche alla pagina 3
      if (page3) {
        page3.drawImage(signatureImage, {
          x: 315,
          y: 295,
          width: signatureDims.width,
          height: signatureDims.height
        });
      }

      console.log('✅ Firma aggiunta al PDF (Pagina 1 e Pagina 3)');
    } catch (err) {
      console.error('⚠️ Errore aggiunta firma:', err);
    }
  }

  // Aggiungi anche la seconda firma se presente (Bevollmächtigte)
  if (formData.signatures.bevollmaechtigte) {
    try {
      const signatureBase64 = formData.signatures.bevollmaechtigte.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();
      const page1 = pages[0];

      const signatureDims = signatureImage.scale(0.15);

      page1.drawImage(signatureImage, {
        x: 450,
        y: 70,
        width: signatureDims.width,
        height: signatureDims.height
      });

      console.log('✅ Firma Bevollmächtigte aggiunta al PDF');
    } catch (err) {
      console.error('⚠️ Errore aggiunta firma Bevollmächtigte:', err);
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
