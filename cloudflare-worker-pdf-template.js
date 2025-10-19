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

      console.log(` Pflegebox submission saved: ${submissionId}`);
    } else {
      console.warn('  PFLEGEBOX_SUBMISSIONS KV namespace not bound - data not persisted');
    }

    // TODO: Send email notification with Resend/SendGrid
    // if (env.RESEND_API_KEY) {
    //   await sendEmailNotification(data, env);
    // }

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

    console.log(`=Ë Fetched ${limited.length} pflegebox submissions (total: ${submissions.length})`);

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

    console.log(`= Proxying to Shopify: ${method} ${apiUrl}`);

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
 * Send email notification (TODO: implement with Resend or SendGrid)
 */
async function sendEmailNotification(data, env) {
  // Placeholder for email functionality
  // Use env.RESEND_API_KEY or env.SENDGRID_API_KEY
  console.log('=ç Email notification not yet implemented');
}
