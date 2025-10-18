// ==================== PFLEGEBOX WORKER CON PDF GENERATION ====================
// Questo Worker genera un PDF compilato dal template Bestellformular_Pflegebox

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export default {
  async fetch(request, env) {
    const {
      SHOPIFY_ADMIN_TOKEN,
      SHOPIFY_API_VERSION = "2024-01",
      ALLOWED_ORIGIN,
      WORKER_SHARED_KEY,
      RESEND_API_KEY,
      SENDGRID_API_KEY
    } = env;

    const SHOPIFY_SHOP = (env.SHOPIFY_SHOP || "").trim().replace(/[\r\n]/g, "");

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

    // Auth
    const sentKey = (request.headers.get("X-Worker-Key") || request.headers.get("X-Shared-Key") || "").trim();
    const sharedKey = (WORKER_SHARED_KEY || "").trim();

    const url = new URL(request.url);
    const path = url.pathname;

    // Health check
    if (path === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        pdfLibAvailable: true,
        timestamp: new Date().toISOString()
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
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

    // ========== PFLEGEBOX FORM SUBMIT WITH PDF ==========
    if (path === "/api/pflegebox/submit" && request.method === "POST") {
      try {
        const formData = body;

        console.log('📦 Pflegebox Form Submit (PDF Generation):', {
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

        // 🎯 GENERA IL PDF COMPILATO
        const pdfBytes = await generatePflegeboxPDF(formData, env);

        // 📧 INVIA EMAIL CON PDF ALLEGATO
        await sendPflegeboxEmailWithPDF(env, formData, pdfBytes);

        console.log('✅ PDF generato e inviato con successo');

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
            pdfGenerated: true
          }
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore generazione PDF:', error);
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

// ==================== PDF GENERATION FUNCTION ====================

async function generatePflegeboxPDF(formData, env) {
  console.log('📄 Inizio generazione PDF...');

  // Carica il PDF template da R2 o Workers KV
  // Per ora creiamo un PDF da zero come esempio
  const pdfDoc = await PDFDocument.create();

  // Font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Pagina 1: Bestellformular
  const page1 = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page1.getSize();

  // Header
  page1.drawText('Bestellformular Pflegebox', {
    x: 50,
    y: height - 50,
    size: 24,
    font: helveticaBold,
    color: rgb(0.75, 0.15, 0.14) // #C12624
  });

  page1.drawText('Pflege Teufel', {
    x: 50,
    y: height - 75,
    size: 14,
    font: helvetica Font,
    color: rgb(0, 0, 0)
  });

  // Sezione 1: Antragsteller
  let yPosition = height - 120;

  page1.drawText('1. Name der/des Antragstellers', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 25;

  const v = formData.versicherte;

  // Anrede
  page1.drawText(`Anrede: ${v.anrede}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Nome
  page1.drawText(`Vorname: ${v.vorname}    Name: ${v.name}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Indirizzo
  page1.drawText(`Straße/Nr.: ${v.strasse}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  page1.drawText(`PLZ/Ort: ${v.plzOrt}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Contatti
  page1.drawText(`Telefon: ${v.telefon}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  page1.drawText(`E-Mail: ${v.email}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Geburtsdatum
  page1.drawText(`Geburtsdatum: ${v.geburtsdatum || 'nicht angegeben'}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Versichertennummer
  page1.drawText(`Versichertennummer: ${v.versichertennummer || 'nicht angegeben'}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Pflegegrad
  page1.drawText(`Pflegegrad: ${v.pflegegrad}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 20;

  // Pflegekasse
  page1.drawText(`Pflegekasse: ${v.pflegekasse || 'nicht angegeben'}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  yPosition -= 40;

  // Sezione 2: Angehörige
  page1.drawText('2. Angehörige(r)/Pflegeperson', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  yPosition -= 25;

  const a = formData.angehoerige;

  if (a.isSamePerson) {
    page1.drawText('GLEICHE PERSON WIE ANTRAGSTELLER', {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaBold,
      color: rgb(0.8, 0.5, 0) // Warning color
    });
  } else {
    page1.drawText(`Anrede: ${a.data.anrede}`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;

    page1.drawText(`Name: ${a.data.vorname} ${a.data.name}`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;

    page1.drawText(`Adresse: ${a.data.strasse}, ${a.data.plzOrt}`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;

    page1.drawText(`Pflegeperson ist: ${a.data.typ}`, {
      x: 70,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
  }

  yPosition -= 40;

  // Sezione 3: Pflegebox
  page1.drawText('3. Pflegebox', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  yPosition -= 25;

  const p = formData.pflegebox;
  const productNames = {
    bettschutzeinlagen: 'Bettschutzeinlagen',
    fingerlinge: 'Fingerlinge',
    ffp2: 'FFP2 Masken',
    einmalhandschuhe: 'Einmalhandschuhe',
    mundschutz: 'Mundschutz',
    essslaetzchen: 'Esslätzchen',
    schutzschuerzenEinmal: 'Schutzschürzen (Einmalgebrauch)',
    schutzschuerzenWieder: 'Schutzschürzen (wiederverwendbar)',
    flaechendesinfektion: 'Flächendesinfektionsmittel',
    flaechendesinfektionstuecher: 'Flächendesinfektionstücher',
    haendedesinfektion: 'Händedesinfektionsmittel'
  };

  page1.drawText('Ausgewählte Produkte:', {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });
  yPosition -= 20;

  for (const [key, value] of Object.entries(p.products)) {
    if (value && yPosition > 100) {
      page1.drawText(`✓ ${productNames[key] || key}`, {
        x: 90,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0.5, 0)
      });
      yPosition -= 18;
    }
  }

  yPosition -= 10;

  page1.drawText(`Handschuhgröße: ${p.handschuhGroesse}    Material: ${p.handschuhMaterial}`, {
    x: 70,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });

  // Firma (converti base64 a image)
  if (formData.signatures.versicherte && yPosition > 150) {
    yPosition -= 40;

    page1.drawText('6. Unterschrift', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold
    });
    yPosition -= 25;

    try {
      // Estrai la firma dal base64
      const signatureBase64 = formData.signatures.versicherte.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

      // Embed image
      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const signatureDims = signatureImage.scale(0.3);

      page1.drawImage(signatureImage, {
        x: 70,
        y: yPosition - signatureDims.height,
        width: signatureDims.width,
        height: signatureDims.height
      });

      yPosition -= signatureDims.height + 10;

      page1.drawText(`Unterschrieben am: ${formData.bestelldatum} um ${formData.bestellzeit}`, {
        x: 70,
        y: yPosition,
        size: 9,
        font: helveticaFont,
        color: rgb(0.4, 0.4, 0.4)
      });
    } catch (err) {
      console.error('Errore embedding firma:', err);
      page1.drawText('[Firma non disponibile]', {
        x: 70,
        y: yPosition,
        size: 10,
        font: helveticaFont,
        color: rgb(0.7, 0, 0)
      });
    }
  }

  // Footer
  page1.drawText('Agentur Pflege Teufel • Regentenstraße 88 • 51063 Köln • IK: 590523228', {
    x: 50,
    y: 30,
    size: 8,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5)
  });

  // Salva il PDF
  const pdfBytes = await pdfDoc.save();

  console.log(`✅ PDF generato: ${pdfBytes.length} bytes`);

  return pdfBytes;
}

// ==================== EMAIL WITH PDF ATTACHMENT ====================

async function sendPflegeboxEmailWithPDF(env, formData, pdfBytes) {
  const toEmail = 'pflegeteufelagentur@gmail.com';
  const fromEmail = 'bestellung@send.pflegeteufel.de';
  const subject = `📦 Neue Pflegebox Bestellung - ${formData.versicherte.vorname} ${formData.versicherte.name}`;

  // Converti PDF in base64 per l'allegato
  const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfBytes)));

  // Email body semplice
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
            filename: `Pflegebox_${formData.versicherte.name}_${formData.bestelldatum}.pdf`,
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

  // SendGrid
  if (env.SENDGRID_API_KEY) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: toEmail }] }],
        from: { email: fromEmail },
        subject: subject,
        content: [{ type: 'text/plain', value: emailText }],
        attachments: [
          {
            content: pdfBase64,
            filename: `Pflegebox_${formData.versicherte.name}_${formData.bestelldatum}.pdf`,
            type: 'application/pdf',
            disposition: 'attachment'
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    console.log('✅ Email con PDF inviata via SendGrid');
    return { success: true };
  }

  console.warn('⚠️ Nessun servizio email configurato');
  return { success: false, note: 'No email service configured' };
}
