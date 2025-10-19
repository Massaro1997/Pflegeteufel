/**
 * Cloudflare Worker - Shopify Backend + Pflegebox Forms
 * Handles Shopify Admin API requests and Pflegebox form submissions
 *
 * Author: Calogero Massaro
 * Generated with Claude Code
 */

// ========== CONFIGURATION ==========
const SHOPIFY_API_VERSION = '2024-01';
const SHARED_KEY = 'felix_backend_2025';

// ========== CORS HEADERS ==========
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Worker-Key',
};

// ========== MAIN WORKER ==========
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Check authentication
    const workerKey = request.headers.get('X-Worker-Key');
    if (workerKey !== SHARED_KEY && workerKey !== env.WORKER_SHARED_KEY) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    try {
      // Route handling
      const path = url.pathname;

      // ========== PFLEGEBOX ROUTES ==========
      if (path === '/api/pflegebox/submit' && request.method === 'POST') {
        return await handlePflegeboxSubmit(request, env);
      }

      if (path === '/api/pflegebox/submissions' && request.method === 'GET') {
        return await handlePflegeboxList(request, env);
      }

      if (path.match(/^\/api\/pflegebox\/pdf\/(.+)$/)) {
        const submissionId = path.split('/')[4];
        return await handlePflegeboxPDF(submissionId, env);
      }

      // ========== SHOPIFY ADMIN API PROXY ROUTES ==========
      if (path.startsWith('/orders')) {
        return await proxyShopifyRequest(request, env, 'orders.json', url.searchParams);
      }

      if (path.match(/^\/orders\/(\d+)$/)) {
        const orderId = path.split('/')[2];
        return await proxyShopifyRequest(request, env, `orders/${orderId}.json`);
      }

      if (path.startsWith('/customers')) {
        if (path.match(/^\/customers\/(\d+)\/orders$/)) {
          const customerId = path.split('/')[2];
          return await proxyShopifyRequest(request, env, `customers/${customerId}/orders.json`, url.searchParams);
        }
        if (path.match(/^\/customers\/(\d+)$/)) {
          const customerId = path.split('/')[2];
          if (request.method === 'DELETE') {
            return await proxyShopifyRequest(request, env, `customers/${customerId}.json`, null, 'DELETE');
          }
          if (request.method === 'PUT') {
            return await proxyShopifyRequest(request, env, `customers/${customerId}.json`, null, 'PUT', await request.json());
          }
          return await proxyShopifyRequest(request, env, `customers/${customerId}.json`);
        }
        if (request.method === 'POST') {
          return await proxyShopifyRequest(request, env, 'customers.json', null, 'POST', await request.json());
        }
        return await proxyShopifyRequest(request, env, 'customers.json', url.searchParams);
      }

      if (path.startsWith('/products')) {
        if (path.match(/^\/products\/(\d+)$/)) {
          const productId = path.split('/')[2];
          if (request.method === 'DELETE') {
            return await proxyShopifyRequest(request, env, `products/${productId}.json`, null, 'DELETE');
          }
          if (request.method === 'PUT') {
            return await proxyShopifyRequest(request, env, `products/${productId}.json`, null, 'PUT', await request.json());
          }
          return await proxyShopifyRequest(request, env, `products/${productId}.json`);
        }
        if (request.method === 'POST') {
          return await proxyShopifyRequest(request, env, 'products.json', null, 'POST', await request.json());
        }
        return await proxyShopifyRequest(request, env, 'products.json', url.searchParams);
      }

      if (path.match(/^\/variants\/(\d+)$/)) {
        const variantId = path.split('/')[2];
        if (request.method === 'PUT') {
          return await proxyShopifyRequest(request, env, `variants/${variantId}.json`, null, 'PUT', await request.json());
        }
      }

      // Health check
      if (path === '/health') {
        return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
      }

      return jsonResponse({ error: 'Not found' }, 404);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({ error: error.message }, 500);
    }
  }
};

// ========== PFLEGEBOX HANDLERS ==========

/**
 * Handle pflegebox form submission
 */
async function handlePflegeboxSubmit(request, env) {
  try {
    const data = await request.json();

    // Generate unique ID
    const submissionId = `pflegebox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Add metadata
    const submission = {
      id: submissionId,
      ...data,
      created_at: new Date().toISOString(),
      status: 'pending'
    };

    // Store in KV
    if (env.PFLEGEBOX_SUBMISSIONS) {
      await env.PFLEGEBOX_SUBMISSIONS.put(submissionId, JSON.stringify(submission), {
        metadata: {
          email: data.versicherte?.email || '',
          name: `${data.versicherte?.vorname || ''} ${data.versicherte?.name || ''}`.trim(),
          pflegegrad: data.versicherte?.pflegegrad || '',
          created_at: submission.created_at
        }
      });

      console.log(`✅ Pflegebox submission saved: ${submissionId}`);
    } else {
      console.warn('⚠️ PFLEGEBOX_SUBMISSIONS KV namespace not bound - data not persisted');
    }

    // Send email notification with Resend
    if (env.RESEND_API_KEY) {
      try {
        await sendEmailNotification(submission, env);
        console.log(`📧 Email notification sent for ${submissionId}`);
      } catch (emailError) {
        console.error('⚠️ Email sending failed:', emailError);
        // Don't fail the whole submission if email fails
      }
    }

    return jsonResponse({
      success: true,
      submissionId: submissionId,
      message: 'Formulario ricevuto con successo'
    });

  } catch (error) {
    console.error('Error handling pflegebox submission:', error);
    return jsonResponse({
      success: false,
      error: error.message
    }, 500);
  }
}

/**
 * Handle fetching pflegebox submissions list
 */
async function handlePflegeboxList(request, env) {
  try {
    if (!env.PFLEGEBOX_SUBMISSIONS) {
      return jsonResponse({
        submissions: [],
        total: 0,
        message: 'KV namespace not configured'
      });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search') || '';
    const pflegegrad = url.searchParams.get('pflegegrad') || '';
    const limit = parseInt(url.searchParams.get('limit') || '250');

    // List all keys with metadata
    const list = await env.PFLEGEBOX_SUBMISSIONS.list({ limit: 1000 });

    // Fetch all submissions
    const submissions = [];
    for (const key of list.keys) {
      const value = await env.PFLEGEBOX_SUBMISSIONS.get(key.name);
      if (value) {
        const submission = JSON.parse(value);
        submissions.push(submission);
      }
    }

    // Filter by search (name or email)
    let filtered = submissions;
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(s => {
        const v = s.versicherte || {};
        const name = `${v.vorname || ''} ${v.name || ''}`.toLowerCase();
        const email = (v.email || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Filter by pflegegrad
    if (pflegegrad) {
      filtered = filtered.filter(s => {
        return s.versicherte?.pflegegrad === pflegegrad;
      });
    }

    // Sort by created_at (newest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.created_at || a.timestamp || 0);
      const dateB = new Date(b.created_at || b.timestamp || 0);
      return dateB - dateA;
    });

    // Limit results
    const limited = filtered.slice(0, limit);

    console.log(`📋 Fetched ${limited.length} pflegebox submissions (total: ${submissions.length})`);

    return jsonResponse({
      submissions: limited,
      total: submissions.length,
      filtered: filtered.length
    });

  } catch (error) {
    console.error('Error fetching pflegebox submissions:', error);
    return jsonResponse({
      submissions: [],
      error: error.message
    }, 500);
  }
}

// ========== SHOPIFY PROXY HANDLER ==========

/**
 * Proxy requests to Shopify Admin API
 */
async function proxyShopifyRequest(request, env, endpoint, params = null, method = 'GET', body = null) {
  try {
    const shopDomain = env.SHOPIFY_SHOP || 'YOUR_SHOP.myshopify.com';
    const accessToken = env.SHOPIFY_ADMIN_TOKEN;

    if (!accessToken) {
      return jsonResponse({ error: 'Shopify credentials not configured' }, 500);
    }

    // Build URL
    let apiUrl = `https://${shopDomain}/admin/api/${SHOPIFY_API_VERSION}/${endpoint}`;

    if (params) {
      const queryString = new URLSearchParams(params).toString();
      if (queryString) {
        apiUrl += `?${queryString}`;
      }
    }

    console.log(`🔄 Proxying to Shopify: ${method} ${apiUrl}`);

    // Make request to Shopify
    const options = {
      method: method,
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json',
      }
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(apiUrl, options);
    const data = await response.json();

    if (!response.ok) {
      console.error('Shopify API error:', data);
      return jsonResponse({
        error: 'Shopify API error',
        details: data
      }, response.status);
    }

    return jsonResponse({
      page: data,
      success: true
    });

  } catch (error) {
    console.error('Proxy error:', error);
    return jsonResponse({
      error: error.message
    }, 500);
  }
}

// ========== UTILITY FUNCTIONS ==========

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    }
  });
}

/**
 * Send email notification via Resend
 */
async function sendEmailNotification(submission, env) {
  const v = submission.versicherte || {};
  const a = submission.angehoerige || {};
  const products = submission.pflegeboxProducts || [];

  // Build email HTML
  const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
    .section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 5px; }
    .section-title { font-weight: bold; color: #4CAF50; margin-bottom: 10px; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
    .field { margin: 8px 0; }
    .label { font-weight: bold; color: #555; }
    .value { color: #000; }
    .products { margin-top: 10px; }
    .product-item { background: #f0f0f0; padding: 8px; margin: 5px 0; border-left: 3px solid #4CAF50; }
    .footer { text-align: center; margin-top: 20px; color: #888; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>📋 Nuovo Formulario Pflegebox</h2>
      <p>Ricevuto: ${new Date(submission.created_at).toLocaleString('de-DE')}</p>
    </div>

    <div class="content">
      <!-- Versicherte Person -->
      <div class="section">
        <div class="section-title">👤 Versicherte Person</div>
        <div class="field"><span class="label">Nome:</span> <span class="value">${v.vorname || ''} ${v.name || ''}</span></div>
        <div class="field"><span class="label">Data di nascita:</span> <span class="value">${v.geburtsdatum || '-'}</span></div>
        <div class="field"><span class="label">Email:</span> <span class="value">${v.email || '-'}</span></div>
        <div class="field"><span class="label">Telefono:</span> <span class="value">${v.telefon || '-'}</span></div>
        <div class="field"><span class="label">Indirizzo:</span> <span class="value">${v.strasse || ''} ${v.hausnummer || ''}, ${v.plz || ''} ${v.ort || ''}</span></div>
        <div class="field"><span class="label">Pflegegrad:</span> <span class="value">${v.pflegegrad || '-'}</span></div>
        <div class="field"><span class="label">Pflegekasse:</span> <span class="value">${v.pflegekasse || '-'}</span></div>
        <div class="field"><span class="label">Versichertennummer:</span> <span class="value">${v.versichertennummer || '-'}</span></div>
      </div>

      <!-- Angehörige -->
      ${a.vorname || a.name ? `
      <div class="section">
        <div class="section-title">👥 Angehörige/Bevollmächtigte</div>
        <div class="field"><span class="label">Nome:</span> <span class="value">${a.vorname || ''} ${a.name || ''}</span></div>
        <div class="field"><span class="label">Email:</span> <span class="value">${a.email || '-'}</span></div>
        <div class="field"><span class="label">Telefono:</span> <span class="value">${a.telefon || '-'}</span></div>
        <div class="field"><span class="label">Indirizzo:</span> <span class="value">${a.strasse || ''} ${a.hausnummer || ''}, ${a.plz || ''} ${a.ort || ''}</span></div>
      </div>
      ` : ''}

      <!-- Pflegebox Products -->
      ${products.length > 0 ? `
      <div class="section">
        <div class="section-title">📦 Prodotti Pflegebox Scelti</div>
        <div class="products">
          ${products.map(p => `<div class="product-item">✓ ${p}</div>`).join('')}
        </div>
      </div>
      ` : ''}

      <!-- Info Aggiuntive -->
      <div class="section">
        <div class="section-title">ℹ️ Informazioni Aggiuntive</div>
        <div class="field"><span class="label">Submission ID:</span> <span class="value">${submission.id}</span></div>
        <div class="field"><span class="label">Status:</span> <span class="value">${submission.status}</span></div>
      </div>
    </div>

    <div class="footer">
      <p>Questo è un messaggio automatico da Pflegeteufel.de</p>
      <p>🤖 Generated with Claude Code</p>
    </div>
  </div>
</body>
</html>
  `;

  // Send via Resend API
  const resendResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Pflegebox Formular <formular@pflegeteufel.de>',
      to: ['pflegeteufelagentur@gmail.com'],
      subject: `📋 Nuovo Formulario Pflegebox - ${v.vorname || ''} ${v.name || ''} (Pflegegrad ${v.pflegegrad || '-'})`,
      html: emailHTML,
    }),
  });

  if (!resendResponse.ok) {
    const errorData = await resendResponse.text();
    throw new Error(`Resend API error: ${errorData}`);
  }

  return await resendResponse.json();
}

/**
 * Generate PDF for a pflegebox submission
 */
async function handlePflegeboxPDF(submissionId, env) {
  try {
    if (!env.PFLEGEBOX_SUBMISSIONS) {
      return jsonResponse({ error: 'KV namespace not configured' }, 500);
    }

    // Get submission data
    const submissionData = await env.PFLEGEBOX_SUBMISSIONS.get(submissionId);
    if (!submissionData) {
      return jsonResponse({ error: 'Submission not found' }, 404);
    }

    const submission = JSON.parse(submissionData);
    const v = submission.versicherte || {};
    const a = submission.angehoerige || {};
    const products = submission.pflegeboxProducts || [];

    // Generate simple HTML for PDF (can be converted to PDF with browser rendering)
    const pdfHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Pflegebox Formular - ${v.vorname} ${v.name}</title>
  <style>
    @page { size: A4; margin: 2cm; }
    body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; }
    .header { text-align: center; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { color: #4CAF50; margin: 0; }
    .section { margin-bottom: 20px; page-break-inside: avoid; }
    .section-title { background: #4CAF50; color: white; padding: 8px; font-weight: bold; margin-bottom: 10px; }
    .field { margin: 5px 0; }
    .label { font-weight: bold; display: inline-block; width: 180px; }
    .value { display: inline-block; }
    .products { margin-top: 10px; }
    .product-item { padding: 5px; margin: 3px 0; background: #f0f0f0; }
    .footer { text-align: center; margin-top: 30px; font-size: 10pt; color: #888; border-top: 1px solid #ddd; padding-top: 10px; }
    .signature { margin-top: 20px; }
    .signature img { max-width: 200px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📋 Pflegebox Formulario</h1>
    <p>Pflegeteufel.de</p>
    <p><small>Erstellt: ${new Date(submission.created_at).toLocaleString('de-DE')}</small></p>
  </div>

  <div class="section">
    <div class="section-title">VERSICHERTE PERSON</div>
    <div class="field"><span class="label">Name:</span> <span class="value">${v.vorname || ''} ${v.name || ''}</span></div>
    <div class="field"><span class="label">Geburtsdatum:</span> <span class="value">${v.geburtsdatum || '-'}</span></div>
    <div class="field"><span class="label">E-Mail:</span> <span class="value">${v.email || '-'}</span></div>
    <div class="field"><span class="label">Telefon:</span> <span class="value">${v.telefon || '-'}</span></div>
    <div class="field"><span class="label">Straße / Hausnummer:</span> <span class="value">${v.strasse || ''} ${v.hausnummer || ''}</span></div>
    <div class="field"><span class="label">PLZ / Ort:</span> <span class="value">${v.plz || ''} ${v.ort || ''}</span></div>
    <div class="field"><span class="label">Pflegegrad:</span> <span class="value">${v.pflegegrad || '-'}</span></div>
    <div class="field"><span class="label">Pflegekasse:</span> <span class="value">${v.pflegekasse || '-'}</span></div>
    <div class="field"><span class="label">Versichertennummer:</span> <span class="value">${v.versichertennummer || '-'}</span></div>
  </div>

  ${a.vorname || a.name ? `
  <div class="section">
    <div class="section-title">ANGEHÖRIGE / BEVOLLMÄCHTIGTE</div>
    <div class="field"><span class="label">Name:</span> <span class="value">${a.vorname || ''} ${a.name || ''}</span></div>
    <div class="field"><span class="label">E-Mail:</span> <span class="value">${a.email || '-'}</span></div>
    <div class="field"><span class="label">Telefon:</span> <span class="value">${a.telefon || '-'}</span></div>
    <div class="field"><span class="label">Straße / Hausnummer:</span> <span class="value">${a.strasse || ''} ${a.hausnummer || ''}</span></div>
    <div class="field"><span class="label">PLZ / Ort:</span> <span class="value">${a.plz || ''} ${a.ort || ''}</span></div>
  </div>
  ` : ''}

  ${products.length > 0 ? `
  <div class="section">
    <div class="section-title">GEWÄHLTE PFLEGEBOX PRODUKTE</div>
    <div class="products">
      ${products.map(p => `<div class="product-item">✓ ${p}</div>`).join('')}
    </div>
  </div>
  ` : ''}

  ${submission.versicherteSignature || submission.angehoerigeSignature ? `
  <div class="section">
    <div class="section-title">UNTERSCHRIFTEN</div>
    ${submission.versicherteSignature ? `
    <div class="signature">
      <p><strong>Versicherte Person:</strong></p>
      <img src="${submission.versicherteSignature}" alt="Unterschrift Versicherte">
    </div>
    ` : ''}
    ${submission.angehoerigeSignature ? `
    <div class="signature">
      <p><strong>Angehörige/Bevollmächtigte:</strong></p>
      <img src="${submission.angehoerigeSignature}" alt="Unterschrift Angehörige">
    </div>
    ` : ''}
  </div>
  ` : ''}

  <div class="footer">
    <p>Submission ID: ${submission.id}</p>
    <p>Status: ${submission.status}</p>
    <p>Pflegeteufel.de - 🤖 Generated with Claude Code</p>
  </div>
</body>
</html>
    `;

    // Return HTML (can be printed as PDF from browser)
    return new Response(pdfHTML, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="pflegebox_${submissionId}.html"`,
        ...corsHeaders
      }
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return jsonResponse({ error: error.message }, 500);
  }
}
