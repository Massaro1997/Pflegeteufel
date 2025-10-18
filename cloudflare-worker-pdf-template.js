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

    // COORDINATE CALIBRATE VISUALMENTE con TEST_PDF_OVERLAY.pdf
    // Base: Y=718 per riga Vorname/Name (BLU -2px)
    // Distanza tra righe: 23pt

    // Riga 1: Checkbox Frau/Herr (23pt sopra Vorname)
    if (v.anrede === 'Frau') {
      page1.drawText('X', { x: 130, y: 741, size: 10, font: helveticaBold });
    } else if (v.anrede === 'Herr') {
      page1.drawText('X', { x: 505, y: 741, size: 10, font: helveticaBold });
    }

    // Riga 2: Vorname / Name (Y=718 - CALIBRATO)
    page1.drawText(v.vorname || '', { x: 150, y: 718, size: 10, font: helveticaFont });
    page1.drawText(v.name || '', { x: 435, y: 718, size: 10, font: helveticaFont });

    // Riga 3: Straße / PLZ/Ort (23pt sotto Vorname)
    page1.drawText(v.strasse || '', { x: 150, y: 695, size: 10, font: helveticaFont });

    const plzOrtParts = (v.plzOrt || '').split(' ');
    const plz = plzOrtParts[0] || '';
    const ort = plzOrtParts.slice(1).join(' ') || '';
    page1.drawText(`${plz} ${ort}`, { x: 435, y: 695, size: 10, font: helveticaFont });

    // Riga 4: Telefon / Email (23pt sotto Straße)
    page1.drawText(v.telefon || '', { x: 150, y: 672, size: 10, font: helveticaFont });
    page1.drawText(v.email || '', { x: 435, y: 672, size: 10, font: helveticaFont });

    // Riga 5: Pflegegrad checkbox (23pt sotto Telefon)
    const pflegegradMap = {
      '1': { x: 292, y: 649 },
      '2': { x: 335, y: 649 },
      '3': { x: 378, y: 649 },
      '4': { x: 421, y: 649 },
      '5': { x: 464, y: 649 }
    };
    if (v.pflegegrad && pflegegradMap[v.pflegegrad]) {
      const pos = pflegegradMap[v.pflegegrad];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "Ich habe einen Pflegegrad beantragt"
    if (!v.pflegegrad || v.pflegegrad === 'beantragt') {
      page1.drawText('X', { x: 498, y: 649, size: 10, font: helveticaBold });
    }

    // Riga 6: Versicherungstyp (23pt sotto Pflegegrad)
    const versicherungMap = {
      'gesetzlich': { x: 165, y: 626 },
      'privat': { x: 337, y: 626 },
      'beihilfeberechtigt': { x: 479, y: 626 }
    };
    if (v.versicherteTyp && versicherungMap[v.versicherteTyp]) {
      const pos = versicherungMap[v.versicherteTyp];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "über Ortsamt/Sozialamt versichert" (23pt sotto Versicherungstyp)
    if (v.versicherteTyp === 'ortsamt') {
      page1.drawText('X', { x: 165, y: 603, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON ==========

    if (!a.isSamePerson && a.data) {
      // Sezione 2 inizia ~161pt sotto Sezione 1 (7 righe * 23pt)
      // Base: 718 - 161 = 557

      // Riga 1: Checkbox Frau/Herr (23pt sopra riga Vorname)
      if (a.data.anrede === 'Frau') {
        page1.drawText('X', { x: 130, y: 580, size: 10, font: helveticaBold });
      } else if (a.data.anrede === 'Herr') {
        page1.drawText('X', { x: 505, y: 580, size: 10, font: helveticaBold });
      }

      // Riga 2: Vorname / Name (Y=557)
      page1.drawText(a.data.vorname || '', { x: 150, y: 557, size: 10, font: helveticaFont });
      page1.drawText(a.data.name || '', { x: 435, y: 557, size: 10, font: helveticaFont });

      // Riga 3: Straße / PLZ/Ort (23pt sotto)
      page1.drawText(a.data.strasse || '', { x: 150, y: 534, size: 10, font: helveticaFont });

      const plzOrtAngehParts = (a.data.plzOrt || '').split(' ');
      const plzAng = plzOrtAngehParts[0] || '';
      const ortAng = plzOrtAngehParts.slice(1).join(' ') || '';
      page1.drawText(`${plzAng} ${ortAng}`, { x: 435, y: 534, size: 10, font: helveticaFont });

      // Riga 4: Telefon / Email (23pt sotto)
      page1.drawText(a.data.telefon || '', { x: 150, y: 511, size: 10, font: helveticaFont });
      page1.drawText(a.data.email || '', { x: 435, y: 511, size: 10, font: helveticaFont });

      // Riga 5: Pflegeperson ist (23pt sotto)
      const pflegepersonTypMap = {
        'familienangehoeriger': { x: 180, y: 488 },
        'private': { x: 323, y: 488 },
        'betreuer': { x: 475, y: 488 }
      };
      if (a.pflegepersonTyp && pflegepersonTypMap[a.pflegepersonTyp]) {
        const pos = pflegepersonTypMap[a.pflegepersonTyp];
        page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
      }
    }

    // ========== SEZIONE 3: PFLEGEBOX (PRODOTTI - CHECKBOX) ==========

    // Sezione prodotti - coordinate calibrate visualmente
    // Circa 240pt sotto Section 1 (layout visuale del PDF)
    const produkteMap = {
      'bettschutzeinlagen': { x: 72, y: 428 },
      'fingerlinge': { x: 340, y: 428 },
      'ffp2': { x: 618, y: 428 },
      'einmalhandschuhe': { x: 72, y: 408 },
      'mundschutz': { x: 340, y: 408 },
      'essslaetzchen': { x: 618, y: 408 },
      'schutzschuerzenEinmal': { x: 72, y: 388 },
      'schutzschuerzenWieder': { x: 340, y: 388 },
      'flaechendesinfektionsmittel': { x: 340, y: 368 },
      'haendedesinfektionsmittel': { x: 72, y: 368 }
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

    // Handschuhgröße (checkbox S, M, L, XL) - y=341
    const handschuhGroesseMap = {
      'S': { x: 175, y: 341 },
      'M': { x: 212, y: 341 },
      'L': { x: 241, y: 341 },
      'XL': { x: 270, y: 341 }
    };
    if (p.handschuhGroesse && handschuhGroesseMap[p.handschuhGroesse]) {
      const pos = handschuhGroesseMap[p.handschuhGroesse];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Handschuhmaterial (checkbox Nitril, Vinyl, Latex) - y=341
    const handschuhMaterialMap = {
      'Nitril': { x: 530, y: 341 },
      'Vinyl': { x: 590, y: 341 },
      'Latex': { x: 650, y: 341 }
    };
    if (p.handschuhMaterial && handschuhMaterialMap[p.handschuhMaterial]) {
      const pos = handschuhMaterialMap[p.handschuhMaterial];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 4: LIEFERADRESSE ==========

    // Checkbox destinazione consegna (y=317)
    if (formData.lieferadresse === 'versicherte') {
      page1.drawText('X', { x: 65, y: 317, size: 10, font: helveticaBold });
    } else if (formData.lieferadresse === 'angehoerige') {
      page1.drawText('X', { x: 345, y: 317, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 5: RECHNUNGSEMPFÄNGER ==========

    // Solo per privati/beihilfeberechtigten (y=281)
    if (v.versicherteTyp === 'privat' || v.versicherteTyp === 'beihilfeberechtigt') {
      if (formData.rechnungsempfaenger === 'versicherte') {
        page1.drawText('X', { x: 65, y: 281, size: 10, font: helveticaBold });
      } else if (formData.rechnungsempfaenger === 'angehoerige') {
        page1.drawText('X', { x: 396, y: 281, size: 10, font: helveticaBold });
      }
    }

    // ========== SEZIONE 6: AGB CHECKBOX ==========

    // Checkbox accettazione AGB (y=245)
    page1.drawText('X', { x: 65, y: 245, size: 10, font: helveticaBold });

    console.log('✅ Tutti i campi scritti alle coordinate esatte sulla Pagina 1');

    // ========== PAGINA 2: ANLAGE 2 - ANTRAG AUF KOSTENÜBERNAHME ==========

    const page2 = pages[1];
    if (page2) {
      console.log('📄 Compilazione Pagina 2 - Anlage 2...');

      // Nome, Vorname (riga in alto)
      page2.drawText(`${v.name}, ${v.vorname}`, { x: 90, y: 765, size: 8, font: helveticaFont });

      // Geburtsdatum (data di nascita)
      page2.drawText(v.geburtsdatum || '', { x: 310, y: 765, size: 8, font: helveticaFont });

      // Versichertennummer
      page2.drawText(v.versichertennummer || '', { x: 530, y: 765, size: 8, font: helveticaFont });

      // Anschrift: Straße, PLZ, Wohnort
      const anschrift = `${v.strasse}, ${plz} ${ort}`;
      page2.drawText(anschrift, { x: 90, y: 740, size: 8, font: helveticaFont });

      // Pflegekasse (usa font più piccolo per testi lunghi)
      page2.drawText(v.pflegekasse || '', { x: 530, y: 740, size: 8, font: helveticaFont });

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
