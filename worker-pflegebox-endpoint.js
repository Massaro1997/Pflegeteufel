/**
 * Cloudflare Worker Endpoint - Pflegebox Form Submit
 * Da aggiungere al worker esistente: shopify-backend.massarocalogero1997.workers.dev
 */

// ==================== ENDPOINT PRINCIPALE ====================
router.post('/api/pflegebox/submit', async (request, env) => {
  try {
    // Verifica autenticazione
    const workerKey = request.headers.get('X-Worker-Key');
    if (workerKey !== env.SHARED_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ricevi dati dal form
    const formData = await request.json();
    console.log('📦 Pflegebox Form Submit:', {
      versicherte: formData.versicherte?.vorname + ' ' + formData.versicherte?.name,
      angehoerigeIsSame: formData.angehoerige?.isSamePerson,
      timestamp: formData.timestamp
    });

    // Validazione dati essenziali
    if (!formData.versicherte || !formData.versicherte.vorname || !formData.versicherte.name) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Dati richiedente mancanti'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!formData.signatures || !formData.signatures.versicherte) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Firma mancante'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Genera email HTML
    const emailHTML = generatePflegeboxEmailHTML(formData);

    // Invia email (usa Resend o SendGrid)
    await sendPflegeboxEmail(env, formData, emailHTML);

    console.log('✅ Pflegebox form processato con successo');

    // Risposta successo
    return new Response(JSON.stringify({
      success: true,
      message: 'Antrag erfolgreich übermittelt',
      timestamp: new Date().toISOString(),
      data: {
        versicherte: {
          name: `${formData.versicherte.vorname} ${formData.versicherte.name}`,
          email: formData.versicherte.email
        },
        bestelldatum: formData.bestelldatum
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Key'
      }
    });

  } catch (error) {
    console.error('❌ Errore endpoint pflegebox/submit:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      stack: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

// ==================== OPTIONS (CORS) ====================
router.options('/api/pflegebox/submit', async (request) => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Key',
      'Access-Control-Max-Age': '86400'
    }
  });
});

// ==================== GENERA EMAIL HTML ====================
function generatePflegeboxEmailHTML(data) {
  const v = data.versicherte;
  const a = data.angehoerige;
  const p = data.pflegebox;

  let html = `
<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Neue Pflegebox Bestellung</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #C12624; border-bottom: 3px solid #C12624; padding-bottom: 10px; }
        h2 { color: #2c3e50; margin-top: 30px; border-bottom: 2px solid #e9ecef; padding-bottom: 8px; }
        .section { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .field { margin: 8px 0; }
        .label { font-weight: bold; color: #555; }
        .value { color: #000; }
        .products { list-style: none; padding: 0; }
        .products li { padding: 5px 0; }
        .products li:before { content: "✓ "; color: #28a745; font-weight: bold; }
        .signature { margin-top: 20px; padding: 15px; background: white; border: 2px solid #C12624; border-radius: 8px; }
        .signature img { max-width: 300px; display: block; }
        .footer { margin-top: 40px; padding-top: 20px; border-top: 2px solid #e9ecef; font-size: 0.9em; color: #666; }
        .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 12px; margin: 15px 0; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 12px; margin: 15px 0; }
    </style>
</head>
<body>
    <h1>📦 Neue Pflegebox Bestellung</h1>

    <div class="success">
        <strong>Neue Bestellung eingegangen!</strong><br>
        Datum: ${data.bestelldatum} um ${data.bestellzeit}
    </div>

    <h2>1. Antragsteller (Versicherte/r)</h2>
    <div class="section">
        <div class="field"><span class="label">Anrede:</span> <span class="value">${v.anrede}</span></div>
        <div class="field"><span class="label">Name:</span> <span class="value">${v.vorname} ${v.name}</span></div>
        <div class="field"><span class="label">Adresse:</span> <span class="value">${v.strasse}, ${v.plzOrt}</span></div>
        <div class="field"><span class="label">Telefon:</span> <span class="value">${v.telefon || 'nicht angegeben'}</span></div>
        <div class="field"><span class="label">E-Mail:</span> <span class="value">${v.email}</span></div>
        <div class="field"><span class="label">Geburtsdatum:</span> <span class="value">${v.geburtsdatum || 'nicht angegeben'}</span></div>
        <div class="field"><span class="label">Versichertennummer:</span> <span class="value">${v.versichertennummer || 'nicht angegeben'}</span></div>
        <div class="field"><span class="label">Pflegegrad:</span> <span class="value">${v.pflegegrad}</span></div>
        <div class="field"><span class="label">Versicherung:</span> <span class="value">${v.versicherteTyp}</span></div>
        ${v.sozialamt ? `<div class="field"><span class="label">Sozialamt:</span> <span class="value">${v.sozialamt}</span></div>` : ''}
        <div class="field"><span class="label">Pflegekasse:</span> <span class="value">${v.pflegekasse || 'nicht angegeben'}</span></div>
    </div>

    <h2>2. Angehörige(r) / Pflegeperson</h2>
    <div class="section">`;

  if (a.isSamePerson) {
    html += `
        <div class="alert">
            <strong>⚠️ GLEICHE PERSON WIE ANTRAGSTELLER</strong><br>
            Die Pflegeperson ist dieselbe wie der/die Antragsteller(in).<br>
            Daten entsprechen: ${v.vorname} ${v.name}
        </div>`;
  } else {
    html += `
        <div class="field"><span class="label">Anrede:</span> <span class="value">${a.data.anrede}</span></div>
        <div class="field"><span class="label">Name:</span> <span class="value">${a.data.vorname} ${a.data.name}</span></div>
        <div class="field"><span class="label">Adresse:</span> <span class="value">${a.data.strasse}, ${a.data.plzOrt}</span></div>
        <div class="field"><span class="label">Telefon:</span> <span class="value">${a.data.telefon || 'nicht angegeben'}</span></div>
        <div class="field"><span class="label">E-Mail:</span> <span class="value">${a.data.email || 'nicht angegeben'}</span></div>
        <div class="field"><span class="label">Pflegeperson ist:</span> <span class="value">${a.data.typ}</span></div>`;
  }

  html += `
    </div>

    <h2>3. Bestellte Pflegebox</h2>
    <div class="section">
        <strong>Produkte:</strong>
        <ul class="products">`;

  // Lista prodotti selezionati
  for (const [key, value] of Object.entries(p.products)) {
    if (value) {
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
      html += `<li>${productNames[key] || key}</li>`;
    }
  }

  html += `
        </ul>
        <div class="field" style="margin-top: 15px;"><span class="label">Handschuhgröße:</span> <span class="value">${p.handschuhGroesse}</span></div>
        <div class="field"><span class="label">Handschuhmaterial:</span> <span class="value">${p.handschuhMaterial}</span></div>
    </div>

    <h2>4. Lieferung & Rechnung</h2>
    <div class="section">
        <div class="field"><span class="label">Lieferung an:</span> <span class="value">${data.lieferung.an === 'versicherte' ? 'Versicherte(n)' : 'Angehörige(n)'}</span></div>
        <div class="field"><span class="label">Rechnung an:</span> <span class="value">${data.rechnung.an === 'versicherte' ? 'Versicherte(r)' : 'Angehörige(r)'}</span></div>
    </div>

    <h2>5. Unterschrift</h2>
    <div class="signature">
        <strong>Unterschrift Versicherte(r):</strong><br>
        <img src="${data.signatures.versicherte}" alt="Unterschrift" />
        <p style="margin-top: 10px; font-size: 0.9em; color: #666;">
            Unterschrieben am: ${data.bestelldatum} um ${data.bestellzeit}
        </p>
    </div>

    ${data.signatures.bevollmaechtigter ? `
    <div class="signature">
        <strong>Unterschrift Bevollmächtigte(r):</strong><br>
        <img src="${data.signatures.bevollmaechtigter}" alt="Unterschrift Bevollmächtigter" />
    </div>
    ` : ''}

    <div class="footer">
        <strong>Agentur Pflege Teufel</strong><br>
        Regentenstraße 88<br>
        51063 Köln<br>
        IK: 590523228<br>
        <br>
        <em>Diese E-Mail wurde automatisch generiert durch das Online-Bestellformular.</em>
    </div>
</body>
</html>`;

  return html;
}

// ==================== INVIA EMAIL ====================
async function sendPflegeboxEmail(env, formData, emailHTML) {
  // Indirizzo email aziendale
  const toEmail = 'info@pflegeteufel.de'; // Cambia con l'email corretta
  const fromEmail = 'noreply@pflegeteufel.de';

  const subject = `📦 Neue Pflegebox Bestellung - ${formData.versicherte.vorname} ${formData.versicherte.name}`;

  // Usa Resend API (se configurato)
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
        html: emailHTML
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Resend API error: ${error}`);
    }

    const result = await response.json();
    console.log('✅ Email inviata via Resend:', result.id);
    return result;
  }

  // Alternativa: SendGrid
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
        content: [{ type: 'text/html', value: emailHTML }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`SendGrid API error: ${error}`);
    }

    console.log('✅ Email inviata via SendGrid');
    return { success: true };
  }

  // Se nessun servizio email configurato
  console.warn('⚠️ Nessun servizio email configurato. Email non inviata.');
  console.log('📧 Email HTML generata:', emailHTML.substring(0, 200) + '...');

  return { success: true, note: 'No email service configured' };
}

// ==================== ESPORTA (se usi export) ====================
export { router };
