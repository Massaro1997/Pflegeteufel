export default {
  async fetch(request, env) {
    const {
      SHOPIFY_ADMIN_TOKEN,
      SHOPIFY_API_VERSION = "2024-01",
      ALLOWED_ORIGIN,
      WORKER_SHARED_KEY
    } = env;

    // ✅ FIX: Pulisci SHOPIFY_SHOP da spazi e newline
    const SHOPIFY_SHOP = (env.SHOPIFY_SHOP || "").trim().replace(/[\r\n]/g, "");

    // CORS
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

    // Auth - Supporta sia X-Worker-Key che X-Shared-Key
    const sentKey = (request.headers.get("X-Worker-Key") || request.headers.get("X-Shared-Key") || "").trim();
    const sharedKey = (WORKER_SHARED_KEY || "").trim();

    const url = new URL(request.url);
    const path = url.pathname;

    // ✅ NUOVO: Endpoint pubblico per health check (senza auth)
    if (path === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        origin,
        allowed: isAllowed,
        keyPresent: !!sentKey,
        keyMatch: sharedKey ? sentKey === sharedKey : true,
        shopifyShop: SHOPIFY_SHOP, // Mostra il valore pulito
        timestamp: new Date().toISOString(),
        version: SHOPIFY_API_VERSION
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*" // Health check è pubblico
        }
      });
    }

    // ✅ NUOVO: Endpoint di test pubblico (senza auth) - RIMUOVERE IN PRODUZIONE
    if (path === "/test/customers") {
      try {
        const params = new URLSearchParams();
        params.set("limit", "3");
        params.set("fields", "id,first_name,last_name,email,phone,created_at,orders_count");

        const endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers.json?${params}`;

        const resp = await fetch(endpoint, {
          headers: {
            "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
            "Content-Type": "application/json"
          }
        });

        const data = await resp.json();

        return new Response(JSON.stringify({
          success: true,
          endpoint: endpoint,
          status: resp.status,
          customers: data.customers || [],
          count: (data.customers || []).length,
          timestamp: new Date().toISOString()
        }), {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({
          error: true,
          message: String(err),
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    if (sharedKey && sentKey !== sharedKey) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_TOKEN) {
      return new Response(JSON.stringify({ error: "Missing config" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse body for POST/PUT/DELETE
    let body = null;
    let method = request.method;

    if (["POST", "PUT", "DELETE"].includes(method)) {
      try {
        const text = await request.text();
        if (text) {
          body = JSON.parse(text);
          if (body._method) {
            method = body._method;
            delete body._method;
          }
        }
      } catch (e) {
        console.log('Parse body error:', e);
      }
    }

    // Route handling
    try {
      let endpoint;
      let shopifyMethod = method;
      let shopifyBody = null;

      console.log(`🚀 Processing ${method} ${path}`);

      // ========== ORDERS ==========
      if (path === "/orders") {
        const params = new URLSearchParams();
        params.set("limit", url.searchParams.get("limit") || "25");
        params.set("status", url.searchParams.get("status") || "any");
        if (url.searchParams.get("created_at_min")) params.set("created_at_min", url.searchParams.get("created_at_min"));
        if (url.searchParams.get("created_at_max")) params.set("created_at_max", url.searchParams.get("created_at_max"));
        if (url.searchParams.get("page_info")) params.set("page_info", url.searchParams.get("page_info"));
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/orders.json?${params}`;
      }
      // Single Order
      else if (path.match(/^\/orders\/\d+$/)) {
        const orderId = path.split("/")[2];
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderId}.json`;
      }

      // ========== CUSTOMERS ==========
      else if (path === "/customers") {
        if (method === "POST") {
          shopifyMethod = "POST";
          shopifyBody = JSON.stringify(body);
          endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers.json`;
          console.log('📝 Creating customer:', body);
        } else {
          const params = new URLSearchParams();
          params.set("limit", url.searchParams.get("limit") || "25");
          params.set("order", url.searchParams.get("order") || "created_at desc");

          // ✅ FIX PRINCIPALE: Passa TUTTI i parametri dalla query string
          for (const [key, value] of url.searchParams.entries()) {
            if (!params.has(key)) {
              params.set(key, value);
            }
          }

          // Gestione ricerca
          const query = url.searchParams.get("query");
          if (query) {
            endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?${params}`;
          } else {
            endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers.json?${params}`;
          }
          console.log('👥 Fetching customers from:', endpoint);
        }
      }
      // Single Customer
      else if (path.match(/^\/customers\/\d+$/)) {
        const customerId = path.split("/")[2];
        if (method === "PUT") {
          shopifyMethod = "PUT";
          shopifyBody = JSON.stringify(body);
          console.log('📝 Updating customer:', customerId, body);
        } else if (method === "DELETE") {
          shopifyMethod = "DELETE";
          console.log('🗑️ Deleting customer:', customerId);
        } else {
          console.log('👁️ Fetching customer:', customerId);
        }
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}.json`;
      }
      // ✅ NUOVO: Customer Orders - Get orders for a specific customer
      else if (path.match(/^\/customers\/\d+\/orders$/)) {
        const customerId = path.split("/")[2];
        const params = new URLSearchParams();
        params.set("limit", url.searchParams.get("limit") || "10");
        params.set("status", url.searchParams.get("status") || "any");

        // ✅ IMPORTANTE: Richiedi esplicitamente tutti i campi customer e address
        if (!url.searchParams.get("fields")) {
          params.set("fields", "id,name,customer,billing_address,shipping_address,line_items");
        }

        // Passa tutti i parametri dalla query string
        for (const [key, value] of url.searchParams.entries()) {
          if (!params.has(key)) {
            params.set(key, value);
          }
        }

        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers/${customerId}/orders.json?${params}`;
        console.log('📦 Fetching orders for customer:', customerId);
      }

      // ========== PRODUCTS ==========
      else if (path === "/products") {
        if (method === "POST") {
          shopifyMethod = "POST";
          shopifyBody = JSON.stringify(body);
          endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/products.json`;
          console.log('📱 Creating product:', body);
        } else {
          const params = new URLSearchParams();
          params.set("limit", url.searchParams.get("limit") || "25");
          params.set("order", url.searchParams.get("order") || "created_at desc");

          // ✅ FIX: Passa TUTTI i parametri dalla query string
          for (const [key, value] of url.searchParams.entries()) {
            if (!params.has(key)) {
              params.set(key, value);
            }
          }

          endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/products.json?${params}`;
          console.log('📱 Fetching products from:', endpoint);
        }
      }
      // Single Product
      else if (path.match(/^\/products\/\d+$/)) {
        const productId = path.split("/")[2];
        if (method === "PUT") {
          shopifyMethod = "PUT";
          shopifyBody = JSON.stringify(body);
          console.log('📝 Updating product:', productId, body);
        } else if (method === "DELETE") {
          shopifyMethod = "DELETE";
          console.log('🗑️ Deleting product:', productId);
        } else {
          console.log('👁️ Fetching product:', productId);
        }
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/products/${productId}.json`;
      }

      // ========== VARIANTS (for inventory) ==========
      else if (path.match(/^\/variants\/\d+$/)) {
        const variantId = path.split("/")[2];
        if (method === "PUT") {
          shopifyMethod = "PUT";
          shopifyBody = JSON.stringify(body);
          console.log('📊 Updating variant inventory:', variantId, body);
        }
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/variants/${variantId}.json`;
      }

      // ========== LOCATIONS (for inventory) ==========
      else if (path === "/locations") {
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/locations.json`;
        console.log('📍 Fetching locations');
      }

      // ========== INVENTORY LEVELS ==========
      else if (path === "/inventory_levels/set") {
        shopifyMethod = "POST";
        shopifyBody = JSON.stringify(body);
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/inventory_levels/set.json`;
        console.log('📊 Setting inventory level:', body);
      }

      // ========== INVENTORY LEVELS (GET) ==========
      else if (path === "/inventory_levels") {
        const params = new URLSearchParams();
        if (url.searchParams.get("location_ids")) {
          params.set("location_ids", url.searchParams.get("location_ids"));
        }
        if (url.searchParams.get("inventory_item_ids")) {
          params.set("inventory_item_ids", url.searchParams.get("inventory_item_ids"));
        }
        params.set("limit", url.searchParams.get("limit") || "50");
        endpoint = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/inventory_levels.json?${params}`;
        console.log('📊 Fetching inventory levels from:', endpoint);
      }

      // ========== PFLEGEBOX FORM SUBMIT ==========
      else if (path === "/api/pflegebox/submit" && method === "POST") {
        try {
          const formData = body; // body già parsed (righe 130-141)

          console.log('📦 Pflegebox Form Submit:', {
            versicherte: formData.versicherte?.vorname + ' ' + formData.versicherte?.name,
            angehoerigeIsSame: formData.angehoerige?.isSamePerson,
            timestamp: formData.timestamp
          });

          // Validazione dati essenziali
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

          // Genera email HTML
          const emailHTML = generatePflegeboxEmailHTML(formData);

          // Invia email
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
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('❌ Errore endpoint pflegebox/submit:', error);
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

      else {
        return new Response(JSON.stringify({
          error: "Not found",
          path: path,
          availableEndpoints: [
            "/health (public)",
            "/test/customers (public - REMOVE IN PRODUCTION)",
            "/orders", "/orders/:id",
            "/customers", "/customers/:id", "/customers/:id/orders",
            "/products", "/products/:id",
            "/variants/:id",
            "/locations", "/inventory_levels", "/inventory_levels/set",
            "/api/pflegebox/submit (POST)"
          ]
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      console.log(`🔗 Shopify URL: ${endpoint}`);

      const fetchOptions = {
        method: shopifyMethod,
        headers: {
          "X-Shopify-Access-Token": SHOPIFY_ADMIN_TOKEN,
          "Content-Type": "application/json"
        }
      };

      if (shopifyBody) {
        fetchOptions.body = shopifyBody;
        console.log(`📤 Request body: ${shopifyBody}`);
      }

      const resp = await fetch(endpoint, fetchOptions);
      const linkHeader = resp.headers.get("link") || "";
      const text = await resp.text();

      console.log(`📥 Shopify response: ${resp.status} ${resp.statusText}`);

      let responseBody;
      try {
        responseBody = text ? JSON.parse(text) : {};
      } catch (e) {
        responseBody = { raw: text };
      }

      const finalResponse = {
        page: responseBody,
        link: linkHeader,
        timestamp: new Date().toISOString()
      };

      return new Response(JSON.stringify(finalResponse), {
        status: resp.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });

    } catch (err) {
      console.error('❌ Worker error:', err);
      return new Response(JSON.stringify({
        error: "Upstream failed",
        message: String(err),
        stack: err.stack,
        timestamp: new Date().toISOString()
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }
  }
}

// ==================== PFLEGEBOX HELPER FUNCTIONS ====================

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

async function sendPflegeboxEmail(env, formData, emailHTML) {
  // Indirizzo email aziendale
  const toEmail = 'info@pflegeteufel.de';
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
};
