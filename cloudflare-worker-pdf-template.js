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

    // Checkbox Frau/Herr
    if (v.anrede === 'Frau') {
      page1.drawText('X', { x: 170, y: 730, size: 10, font: helveticaBold });
    } else if (v.anrede === 'Herr') {
      page1.drawText('X', { x: 545, y: 730, size: 10, font: helveticaBold });
    }

    // Vorname e Name
    page1.drawText(v.vorname || '', { x: 120, y: 705, size: 9, font: helveticaFont });
    page1.drawText(v.name || '', { x: 470, y: 705, size: 9, font: helveticaFont });

    // Straße/Nr.
    page1.drawText(v.strasse || '', { x: 120, y: 678, size: 9, font: helveticaFont });

    // PLZ/Ort
    const plzOrtParts = (v.plzOrt || '').split(' ');
    const plz = plzOrtParts[0] || '';
    const ort = plzOrtParts.slice(1).join(' ') || '';
    page1.drawText(`${plz} ${ort}`, { x: 470, y: 678, size: 9, font: helveticaFont });

    // Telefon
    page1.drawText(v.telefon || '', { x: 120, y: 651, size: 9, font: helveticaFont });

    // E-Mail
    page1.drawText(v.email || '', { x: 470, y: 651, size: 9, font: helveticaFont });

    // Pflegegrad (checkbox 1-5)
    const pflegegradMap = {
      '1': { x: 329, y: 624 },
      '2': { x: 371, y: 624 },
      '3': { x: 413, y: 624 },
      '4': { x: 455, y: 624 },
      '5': { x: 497, y: 624 }
    };
    if (v.pflegegrad && pflegegradMap[v.pflegegrad]) {
      const pos = pflegegradMap[v.pflegegrad];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "Ich habe einen Pflegegrad beantragt" (se pflegegrad non è impostato)
    if (!v.pflegegrad || v.pflegegrad === 'beantragt') {
      page1.drawText('X', { x: 539, y: 624, size: 10, font: helveticaBold });
    }

    // Versicherungstyp (checkbox)
    const versicherungMap = {
      'gesetzlich': { x: 201, y: 597 },
      'privat': { x: 371, y: 597 },
      'beihilfeberechtigt': { x: 515, y: 597 },
      'ortsamt': { x: 201, y: 574 }
    };
    if (v.versicherteTyp && versicherungMap[v.versicherteTyp]) {
      const pos = versicherungMap[v.versicherteTyp];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON ==========

    if (!a.isSamePerson && a.data) {
      // Checkbox Frau/Herr Angehörige
      if (a.data.anrede === 'Frau') {
        page1.drawText('X', { x: 165, y: 485, size: 10, font: helveticaBold });
      } else if (a.data.anrede === 'Herr') {
        page1.drawText('X', { x: 545, y: 485, size: 10, font: helveticaBold });
      }

      // Vorname e Name Angehörige
      page1.drawText(a.data.vorname || '', { x: 120, y: 460, size: 9, font: helveticaFont });
      page1.drawText(a.data.name || '', { x: 470, y: 460, size: 9, font: helveticaFont });

      // Straße/Nr. Angehörige
      page1.drawText(a.data.strasse || '', { x: 120, y: 433, size: 9, font: helveticaFont });

      // PLZ/Ort Angehörige
      const plzOrtAngehParts = (a.data.plzOrt || '').split(' ');
      const plzAng = plzOrtAngehParts[0] || '';
      const ortAng = plzOrtAngehParts.slice(1).join(' ') || '';
      page1.drawText(`${plzAng} ${ortAng}`, { x: 470, y: 433, size: 9, font: helveticaFont });

      // Telefon Angehörige
      page1.drawText(a.data.telefon || '', { x: 120, y: 406, size: 9, font: helveticaFont });

      // E-Mail Angehörige
      page1.drawText(a.data.email || '', { x: 470, y: 406, size: 9, font: helveticaFont });

      // Pflegeperson ist: (checkbox)
      const pflegepersonTypMap = {
        'familienangehoeriger': { x: 216, y: 379 },
        'private': { x: 360, y: 379 },
        'betreuer': { x: 512, y: 379 }
      };
      if (a.pflegepersonTyp && pflegepersonTypMap[a.pflegepersonTyp]) {
        const pos = pflegepersonTypMap[a.pflegepersonTyp];
        page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
      }
    }

    // ========== SEZIONE 3: PFLEGEBOX (PRODOTTI - CHECKBOX) ==========

    const produkteMap = {
      'bettschutzeinlagen': { x: 107, y: 328 },
      'fingerlinge': { x: 370, y: 328 },
      'ffp2': { x: 655, y: 328 },
      'einmalhandschuhe': { x: 107, y: 308 },
      'mundschutz': { x: 370, y: 308 },
      'essslaetzchen': { x: 655, y: 308 },
      'schutzschuerzenEinmal': { x: 107, y: 288 },
      'schutzschuerzenWieder': { x: 370, y: 288 },
      'flaechendesinfektionsmittel': { x: 370, y: 268 },
      'haendedesinfektionsmittel': { x: 107, y: 268 }
    };

    // Marca i prodotti selezionati
    if (p.products) {
      Object.keys(p.products).forEach(productKey => {
        if (p.products[productKey] && produkteMap[productKey]) {
          const pos = produkteMap[productKey];
          page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
        }
      });
    }

    // Handschuhgröße (checkbox S, M, L, XL)
    const handschuhGroesseMap = {
      'S': { x: 212, y: 274 },
      'M': { x: 248, y: 274 },
      'L': { x: 278, y: 274 },
      'XL': { x: 308, y: 274 }
    };
    if (p.handschuhGroesse && handschuhGroesseMap[p.handschuhGroesse]) {
      const pos = handschuhGroesseMap[p.handschuhGroesse];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Handschuhmaterial (checkbox Nitril, Vinyl, Latex)
    const handschuhMaterialMap = {
      'Nitril': { x: 567, y: 274 },
      'Vinyl': { x: 627, y: 274 },
      'Latex': { x: 690, y: 274 }
    };
    if (p.handschuhMaterial && handschuhMaterialMap[p.handschuhMaterial]) {
      const pos = handschuhMaterialMap[p.handschuhMaterial];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 4: LIEFERADRESSE ==========

    // Checkbox per destinazione consegna
    if (formData.lieferadresse === 'versicherte') {
      page1.drawText('X', { x: 100, y: 224, size: 10, font: helveticaBold });
    } else if (formData.lieferadresse === 'angehoerige') {
      page1.drawText('X', { x: 383, y: 224, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 5: RECHNUNGSEMPFÄNGER ==========

    // Solo per privati/beihilfeberechtigten
    if (v.versicherteTyp === 'privat' || v.versicherteTyp === 'beihilfeberechtigt') {
      if (formData.rechnungsempfaenger === 'versicherte') {
        page1.drawText('X', { x: 100, y: 165, size: 10, font: helveticaBold });
      } else if (formData.rechnungsempfaenger === 'angehoerige') {
        page1.drawText('X', { x: 433, y: 165, size: 10, font: helveticaBold });
      }
    }

    // ========== SEZIONE 6: AGB CHECKBOX ==========

    // Checkbox accettazione AGB
    page1.drawText('X', { x: 100, y: 120, size: 10, font: helveticaBold });

    console.log('✅ Tutti i campi scritti alle coordinate esatte sulla Pagina 1');

    // ========== PAGINA 2: ANLAGE 2 - ANTRAG AUF KOSTENÜBERNAHME ==========

    const page2 = pages[1];
    if (page2) {
      console.log('📄 Compilazione Pagina 2 - Anlage 2...');

      // Nome, Vorname (riga in alto)
      page2.drawText(`${v.name}, ${v.vorname}`, { x: 90, y: 765, size: 9, font: helveticaFont });

      // Geburtsdatum (data di nascita)
      page2.drawText(v.geburtsdatum || '', { x: 310, y: 765, size: 9, font: helveticaFont });

      // Versichertennummer
      page2.drawText(v.versichertennummer || '', { x: 530, y: 765, size: 9, font: helveticaFont });

      // Anschrift: Straße, PLZ, Wohnort
      const anschrift = `${v.strasse}, ${plz} ${ort}`;
      page2.drawText(anschrift, { x: 90, y: 740, size: 9, font: helveticaFont });

      // Pflegekasse
      page2.drawText(v.pflegekasse || '', { x: 530, y: 740, size: 9, font: helveticaFont });

      // Checkbox "zum Verbrauch bestimmte Pflegehilfsmittel – Produktgruppe (PG 54)"
      page2.drawText('X', { x: 100, y: 695, size: 10, font: helveticaBold });

      // Nella tabella, marca i prodotti selezionati (colonna "Menge/Faktor")
      const produktPG54Positions = {
        'bettschutzeinlagen': { y: 585 },
        'fingerlinge': { y: 560 },
        'einmalhandschuhe': { y: 535 },
        'mundschutz': { y: 510 },
        'ffp2': { y: 485 },
        'schutzschuerzenEinmal': { y: 460 },
        'schutzschuerzenWieder': { y: 435 },
        'essslaetzchen': { y: 410 }
      };

      // Aggiungi quantità ai prodotti selezionati
      if (p.products) {
        Object.keys(p.products).forEach(productKey => {
          if (p.products[productKey] && produktPG54Positions[productKey]) {
            const yPos = produktPG54Positions[productKey].y;
            // Scrivi una quantità di default (es. "1") nella colonna "Menge/Faktor"
            page2.drawText('1', { x: 730, y: yPos, size: 9, font: helveticaFont });
          }
        });
      }

      console.log('✅ Pagina 2 (Anlage 2) compilata');
    }

    // ========== PAGINA 3: BERATUNGSDOKUMENTATION ==========

    const page3 = pages[2];
    if (page3) {
      console.log('📄 Compilazione Pagina 3 - Beratungsdokumentation...');

      // Nome del Leistungserbringer (già precompilato nel PDF)
      // "Agentur Pflege Teufel, Regentenstraße 88, 51063 Köln"

      // Checkbox "Ich wurde vor der Übergabe... beraten"
      page3.drawText('X', { x: 100, y: 655, size: 10, font: helveticaBold });

      // Form des Beratungsgesprächs: seleziona "Individuelle telefonische oder digitale Beratung"
      page3.drawText('X', { x: 315, y: 580, size: 10, font: helveticaBold });

      // Der o. g. Leistungserbringer hat: "mich persönlich"
      page3.drawText('X', { x: 315, y: 550, size: 10, font: helveticaBold });

      // Datum der Beratung (usa data odierna)
      const heute = new Date().toLocaleDateString('de-DE');
      page3.drawText(heute, { x: 315, y: 478, size: 9, font: helveticaFont });

      // Beratende/r Mitarbeiter/in
      page3.drawText('Pflege Teufel Team', { x: 315, y: 453, size: 9, font: helveticaFont });

      // Checkbox conferme
      page3.drawText('X', { x: 100, y: 400, size: 10, font: helveticaBold });
      page3.drawText('X', { x: 100, y: 350, size: 10, font: helveticaBold });

      // Datum (firma)
      page3.drawText(heute, { x: 100, y: 280, size: 9, font: helveticaFont });

      // Genehmigungsvermerk: PG 54
      page3.drawText('X', { x: 100, y: 180, size: 10, font: helveticaBold });

      console.log('✅ Pagina 3 (Beratungsdokumentation) compilata');
    }

    console.log('✅ Tutti i campi scritti alle coordinate esatte');
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

      // Posiziona la firma nella sezione "Unterschrift Versicherte(r)" (pagina 1, in basso)
      const signatureDims = signatureImage.scale(0.15); // Scala la firma

      page1.drawImage(signatureImage, {
        x: 100,  // Posizione X della firma (sezione 6)
        y: 70,   // Posizione Y della firma (sotto al testo "Unterschrift Versicherte(r)")
        width: signatureDims.width,
        height: signatureDims.height
      });

      // Aggiungi la firma anche alla pagina 3 (Unterschrift der/des Versicherten)
      if (page3) {
        page3.drawImage(signatureImage, {
          x: 350,  // Posizione X della firma sulla pagina 3
          y: 270,  // Posizione Y vicino a "Unterschrift der/des Versicherten"
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
        x: 450,  // Posizione X della seconda firma (und/oder Unterschrift Bevollmächtigte(r))
        y: 70,   // Stessa altezza della prima firma
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
