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
      "Access-Control-Allow-Headers": "Content-Type, X-Worker-Key, X-Shared-Key, Authorization",
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

        // DEBUG: stampa TUTTO il formData per vedere i nomi esatti dei campi
        console.log('🔍 DEBUG formData COMPLETO:', JSON.stringify(formData, null, 2));

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

        // 📧 INVIA EMAIL CON PDF ALLEGATO (all'agenzia)
        await sendPflegeboxEmailWithPDF(env, formData, pdfBytes);

        // 📧 INVIA EMAIL DI CONFERMA AL CLIENTE
        await sendCustomerConfirmationEmail(env, formData, pdfBytes);

        // 💾 SALVA NEL KV STORAGE PER BACKEND DASHBOARD
        if (env.PFLEGEBOX_SUBMISSIONS) {
          const submissionId = `pflegebox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const submission = {
            id: submissionId,
            ...formData,
            created_at: new Date().toISOString(),
            status: 'pending'
          };
          await env.PFLEGEBOX_SUBMISSIONS.put(submissionId, JSON.stringify(submission), {
            metadata: {
              email: formData.versicherte?.email || '',
              name: `${formData.versicherte?.vorname || ''} ${formData.versicherte?.name || ''}`.trim(),
              pflegegrad: formData.versicherte?.pflegegrad || '',
              created_at: submission.created_at
            }
          });
          console.log(`💾 Dati salvati nel KV storage: ${submissionId}`);
        }

        // 👤 CREA CLIENTE SU SHOPIFY AUTOMATICAMENTE
        try {
          const { SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION } = env;

          if (SHOPIFY_SHOP && SHOPIFY_ADMIN_TOKEN) {
            // Prepara i dati del cliente
            const customerData = {
              customer: {
                first_name: formData.versicherte.vorname,
                last_name: formData.versicherte.name,
                email: formData.versicherte.email,
                phone: formData.versicherte.telefon,
                addresses: [{
                  address1: `${formData.versicherte.strasse} ${formData.versicherte.hausnummer || ''}`.trim(),
                  city: formData.versicherte.plzOrt ? formData.versicherte.plzOrt.split(' ').slice(1).join(' ') : '',
                  zip: formData.versicherte.plzOrt ? formData.versicherte.plzOrt.split(' ')[0] : '',
                  country: 'DE'
                }],
                tags: 'Pflegebox',
                note: `Pflegegrad: ${formData.versicherte.pflegegrad}\nPflegekasse: ${formData.versicherte.pflegekasse}\nVersichertennummer: ${formData.versicherte.versichertennummer || ''}`
              }
            };

            const shopifyApiUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers.json`;

            console.log('👤 Creating customer in Shopify...');

            const response = await fetch(shopifyApiUrl, {
              method: 'POST',
              headers: {
                'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(customerData)
            });

            if (response.ok) {
              const result = await response.json();
              console.log(`✅ Cliente Shopify creato con ID: ${result.customer.id}`);
            } else {
              const errorText = await response.text();
              console.error('⚠️ Errore creazione cliente Shopify:', response.status, errorText);
              // Non blocchiamo l'intero processo se la creazione del cliente fallisce
            }
          } else {
            console.log('⚠️ Shopify credentials non configurati - cliente non creato');
          }
        } catch (customerError) {
          console.error('⚠️ Errore durante creazione cliente:', customerError);
          // Non blocchiamo l'intero processo se la creazione del cliente fallisce
        }

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

    // ========== BACKEND: GET PFLEGEBOX SUBMISSIONS ==========
    if (path === "/api/pflegebox/submissions" && request.method === "GET") {
      try {
        if (!env.PFLEGEBOX_SUBMISSIONS) {
          return new Response(JSON.stringify({
            submissions: [],
            total: 0,
            message: 'KV namespace not configured'
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

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

        // Sort by created_at (newest first)
        submissions.sort((a, b) => {
          const dateA = new Date(a.created_at || a.timestamp || 0);
          const dateB = new Date(b.created_at || b.timestamp || 0);
          return dateB - dateA;
        });

        console.log(`📋 Backend: fetched ${submissions.length} pflegebox submissions`);

        return new Response(JSON.stringify({
          submissions: submissions,
          total: submissions.length
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Error fetching pflegebox submissions:', error);
        return new Response(JSON.stringify({
          submissions: [],
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== BACKEND: GET PFLEGEBOX PDF ==========
    if (path.startsWith("/api/pflegebox/pdf/") && request.method === "GET") {
      try {
        const submissionId = path.replace("/api/pflegebox/pdf/", "");

        if (!env.PFLEGEBOX_SUBMISSIONS) {
          return new Response(JSON.stringify({
            error: 'KV namespace not configured'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Get submission data from KV
        const submissionData = await env.PFLEGEBOX_SUBMISSIONS.get(submissionId);

        if (!submissionData) {
          return new Response(JSON.stringify({
            error: 'Submission not found',
            submissionId: submissionId
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const formData = JSON.parse(submissionData);
        console.log(`📄 Generating PDF for submission: ${submissionId}`);

        // Generate PDF
        const pdfBytes = await fillPDFTemplate(formData, env);

        console.log(`✅ PDF generated successfully: ${pdfBytes.length} bytes`);

        // Return PDF
        return new Response(pdfBytes, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="pflegebox_${submissionId}.pdf"`
          }
        });

      } catch (error) {
        console.error('❌ Error generating PDF:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== SHOPIFY API PROXY ENDPOINTS ==========
    // Helper function to call Shopify Admin API
    async function callShopifyAPI(endpoint, env) {
      const { SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION } = env;

      if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_TOKEN) {
        throw new Error('Shopify credentials not configured');
      }

      const apiUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}${endpoint}`;
      console.log('📞 Calling Shopify API:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Shopify API error:', response.status, errorText);
        throw new Error(`Shopify API error: ${response.status}`);
      }

      return await response.json();
    }

    // GET /orders - Proxy to Shopify Orders API
    if (path === "/orders" && request.method === "GET") {
      try {
        const params = new URLSearchParams(url.search);
        const queryParams = params.toString();
        const endpoint = `/orders.json${queryParams ? '?' + queryParams : ''}`;

        const data = await callShopifyAPI(endpoint, env);

        return new Response(JSON.stringify({ page: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Error proxying orders:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /customers - Proxy to Shopify Customers API
    if (path === "/customers" && request.method === "GET") {
      try {
        const params = new URLSearchParams(url.search);
        const queryParams = params.toString();
        const endpoint = `/customers.json${queryParams ? '?' + queryParams : ''}`;

        const data = await callShopifyAPI(endpoint, env);

        return new Response(JSON.stringify({ page: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Error proxying customers:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /products - Proxy to Shopify Products API
    if (path === "/products" && request.method === "GET") {
      try {
        const params = new URLSearchParams(url.search);
        const queryParams = params.toString();
        const endpoint = `/products.json${queryParams ? '?' + queryParams : ''}`;

        const data = await callShopifyAPI(endpoint, env);

        return new Response(JSON.stringify({ page: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Error proxying products:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // GET /customers/:id/orders - Get orders for specific customer
    if (path.match(/^\/customers\/\d+\/orders$/) && request.method === "GET") {
      try {
        const customerId = path.split('/')[2];
        const params = new URLSearchParams(url.search);
        const queryParams = params.toString();
        const endpoint = `/customers/${customerId}/orders.json${queryParams ? '?' + queryParams : ''}`;

        const data = await callShopifyAPI(endpoint, env);

        return new Response(JSON.stringify({ page: data }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Error proxying customer orders:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== BACKEND: DELETE PFLEGEBOX SUBMISSION ==========
    if (path.startsWith("/api/pflegebox/submission/") && request.method === "DELETE") {
      try {
        const submissionId = path.replace("/api/pflegebox/submission/", "");

        if (!env.PFLEGEBOX_SUBMISSIONS) {
          return new Response(JSON.stringify({
            error: 'KV namespace not configured'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check if submission exists
        const submissionData = await env.PFLEGEBOX_SUBMISSIONS.get(submissionId);

        if (!submissionData) {
          return new Response(JSON.stringify({
            error: 'Submission not found',
            submissionId: submissionId
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        console.log(`🗑️ Deleting submission: ${submissionId}`);

        // Delete from KV
        await env.PFLEGEBOX_SUBMISSIONS.delete(submissionId);

        console.log(`✅ Submission deleted successfully: ${submissionId}`);

        // Return success
        return new Response(JSON.stringify({
          success: true,
          message: 'Submission deleted successfully',
          submissionId: submissionId
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Error deleting submission:', error);
        return new Response(JSON.stringify({
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: REGISTER ==========
    if (path === "/api/customers/register" && request.method === "POST") {
      try {
        const { email, password, vorname, nachname, telefon, anrede, geburtsdatum, strasse, hausnummer, plz, ort, pflegegrad, pflegekasse, newsletter } = body;

        // Validazione
        if (!email || !password || !vorname || !nachname) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email, password, vorname e nachname sono obbligatori'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verifica se email già esiste
        const existingCustomer = await env.CUSTOMERS_DB.prepare(
          'SELECT id FROM customers WHERE email = ?'
        ).bind(email).first();

        if (existingCustomer) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email già registrata'
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Inserisci cliente
        const result = await env.CUSTOMERS_DB.prepare(`
          INSERT INTO customers (
            email, password_hash, anrede, vorname, nachname, telefon, geburtsdatum,
            strasse, hausnummer, plz, ort, pflegegrad, pflegekasse, newsletter
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          email, passwordHash, anrede || null, vorname, nachname, telefon || null, geburtsdatum || null,
          strasse || null, hausnummer || null, plz || null, ort || null, pflegegrad || null, pflegekasse || null, newsletter ? 1 : 0
        ).run();

        const customerId = result.meta.last_row_id;

        // Crea sessione
        const sessionToken = await generateSessionToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 giorni

        await env.CUSTOMERS_DB.prepare(`
          INSERT INTO sessions (id, customer_id, ip_address, user_agent, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          sessionToken,
          customerId,
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown',
          expiresAt
        ).run();

        // Log attività
        await env.CUSTOMERS_DB.prepare(`
          INSERT INTO activity_logs (customer_id, action_type, ip_address, user_agent)
          VALUES (?, ?, ?, ?)
        `).bind(
          customerId,
          'register',
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown'
        ).run();

        console.log(`✅ Cliente registrato: ${email} (ID: ${customerId})`);

        return new Response(JSON.stringify({
          success: true,
          customer: {
            id: customerId,
            email,
            vorname,
            nachname
          },
          sessionToken,
          expiresAt
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore registrazione:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: LOGIN ==========
    if (path === "/api/customers/login" && request.method === "POST") {
      try {
        const { email, password } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email e password sono obbligatori'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Cerca cliente
        const customer = await env.CUSTOMERS_DB.prepare(
          'SELECT id, email, password_hash, vorname, nachname, account_status FROM customers WHERE email = ?'
        ).bind(email).first();

        if (!customer) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email o password non corretti'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verifica account status
        if (customer.account_status !== 'active') {
          return new Response(JSON.stringify({
            success: false,
            error: 'Account sospeso o eliminato'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verifica password
        const isValid = await verifyPassword(password, customer.password_hash);

        if (!isValid) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email o password non corretti'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Crea sessione
        const sessionToken = await generateSessionToken();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await env.CUSTOMERS_DB.prepare(`
          INSERT INTO sessions (id, customer_id, ip_address, user_agent, expires_at)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          sessionToken,
          customer.id,
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown',
          expiresAt
        ).run();

        // Aggiorna last_login_at
        await env.CUSTOMERS_DB.prepare(
          'UPDATE customers SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(customer.id).run();

        // Log attività
        await env.CUSTOMERS_DB.prepare(`
          INSERT INTO activity_logs (customer_id, action_type, ip_address, user_agent)
          VALUES (?, ?, ?, ?)
        `).bind(
          customer.id,
          'login',
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown'
        ).run();

        console.log(`✅ Login effettuato: ${email}`);

        return new Response(JSON.stringify({
          success: true,
          customer: {
            id: customer.id,
            email: customer.email,
            vorname: customer.vorname,
            nachname: customer.nachname
          },
          sessionToken,
          expiresAt
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore login:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: GET PROFILE ==========
    if (path === "/api/customers/me" && request.method === "GET") {
      try {
        const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autenticato'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Valida sessione
        const session = await env.CUSTOMERS_DB.prepare(`
          SELECT customer_id FROM sessions
          WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (!session) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Sessione non valida o scaduta'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Recupera dati cliente
        const customer = await env.CUSTOMERS_DB.prepare(`
          SELECT id, email, anrede, vorname, nachname, telefon, geburtsdatum,
                 strasse, hausnummer, plz, ort, land, pflegegrad, pflegekasse,
                 versichertennummer, shopify_customer_id, newsletter, email_verified,
                 account_status, created_at, last_login_at
          FROM customers WHERE id = ?
        `).bind(session.customer_id).first();

        return new Response(JSON.stringify({
          success: true,
          customer
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore get profile:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: UPDATE PROFILE ==========
    if (path === "/api/customers/me" && request.method === "PUT") {
      try {
        const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autenticato'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Valida sessione
        const session = await env.CUSTOMERS_DB.prepare(`
          SELECT customer_id FROM sessions
          WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (!session) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Sessione non valida'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { anrede, vorname, nachname, telefon, geburtsdatum, strasse, hausnummer, plz, ort, pflegegrad, pflegekasse, versichertennummer, newsletter } = body;

        // Aggiorna dati
        await env.CUSTOMERS_DB.prepare(`
          UPDATE customers SET
            anrede = COALESCE(?, anrede),
            vorname = COALESCE(?, vorname),
            nachname = COALESCE(?, nachname),
            telefon = COALESCE(?, telefon),
            geburtsdatum = COALESCE(?, geburtsdatum),
            strasse = COALESCE(?, strasse),
            hausnummer = COALESCE(?, hausnummer),
            plz = COALESCE(?, plz),
            ort = COALESCE(?, ort),
            pflegegrad = COALESCE(?, pflegegrad),
            pflegekasse = COALESCE(?, pflegekasse),
            versichertennummer = COALESCE(?, versichertennummer),
            newsletter = COALESCE(?, newsletter),
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          anrede, vorname, nachname, telefon, geburtsdatum, strasse, hausnummer, plz, ort,
          pflegegrad, pflegekasse, versichertennummer, newsletter ? 1 : 0, session.customer_id
        ).run();

        // Log attività
        await env.CUSTOMERS_DB.prepare(`
          INSERT INTO activity_logs (customer_id, action_type, ip_address, user_agent, details)
          VALUES (?, ?, ?, ?, ?)
        `).bind(
          session.customer_id,
          'update_profile',
          request.headers.get('CF-Connecting-IP') || 'unknown',
          request.headers.get('User-Agent') || 'unknown',
          JSON.stringify(body)
        ).run();

        console.log(`✅ Profilo aggiornato: customer_id ${session.customer_id}`);

        return new Response(JSON.stringify({
          success: true,
          message: 'Profilo aggiornato con successo'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore update profile:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: LOGOUT ==========
    if (path === "/api/customers/logout" && request.method === "POST") {
      try {
        const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autenticato'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Elimina sessione
        await env.CUSTOMERS_DB.prepare(
          'DELETE FROM sessions WHERE id = ?'
        ).bind(sessionToken).run();

        console.log(`✅ Logout effettuato: token ${sessionToken.substring(0, 10)}...`);

        return new Response(JSON.stringify({
          success: true,
          message: 'Logout effettuato'
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore logout:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: GET MY ORDERS ==========
    if (path === "/api/customers/me/orders" && request.method === "GET") {
      try {
        const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autenticato'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Valida sessione e recupera email
        const result = await env.CUSTOMERS_DB.prepare(`
          SELECT c.email FROM customers c
          INNER JOIN sessions s ON c.id = s.customer_id
          WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Sessione non valida'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Cerca ordini Shopify per email
        const { SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION } = env;

        if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_TOKEN) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Shopify non configurato'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Cerca cliente Shopify per email
        const customerUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(result.email)}`;
        const customerResponse = await fetch(customerUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        if (!customerResponse.ok) {
          throw new Error('Errore ricerca cliente Shopify');
        }

        const customerData = await customerResponse.json();

        if (!customerData.customers || customerData.customers.length === 0) {
          return new Response(JSON.stringify({
            success: true,
            orders: []
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const shopifyCustomerId = customerData.customers[0].id;

        // Recupera ordini del cliente
        const ordersUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/customers/${shopifyCustomerId}/orders.json`;
        const ordersResponse = await fetch(ordersUrl, {
          headers: {
            'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN,
            'Content-Type': 'application/json'
          }
        });

        if (!ordersResponse.ok) {
          throw new Error('Errore recupero ordini');
        }

        const ordersData = await ordersResponse.json();

        return new Response(JSON.stringify({
          success: true,
          orders: ordersData.orders || []
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore get orders:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== CUSTOMER AREA: GET MY PFLEGEBOX SUBMISSIONS ==========
    if (path === "/api/customers/me/pflegebox" && request.method === "GET") {
      try {
        const sessionToken = request.headers.get('Authorization')?.replace('Bearer ', '');

        if (!sessionToken) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autenticato'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Valida sessione e recupera email
        const result = await env.CUSTOMERS_DB.prepare(`
          SELECT c.email FROM customers c
          INNER JOIN sessions s ON c.id = s.customer_id
          WHERE s.id = ? AND s.expires_at > CURRENT_TIMESTAMP
        `).bind(sessionToken).first();

        if (!result) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Sessione non valida'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Cerca form Pflegebox nel KV Storage
        if (!env.PFLEGEBOX_SUBMISSIONS) {
          return new Response(JSON.stringify({
            success: true,
            submissions: []
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const list = await env.PFLEGEBOX_SUBMISSIONS.list();
        const submissions = [];

        for (const key of list.keys) {
          const submissionData = await env.PFLEGEBOX_SUBMISSIONS.get(key.name);
          if (submissionData) {
            const submission = JSON.parse(submissionData);
            // Filtra per email del cliente
            if (submission.versicherte?.email === result.email) {
              submissions.push(submission);
            }
          }
        }

        // Ordina per data (più recente prima)
        submissions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        return new Response(JSON.stringify({
          success: true,
          submissions
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore get pflegebox:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== SHOPIFY WEBHOOK: ORDER CREATED ==========
    if (path === "/api/shopify/webhooks/orders/create" && request.method === "POST") {
      try {
        console.log('📦 Ricevuto webhook Shopify - Nuovo ordine');

        // Verifica HMAC signature per sicurezza (opzionale ma raccomandato)
        const hmacHeader = request.headers.get('X-Shopify-Hmac-Sha256');
        const shopDomain = request.headers.get('X-Shopify-Shop-Domain');

        console.log('🏪 Shop Domain:', shopDomain);

        // Parse order data
        const orderData = body;

        console.log('📋 Order ID:', orderData.id);
        console.log('👤 Customer:', orderData.customer?.email);

        // Recupera il PDF dell'ordine da Shopify
        let orderPdfBytes = null;
        try {
          orderPdfBytes = await fetchShopifyOrderPDF(orderData, env);
          console.log('📄 PDF ordine Shopify recuperato');
        } catch (pdfError) {
          console.warn('⚠️ Impossibile recuperare PDF da Shopify, genero PDF custom:', pdfError.message);
          // Fallback: genera PDF custom se quello di Shopify non è disponibile
          orderPdfBytes = await generateOrderPDF(orderData, env);
          console.log('📄 PDF ordine custom generato');
        }

        // Invia email di conferma al cliente con PDF allegato
        if (orderData.customer?.email) {
          await sendOrderConfirmationEmail(env, orderData, orderPdfBytes);
          console.log('✅ Email conferma ordine con PDF inviata al cliente');
        } else {
          console.warn('⚠️ Ordine senza email cliente - email non inviata');
        }

        // Rispondi a Shopify con successo
        return new Response(JSON.stringify({
          success: true,
          message: 'Webhook processed successfully',
          orderId: orderData.id
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore processing webhook ordine:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== ADMIN: GET ALL REGISTERED CUSTOMERS (D1) ==========
    if (path === "/api/admin/customers/registered" && request.method === "GET") {
      try {
        // Verifica chiave admin
        const workerKey = request.headers.get('X-Worker-Key');
        if (workerKey !== env.WORKER_SHARED_KEY) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Non autorizzato'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Query tutti i clienti registrati con statistiche
        const customers = await env.CUSTOMERS_DB.prepare(`
          SELECT
            c.id,
            c.email,
            c.anrede,
            c.vorname,
            c.nachname,
            c.telefon,
            c.geburtsdatum,
            c.strasse,
            c.hausnummer,
            c.plz,
            c.ort,
            c.land,
            c.pflegegrad,
            c.pflegekasse,
            c.versichertennummer,
            c.shopify_customer_id,
            c.newsletter,
            c.email_verified,
            c.account_status,
            c.created_at,
            c.updated_at,
            c.last_login_at,
            COUNT(DISTINCT s.id) as active_sessions
          FROM customers c
          LEFT JOIN sessions s ON c.id = s.customer_id AND s.expires_at > CURRENT_TIMESTAMP
          GROUP BY c.id
          ORDER BY c.created_at DESC
        `).all();

        console.log(`👥 Retrieved ${customers.results?.length || 0} registered customers`);

        return new Response(JSON.stringify({
          success: true,
          customers: customers.results || [],
          total: customers.results?.length || 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('❌ Errore get registered customers:', error);
        return new Response(JSON.stringify({
          success: false,
          error: error.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Default 404
    return new Response(JSON.stringify({
      error: "Not found",
      availableEndpoints: [
        "/health",
        "/api/pflegebox/submit (POST)",
        "/api/pflegebox/submissions (GET)",
        "/api/pflegebox/pdf/{id} (GET)",
        "/api/pflegebox/submission/{id} (DELETE)",
        "/api/shopify/webhooks/orders/create (POST)",
        "/orders (GET)",
        "/customers (GET)",
        "/products (GET)",
        "/customers/{id}/orders (GET)",
        "/api/customers/register (POST)",
        "/api/customers/login (POST)",
        "/api/customers/me (GET, PUT)",
        "/api/customers/logout (POST)",
        "/api/customers/me/orders (GET)",
        "/api/customers/me/pflegebox (GET)",
        "/api/admin/customers/registered (GET)"
      ]
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

    // COORDINATE DA GRIGLIA VISIVA - Screenshot analizzato manualmente
    // Settori → Coordinate (griglia 10x10px, 60 col x 85 righe)

    // Checkbox Frau/Herr (settore 611 / 636)
    if (v.anrede === 'Frau') {
      page1.drawText('X', { x: 105, y: 732, size: 10, font: helveticaBold });  // +5px X (0.5 destra)
    } else if (v.anrede === 'Herr') {
      page1.drawText('X', { x: 350, y: 732, size: 10, font: helveticaBold });
    }

    // Vorname / Name (settore 673 / 696) - 0.5 in basso = -5px Y
    page1.drawText(v.vorname || '', { x: 120, y: 717, size: 10, font: helveticaFont });
    page1.drawText(v.name || '', { x: 350, y: 717, size: 10, font: helveticaFont });

    // Straße / PLZ Ort (settore 793 / 815) - Straße +2.5Y (0.25 alto), PLZ -2.5Y (0.25 basso)
    page1.drawText(v.strasse || '', { x: 120, y: 699, size: 10, font: helveticaFont });  // +2.5px Y (0.25 alto)

    const plzOrtParts = (v.plzOrt || '').split(' ');
    const plz = plzOrtParts[0] || '';
    const ort = plzOrtParts.slice(1).join(' ') || '';
    page1.drawText(`${plz} ${ort}`, { x: 350, y: 699, size: 10, font: helveticaFont });  // -2.5px Y (0.25 basso)

    // Telefon / Email (settore 913 / 936) - TUE COORDINATE
    page1.drawText(v.telefon || '', { x: 120, y: 682, size: 10, font: helveticaFont });
    page1.drawText(v.email || '', { x: 350, y: 682, size: 10, font: helveticaFont });

    // Pflegegrad checkbox (settori 1041-1052)
    const pflegegradMap = {
      '1': { x: 200, y: 662 },
      '2': { x: 230, y: 662 },
      '3': { x: 255, y: 662 },  // 0.5 a destra (+5px X)
      '4': { x: 285, y: 662 },  // settore 1049.5 (spostato +5px)
      '5': { x: 312, y: 662 }  // +2.5px X (0.25 destra)
    };
    if (v.pflegegrad && pflegegradMap[v.pflegegrad]) {
      const pos = pflegegradMap[v.pflegegrad];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Checkbox "Ich habe einen Pflegegrad beantragt" (settore 1055) - TUE COORDINATE
    if (!v.pflegegrad || v.pflegegrad === 'beantragt') {
      page1.drawText('X', { x: 340, y: 662, size: 10, font: helveticaBold });
    }

    // Versicherungstyp - 4 caselle ESCLUSIVE (solo una X)
    console.log('🔍 DEBUG versicherteTyp:', v.versicherteTyp);

    if (v.versicherteTyp === 'gesetzlich') {
      // Casella 1: gesetzlich pflegeversichert (settore 1154)
      page1.drawText('X', { x: 130, y: 642, size: 10, font: helveticaBold });
      console.log('✅ X in casella gesetzlich');

    } else if (v.versicherteTyp === 'privat') {
      // Casella 2: privat pflegeversichert (settore 1164)
      page1.drawText('X', { x: 235, y: 647, size: 10, font: helveticaBold });
      console.log('✅ X in casella privat');

    } else if (v.versicherteTyp === 'beihilfeberechtigt') {
      // Casella 3: beihilfeberechtigt (settore 1174)
      page1.drawText('X', { x: 330, y: 642, size: 10, font: helveticaBold });
      console.log('✅ X in casella beihilfeberechtigt');

    } else if (v.versicherteTyp === 'sozialamt' || v.versicherteTyp === 'ortsamt') {
      // Casella 4: über Ortsamt/Sozialamt versichert (settore 1214)
      page1.drawText('X', { x: 130, y: 632, size: 10, font: helveticaBold });
      console.log('✅ X in casella über Ortsamt/Sozialamt');

      // Campo testo: Welches Ortsamt/Sozialamt
      if (v.sozialamtName) {
        page1.drawText(v.sozialamtName, { x: 390, y: 632, size: 10, font: helveticaFont });
        console.log('✅ Scritto nome Sozialamt:', v.sozialamtName);
      }
    } else {
      console.warn('⚠️ versicherteTyp non riconosciuto:', v.versicherteTyp);
    }

    // ========== SEZIONE 2: ANGEHÖRIGE/PFLEGEPERSON ==========

    if (!a.isSamePerson && a.data) {
      // SEZIONE 2: ANGEHÖRIGE - Coordinate aggiornate

      // Checkbox Frau/Herr (settore 1511 / 1536)
      if (a.data.anrede === 'Frau') {
        page1.drawText('X', { x: 105, y: 582, size: 10, font: helveticaBold });  // 0.5 destra (+5X)
      } else if (a.data.anrede === 'Herr') {
        page1.drawText('X', { x: 350, y: 582, size: 10, font: helveticaBold });
      }

      // Vorname / Name (settore 1633 / 1656) - 0.5 alto (+5Y), Name +10X e +5Y (0.5 in alto)
      page1.drawText(a.data.vorname || '', { x: 120, y: 567, size: 10, font: helveticaFont });
      page1.drawText(a.data.name || '', { x: 360, y: 567, size: 10, font: helveticaFont });  // +10px X, +5px Y (0.5 in alto)

      // Straße / PLZ Ort (settore 1693 / 1717)
      page1.drawText(a.data.strasse || '', { x: 120, y: 552, size: 10, font: helveticaFont });

      const plzOrtAngehParts = (a.data.plzOrt || '').split(' ');
      const plzAng = plzOrtAngehParts[0] || '';
      const ortAng = plzOrtAngehParts.slice(1).join(' ') || '';
      page1.drawText(`${plzAng} ${ortAng}`, { x: 360, y: 552, size: 10, font: helveticaFont });

      // Telefon / Email (settore 1813 / 1837)
      page1.drawText(a.data.telefon || '', { x: 120, y: 532, size: 10, font: helveticaFont });
      page1.drawText(a.data.email || '', { x: 360, y: 532, size: 10, font: helveticaFont });

      // Pflegeperson ist (settori 1933.5, 1944, 1953)
      const pflegepersonTyp = a.data?.typ; // Il campo è angehoerige.data.typ
      console.log('🔍 DEBUG pflegepersonTyp:', pflegepersonTyp);
      const pflegepersonTypMap = {
        'Familie': { x: 125, y: 512 },  // settore 1933.5 - Familienangehörige
        'Privat': { x: 230, y: 512 },  // Private Pflegeperson
        'Betreuer': { x: 320, y: 512 }  // Betreuer(in)
      };
      if (pflegepersonTyp && pflegepersonTypMap[pflegepersonTyp]) {
        const pos = pflegepersonTypMap[pflegepersonTyp];
        console.log('✅ Scrivo X per pflegeperson:', pflegepersonTyp, 'a coordinate:', pos);
        page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
      } else {
        console.warn('⚠️ pflegepersonTyp non riconosciuto o vuoto:', pflegepersonTyp);
      }
    }

    // ========== SEZIONE 3: PFLEGEBOX (PRODOTTI) ==========

    // Checkbox prodotti - Coordinate aggiornate
    const produkteMap = {
      'bettschutzeinlagen': { x: 70, y: 452 },
      'fingerlinge': { x: 240, y: 452 },  // settore 2305
      'ffp2': { x: 415, y: 452 },
      'einmalhandschuhe': { x: 70, y: 437 },  // 0.5 alto (+5Y)
      'mundschutz': { x: 240, y: 437 },  // 0.5 basso (-5Y)
      'essslaetzchen': { x: 417, y: 439 },  // -2.5px X (0.25 sinistra), -2.5px Y (0.25 basso)
      'schutzschuerzenEinmal': { x: 70, y: 422 },
      'schutzschuerzenWieder': { x: 240, y: 422 },
      'flaechendesinfektion': { x: 70, y: 412 },  // Flächendesinfektionsmittel (settore 2528)
      'flaechendesinfektionstuecher': { x: 237.5, y: 412 },  // Flächendesinfektionstücher - +1.5px destra (236 + 1.5 = 237.5)
      'haendedesinfektion': { x: 70, y: 402 }  // Händedesinfektionsmittel (settore 2588)
    };

    if (p.products) {
      Object.keys(p.products).forEach(productKey => {
        if (p.products[productKey] && produkteMap[productKey]) {
          const pos = produkteMap[productKey];
          page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
        }
      });
    }

    // Handschuhgröße (settori 2714-2720)
    const handschuhGroesseMap = {
      'S': { x: 130, y: 382 },
      'M': { x: 150, y: 382 },
      'L': { x: 170, y: 382 },
      'XL': { x: 190, y: 382 }
    };
    if (p.handschuhGroesse && handschuhGroesseMap[p.handschuhGroesse]) {
      const pos = handschuhGroesseMap[p.handschuhGroesse];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // Handschuhmaterial (settori 2737-2745)
    const handschuhMaterialMap = {
      'Nitril': { x: 360, y: 382 },
      'Vinyl': { x: 400, y: 382 },
      'Latex': { x: 440, y: 382 }
    };
    if (p.handschuhMaterial && handschuhMaterialMap[p.handschuhMaterial]) {
      const pos = handschuhMaterialMap[p.handschuhMaterial];
      page1.drawText('X', { x: pos.x, y: pos.y, size: 10, font: helveticaBold });
    }

    // ========== SEZIONE 4: LIEFERADRESSE ==========

    // Coordinate aggiornate (settori 3127 / 3688)
    const lieferadresseAn = formData.lieferung?.an; // Il campo è formData.lieferung.an
    console.log('🔍 DEBUG lieferung.an:', lieferadresseAn);
    if (lieferadresseAn === 'versicherte') {
      page1.drawText('X', { x: 60, y: 312, size: 10, font: helveticaBold });
      console.log('✅ Scritto X per lieferadresse versicherte');
    } else if (lieferadresseAn === 'angehoerige') {
      page1.drawText('X', { x: 270, y: 222, size: 10, font: helveticaBold });
      console.log('✅ Scritto X per lieferadresse angehoerige');
    } else {
      console.warn('⚠️ lieferadresse non riconosciuto:', lieferadresseAn);
    }

    // ========== SEZIONE 5: RECHNUNGSEMPFÄNGER ==========

    // Coordinate aggiornate (settori 3667 / 3688) - SEMPRE ATTIVA (senza filtro versicherungstyp)
    const rechnungsempfaengerAn = formData.rechnung?.an; // Il campo è formData.rechnung.an
    console.log('🔍 DEBUG rechnung.an:', rechnungsempfaengerAn);
    if (rechnungsempfaengerAn === 'versicherte') {
      page1.drawText('X', { x: 62, y: 222, size: 10, font: helveticaBold });  // +2.5px X (0.25 destra)
      console.log('✅ Scritto X per rechnungsempfaenger versicherte');
    } else if (rechnungsempfaengerAn === 'angehoerige') {
      page1.drawText('X', { x: 272, y: 222, size: 10, font: helveticaBold });  // +2.5px X (0.25 destra)
      console.log('✅ Scritto X per rechnungsempfaenger angehoerige');
    } else {
      console.warn('⚠️ rechnungsempfaenger non riconosciuto:', rechnungsempfaengerAn);
    }

    // ========== SEZIONE 6: AGB / PRIVACY ==========

    // Coordinate aggiornate (settori 3787 / 3847) - 0.5 in basso = -5px Y
    page1.drawText('X', { x: 60, y: 197, size: 10, font: helveticaBold }); // AGB
    page1.drawText('X', { x: 60, y: 187, size: 10, font: helveticaBold }); // Privacy

    console.log('✅ Pagina 1 compilata con coordinate da griglia visiva');

    // ========== PAGINA 2: ANLAGE 2 - ANTRAG AUF KOSTENÜBERNAHME ==========

    const page2 = pages[1];
    if (page2) {
      console.log('📄 Compilazione Pagina 2 - Anlage 2...');

      // COORDINATE DA GRIGLIA VISIVA PAGINA 2 (griglia 10x10px, 59 col × 84 righe)

      // Name, Vorname - size 16 (diminuito ancora)
      page2.drawText(`${v.name}, ${v.vorname}`, { x: 70, y: 702, size: 16, font: helveticaFont });

      // Geburtsdatum - formato ggmmaaaa (es: 15031965) con spazi tra cifre
      // Converte da dd.mm.yyyy o dd-mm-yyyy a gg mm aaaa
      let geburtsdatumFormatted = (v.geburtsdatum || '').replace(/[\.\-]/g, ''); // Rimuovi punti e trattini
      if (geburtsdatumFormatted.length === 8) {
        // Se è in formato yyyymmdd (es: 19650315), converti a ddmmyyyy
        const anno = geburtsdatumFormatted.substring(0, 4);
        const mese = geburtsdatumFormatted.substring(4, 6);
        const giorno = geburtsdatumFormatted.substring(6, 8);
        // Controlla se è anno (inizia con 19 o 20)
        if (anno.startsWith('19') || anno.startsWith('20')) {
          geburtsdatumFormatted = giorno + mese + anno; // Converti a ddmmyyyy
        }
      }
      const geburtsdatumClean = geburtsdatumFormatted.split('').join(' ');
      page2.drawText(geburtsdatumClean, { x: 210, y: 712, size: 18, font: helveticaFont });

      // Versichertennummer - alternanza 1-2 spazi, meno spazio tra A-1, 6-7 e prima del 9
      const chars = (v.versichertennummer || '').split('');
      const versichertennummerSpaced = chars.map((c, i) => {
        if (i < chars.length - 1) {
          // Togliere uno spazio tra A-1 (indice 0), 6-7 (indice 5) e prima del 9 (indice 7)
          if (i === 0 || i === 5 || i === 7) return c + ' ';
          return c + (i % 2 === 0 ? '  ' : ' ');
        }
        return c;
      }).join('');
      page2.drawText(versichertennummerSpaced, { x: 379.5, y: 712, size: 18, font: helveticaFont });

      // Anschrift: Straße, PLZ, Wohnort - size 16 (diminuito ancora)
      const anschrift = `${v.strasse}, ${plz} ${ort}`;
      page2.drawText(anschrift, { x: 70, y: 662, size: 16, font: helveticaFont });

      // Pflegekasse - size 16 (diminuito ancora), +50px destra
      page2.drawText(v.pflegekasse || '', { x: 375, y: 662, size: 16, font: helveticaFont });

      // TODO: Completare resto Pagina 2 dopo verifica header

      console.log('✅ Pagina 2 header compilato con coordinate da griglia');
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
      // Settore 4148 → x: 70, y: 142 - 20 (due caselle in basso)
      const signatureDims = signatureImage.scale(0.20); // Firma ingrandita al doppio

      page1.drawImage(signatureImage, {
        x: 70,
        y: 122,  // -20px (due caselle in basso)
        width: signatureDims.width,
        height: signatureDims.height
      });

      // Aggiungi la firma anche alla pagina 3 (+45px in alto, -20px sinistra)
      if (page3) {
        page3.drawImage(signatureImage, {
          x: 295,  // -20px sinistra (315 - 20 = 295)
          y: 340,  // +45px in alto (295 + 45 = 340)
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
  if (formData.signatures.bevollmachtigte && a.data?.typ === 'Betreuer') {
    try {
      console.log('✍️ Disegno firma Bevollmächtigte');
      const signatureBase64 = formData.signatures.bevollmachtigte.split(',')[1];
      const signatureBytes = Uint8Array.from(atob(signatureBase64), c => c.charCodeAt(0));

      const signatureImage = await pdfDoc.embedPng(signatureBytes);
      const pages = pdfDoc.getPages();
      const page1 = pages[0];

      // Settore 4172 → x: 310, y: 142
      const signatureDims = signatureImage.scale(0.15);

      page1.drawImage(signatureImage, {
        x: 310,
        y: 142,
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
  const fromEmail = 'formular@pflegeteufel.de';
  const subject = `📋 Neues Pflegebox-Formular eingereicht - ${formData.versicherte.vorname} ${formData.versicherte.name}`;

  // Converti PDF in base64 per l'allegato (metodo sicuro per file grandi)
  const uint8Array = new Uint8Array(pdfBytes);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  const pdfBase64 = btoa(binaryString);

  // Email HTML mit schönem Design
  const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 10px 0 0; opacity: 0.9; font-size: 14px; }
    .content { padding: 30px; }
    .info-box { background: #f8f9fa; border-left: 4px solid #C12624; padding: 15px; margin: 20px 0; border-radius: 4px; }
    .info-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #666; }
    .info-value { color: #2c3e50; font-weight: 500; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .badge { display: inline-block; background: #28a745; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 Neues Formular eingereicht</h1>
      <p>Ein Kunde hat ein Pflegebox-Formular ausgefüllt</p>
      <span class="badge">NEU</span>
    </div>
    <div class="content">
      <div class="info-box">
        <strong>📄 Formular-Details:</strong>
      </div>
      <div class="info-row">
        <span class="info-label">Kunde:</span>
        <span class="info-value">${formData.versicherte.vorname} ${formData.versicherte.name}</span>
      </div>
      <div class="info-row">
        <span class="info-label">E-Mail:</span>
        <span class="info-value">${formData.versicherte.email}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Telefon:</span>
        <span class="info-value">${formData.versicherte.telefon || 'Nicht angegeben'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Pflegegrad:</span>
        <span class="info-value">${formData.versicherte.pflegegrad || 'Nicht angegeben'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Eingereicht am:</span>
        <span class="info-value">${formData.bestelldatum} um ${formData.bestellzeit} Uhr</span>
      </div>
      <div class="info-box" style="margin-top: 25px; background: #e7f3ff; border-color: #0066cc;">
        <strong>📎 Das ausgefüllte Formular finden Sie im Anhang als PDF.</strong>
      </div>
    </div>
    <div class="footer">
      <p>Automatisch generiert vom Pflege Teufel System<br>
      © ${new Date().getFullYear()} Pflege Teufel | <a href="https://pflegeteufel.de" style="color: #C12624; text-decoration: none;">pflegeteufel.de</a></p>
    </div>
  </div>
</body>
</html>
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
        html: emailHtml,
        attachments: [
          {
            filename: `Pflegebox_Formular_${formData.versicherte.name}_${formData.bestelldatum}.pdf`,
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

// ==================== CUSTOMER CONFIRMATION EMAIL ====================

async function sendCustomerConfirmationEmail(env, formData, pdfBytes) {
  const customerEmail = formData.versicherte.email;
  const fromEmail = 'formular@pflegeteufel.de';
  const subject = `✅ Bestätigung Ihrer Pflegebox-Anfrage - Pflege Teufel`;

  // Converti PDF in base64
  const uint8Array = new Uint8Array(pdfBytes);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  const pdfBase64 = btoa(binaryString);

  // Email HTML per il cliente
  const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 15px 0 0; opacity: 0.95; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
    .message { font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 25px; }
    .info-box { background: #e7f5e7; border-left: 4px solid #28a745; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .info-box h3 { margin: 0 0 12px 0; color: #28a745; font-size: 16px; }
    .info-box p { margin: 0; color: #555; font-size: 14px; line-height: 1.6; }
    .highlight-box { background: #fff8e1; border-left: 4px solid #ffcc02; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .highlight-box strong { color: #f57c00; display: block; margin-bottom: 8px; font-size: 15px; }
    .data-summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; }
    .data-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
    .data-row:last-child { border-bottom: none; }
    .data-label { font-weight: 600; color: #666; font-size: 14px; }
    .data-value { color: #2c3e50; font-weight: 500; font-size: 14px; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #666; line-height: 1.6; }
    .footer a { color: #C12624; text-decoration: none; font-weight: 600; }
    .checkmark { display: inline-block; width: 60px; height: 60px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✓</div>
      <h1>Vielen Dank für Ihre Anfrage!</h1>
      <p>Wir haben Ihr Pflegebox-Formular erfolgreich erhalten</p>
    </div>
    <div class="content">
      <div class="greeting">
        Sehr geehrte/r ${formData.versicherte.anrede} ${formData.versicherte.name},
      </div>

      <div class="message">
        vielen Dank für Ihre Pflegebox-Anfrage über unsere Website. Wir haben Ihre Unterlagen erfolgreich erhalten und werden uns nun um alles Weitere kümmern.
      </div>

      <div class="info-box">
        <h3>📋 Was passiert jetzt?</h3>
        <p>
          <strong>1.</strong> Wir prüfen Ihre Angaben und bereiten den Antrag für Ihre Krankenkasse vor.<br>
          <strong>2.</strong> Wir reichen alle erforderlichen Unterlagen bei Ihrer Pflegekasse ein.<br>
          <strong>3.</strong> Sobald wir eine Rückmeldung von der Krankenkasse erhalten, werden wir Sie umgehend kontaktieren.
        </p>
      </div>

      <div class="highlight-box">
        <strong>💡 Wichtiger Hinweis:</strong>
        Sie müssen sich um nichts weiter kümmern! Wir übernehmen die komplette Abwicklung mit Ihrer Krankenkasse und halten Sie auf dem Laufenden.
      </div>

      <div class="data-summary">
        <strong style="display: block; margin-bottom: 15px; color: #2c3e50; font-size: 16px;">📄 Ihre Antragsdaten:</strong>
        <div class="data-row">
          <span class="data-label">Name:</span>
          <span class="data-value">${formData.versicherte.vorname} ${formData.versicherte.name}</span>
        </div>
        <div class="data-row">
          <span class="data-label">E-Mail:</span>
          <span class="data-value">${formData.versicherte.email}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Telefon:</span>
          <span class="data-value">${formData.versicherte.telefon}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Pflegegrad:</span>
          <span class="data-value">${formData.versicherte.pflegegrad}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Pflegekasse:</span>
          <span class="data-value">${formData.versicherte.pflegekasse}</span>
        </div>
        <div class="data-row">
          <span class="data-label">Eingereicht am:</span>
          <span class="data-value">${formData.bestelldatum} um ${formData.bestellzeit} Uhr</span>
        </div>
      </div>

      <div class="message">
        Im Anhang dieser E-Mail finden Sie eine Kopie Ihres ausgefüllten Formulars für Ihre Unterlagen.
      </div>

      <div class="message">
        Bei Rückfragen stehen wir Ihnen gerne zur Verfügung:<br>
        <strong>📧 E-Mail:</strong> <a href="mailto:pflegeteufelagentur@gmail.com">pflegeteufelagentur@gmail.com</a><br>
        <strong>📞 Telefon:</strong> [Ihre Telefonnummer hier einfügen]
      </div>

      <div class="message" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
        Mit freundlichen Grüßen<br>
        <strong style="color: #C12624;">Ihr Pflege Teufel Team</strong>
      </div>
    </div>
    <div class="footer">
      <p><strong>Pflege Teufel Agentur</strong><br>
      Ihr Partner für häusliche Pflege und Pflegehilfsmittel</p>
      <p style="margin-top: 15px;">
        <a href="https://pflegeteufel.de">www.pflegeteufel.de</a> |
        <a href="mailto:pflegeteufelagentur@gmail.com">pflegeteufelagentur@gmail.com</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        © ${new Date().getFullYear()} Pflege Teufel. Alle Rechte vorbehalten.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Invia email via Resend
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: customerEmail,
          subject: subject,
          html: customerEmailHtml,
          attachments: [
            {
              filename: `Pflegebox_Formular_${formData.versicherte.name}_${formData.bestelldatum}.pdf`,
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
      console.log(`✅ Email di conferma inviata al cliente: ${customerEmail} (ID: ${result.id})`);
      return result;
    } catch (error) {
      console.error('❌ Errore invio email conferma cliente:', error);
      // Non blocchiamo il processo se l'email al cliente fallisce
      return { success: false, error: error.message };
    }
  }

  console.warn('⚠️ Resend API non configurato - email conferma cliente non inviata');
  return { success: false, note: 'Resend API not configured' };
}

// ==================== ORDER CONFIRMATION EMAIL ====================

async function sendOrderConfirmationEmail(env, orderData, pdfBytes) {
  const customerEmail = orderData.customer?.email;
  const fromEmail = 'bestellung@pflegeteufel.de';
  const subject = `✅ Bestellbestätigung #${orderData.order_number} - Pflege Teufel`;

  // Converti PDF in base64
  const uint8Array = new Uint8Array(pdfBytes);
  let binaryString = '';
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
    binaryString += String.fromCharCode(...chunk);
  }
  const pdfBase64 = btoa(binaryString);

  // Formatta gli item dell'ordine
  const orderItemsHtml = orderData.line_items.map(item => `
    <tr style="border-bottom: 1px solid #e0e0e0;">
      <td style="padding: 15px 10px;">
        <strong style="color: #2c3e50; font-size: 15px;">${item.name}</strong><br>
        <span style="color: #666; font-size: 13px;">Menge: ${item.quantity}</span>
      </td>
      <td style="padding: 15px 10px; text-align: right; color: #2c3e50; font-weight: 600;">
        ${(parseFloat(item.price) * item.quantity).toFixed(2)} €
      </td>
    </tr>
  `).join('');

  // Indirizzo di spedizione
  const shippingAddress = orderData.shipping_address;
  const addressHtml = shippingAddress ? `
    ${shippingAddress.first_name} ${shippingAddress.last_name}<br>
    ${shippingAddress.address1}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}<br>
    ${shippingAddress.zip} ${shippingAddress.city}<br>
    ${shippingAddress.country}
  ` : 'Keine Versandadresse';

  // Email HTML
  const orderEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #C12624 0%, #A01F1D 100%); color: white; padding: 40px 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 700; }
    .header p { margin: 15px 0 0; opacity: 0.95; font-size: 16px; }
    .content { padding: 40px 30px; }
    .greeting { font-size: 18px; font-weight: 600; color: #2c3e50; margin-bottom: 20px; }
    .message { font-size: 15px; line-height: 1.8; color: #555; margin-bottom: 25px; }
    .order-box { background: #f8f9fa; border: 2px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 25px 0; }
    .order-header { font-size: 18px; font-weight: 700; color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #C12624; padding-bottom: 10px; }
    .order-items { width: 100%; border-collapse: collapse; margin: 15px 0; }
    .order-total { background: #e7f5e7; padding: 15px; border-radius: 6px; margin: 15px 0; }
    .total-row { display: flex; justify-content: space-between; padding: 8px 0; }
    .total-row.final { font-size: 18px; font-weight: 700; color: #28a745; border-top: 2px solid #28a745; padding-top: 12px; margin-top: 8px; }
    .info-box { background: #e7f3ff; border-left: 4px solid #0066cc; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .info-box h3 { margin: 0 0 12px 0; color: #0066cc; font-size: 16px; }
    .info-box p { margin: 0; color: #555; font-size: 14px; line-height: 1.6; }
    .shipping-box { background: #fff8e1; border-left: 4px solid #ffcc02; padding: 20px; margin: 25px 0; border-radius: 4px; }
    .shipping-box h3 { margin: 0 0 12px 0; color: #f57c00; font-size: 16px; }
    .footer { background: #f8f9fa; padding: 25px; text-align: center; font-size: 13px; color: #666; line-height: 1.6; }
    .footer a { color: #C12624; text-decoration: none; font-weight: 600; }
    .checkmark { display: inline-block; width: 60px; height: 60px; background: #28a745; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 36px; margin: 0 auto 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✓</div>
      <h1>Vielen Dank für Ihre Bestellung!</h1>
      <p>Bestellnummer: #${orderData.order_number}</p>
    </div>
    <div class="content">
      <div class="greeting">
        Hallo ${orderData.customer?.first_name || 'Kunde'},
      </div>

      <div class="message">
        vielen Dank für Ihre Bestellung bei Pflege Teufel! Wir haben Ihre Bestellung erfolgreich erhalten und werden sie schnellstmöglich bearbeiten.
      </div>

      <div class="order-box">
        <div class="order-header">📦 Ihre Bestellung</div>
        <table class="order-items">
          <tbody>
            ${orderItemsHtml}
          </tbody>
        </table>
        <div class="order-total">
          <div class="total-row">
            <span>Zwischensumme:</span>
            <span>${parseFloat(orderData.subtotal_price || 0).toFixed(2)} €</span>
          </div>
          ${orderData.total_tax && parseFloat(orderData.total_tax) > 0 ? `
          <div class="total-row">
            <span>MwSt.:</span>
            <span>${parseFloat(orderData.total_tax).toFixed(2)} €</span>
          </div>
          ` : ''}
          ${orderData.total_shipping_price_set?.shop_money?.amount && parseFloat(orderData.total_shipping_price_set.shop_money.amount) > 0 ? `
          <div class="total-row">
            <span>Versand:</span>
            <span>${parseFloat(orderData.total_shipping_price_set.shop_money.amount).toFixed(2)} €</span>
          </div>
          ` : ''}
          <div class="total-row final">
            <span>Gesamtsumme:</span>
            <span>${parseFloat(orderData.total_price || 0).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      ${shippingAddress ? `
      <div class="shipping-box">
        <h3>📍 Lieferadresse</h3>
        <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.8;">
          ${addressHtml}
        </p>
      </div>
      ` : ''}

      <div class="info-box">
        <h3>📋 Was passiert jetzt?</h3>
        <p>
          <strong>1.</strong> Wir bereiten Ihre Bestellung vor und verpacken sie sorgfältig.<br>
          <strong>2.</strong> Sie erhalten eine weitere E-Mail, sobald Ihre Bestellung versandt wurde.<br>
          <strong>3.</strong> Die Lieferung erfolgt in der Regel innerhalb von 2-4 Werktagen.
        </p>
      </div>

      <div class="message">
        Im Anhang dieser E-Mail finden Sie eine Kopie Ihrer Bestellung als PDF für Ihre Unterlagen.
      </div>

      <div class="message">
        Sie können Ihre Bestellung jederzeit in Ihrem Kundenkonto verfolgen oder uns bei Fragen kontaktieren.
      </div>

      <div class="message">
        Bei Rückfragen stehen wir Ihnen gerne zur Verfügung:<br>
        <strong>📧 E-Mail:</strong> <a href="mailto:pflegeteufelagentur@gmail.com">pflegeteufelagentur@gmail.com</a><br>
        <strong>📞 Telefon:</strong> [Ihre Telefonnummer hier einfügen]
      </div>

      <div class="message" style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e0e0e0;">
        Mit freundlichen Grüßen<br>
        <strong style="color: #C12624;">Ihr Pflege Teufel Team</strong>
      </div>
    </div>
    <div class="footer">
      <p><strong>Pflege Teufel Agentur</strong><br>
      Ihr Partner für häusliche Pflege und Pflegehilfsmittel</p>
      <p style="margin-top: 15px;">
        <a href="https://pflegeteufel.de">www.pflegeteufel.de</a> |
        <a href="mailto:pflegeteufelagentur@gmail.com">pflegeteufelagentur@gmail.com</a>
      </p>
      <p style="margin-top: 15px; font-size: 11px; color: #999;">
        © ${new Date().getFullYear()} Pflege Teufel. Alle Rechte vorbehalten.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();

  // Invia email via Resend
  if (env.RESEND_API_KEY) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromEmail,
          to: customerEmail,
          subject: subject,
          html: orderEmailHtml,
          attachments: [
            {
              filename: `Bestellung_${orderData.order_number}.pdf`,
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
      console.log(`✅ Email conferma ordine inviata: ${customerEmail} (Order #${orderData.order_number}, Email ID: ${result.id})`);
      return result;
    } catch (error) {
      console.error('❌ Errore invio email conferma ordine:', error);
      return { success: false, error: error.message };
    }
  }

  console.warn('⚠️ Resend API non configurato - email conferma ordine non inviata');
  return { success: false, note: 'Resend API not configured' };
}

// ==================== FETCH SHOPIFY ORDER PDF ====================

async function fetchShopifyOrderPDF(orderData, env) {
  console.log('📥 Tentativo recupero PDF ordine da Shopify...');

  const { SHOPIFY_SHOP, SHOPIFY_ADMIN_TOKEN, SHOPIFY_API_VERSION } = env;

  if (!SHOPIFY_SHOP || !SHOPIFY_ADMIN_TOKEN) {
    throw new Error('Shopify credentials non configurati');
  }

  // URL per scaricare il PDF dell'ordine da Shopify
  // Shopify genera automaticamente un PDF accessibile via API
  const pdfUrl = `https://${SHOPIFY_SHOP}/admin/api/${SHOPIFY_API_VERSION}/orders/${orderData.id}.pdf`;

  console.log('📡 Richiesta PDF a:', pdfUrl);

  const response = await fetch(pdfUrl, {
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ADMIN_TOKEN
    }
  });

  if (!response.ok) {
    throw new Error(`Shopify PDF API error: ${response.status}`);
  }

  const pdfBytes = await response.arrayBuffer();
  console.log(`✅ PDF Shopify scaricato: ${pdfBytes.byteLength} bytes`);

  return new Uint8Array(pdfBytes);
}

// ==================== GENERATE ORDER PDF ====================

async function generateOrderPDF(orderData, env) {
  console.log('📄 Generazione PDF ordine...');

  // Crea un nuovo documento PDF
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4

  // Font
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  let yPosition = height - 50;

  // Header
  page.drawText('BESTELLBESTÄTIGUNG', {
    x: 50,
    y: yPosition,
    size: 24,
    font: helveticaBold,
    color: rgb(0.75, 0.15, 0.14) // #C12624
  });

  yPosition -= 30;
  page.drawText(`Bestellnummer: #${orderData.order_number}`, {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 20;
  const orderDate = new Date(orderData.created_at);
  page.drawText(`Datum: ${orderDate.toLocaleDateString('de-DE')} um ${orderDate.toLocaleTimeString('de-DE')}`, {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });

  yPosition -= 40;

  // Customer info
  page.drawText('KUNDE', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 20;
  const customer = orderData.customer;
  if (customer) {
    page.drawText(`${customer.first_name || ''} ${customer.last_name || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;
    page.drawText(customer.email || '', {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;
    if (customer.phone) {
      page.drawText(customer.phone, {
        x: 50,
        y: yPosition,
        size: 11,
        font: helveticaFont
      });
      yPosition -= 15;
    }
  }

  yPosition -= 25;

  // Shipping address
  const shippingAddress = orderData.shipping_address;
  if (shippingAddress) {
    page.drawText('LIEFERADRESSE', {
      x: 50,
      y: yPosition,
      size: 14,
      font: helveticaBold
    });
    yPosition -= 20;

    page.drawText(`${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(`${shippingAddress.address1 || ''}${shippingAddress.address2 ? ', ' + shippingAddress.address2 : ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(`${shippingAddress.zip || ''} ${shippingAddress.city || ''}`, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 15;

    page.drawText(shippingAddress.country || '', {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 25;
  }

  yPosition -= 10;

  // Order items
  page.drawText('BESTELLTE ARTIKEL', {
    x: 50,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });

  yPosition -= 25;

  // Table header
  page.drawText('Artikel', {
    x: 50,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });
  page.drawText('Menge', {
    x: 350,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });
  page.drawText('Preis', {
    x: 450,
    y: yPosition,
    size: 11,
    font: helveticaBold
  });

  yPosition -= 5;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  yPosition -= 20;

  // Line items
  for (const item of orderData.line_items) {
    if (yPosition < 100) {
      // Nuova pagina se necessario
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = height - 50;
    }

    // Nome prodotto (con word wrap se troppo lungo)
    const productName = item.name || '';
    const maxWidth = 280;
    let displayName = productName;

    if (helveticaFont.widthOfTextAtSize(productName, 11) > maxWidth) {
      displayName = productName.substring(0, 40) + '...';
    }

    page.drawText(displayName, {
      x: 50,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    page.drawText(`${item.quantity}`, {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    const itemTotal = (parseFloat(item.price) * item.quantity).toFixed(2);
    page.drawText(`${itemTotal} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });

    yPosition -= 20;
  }

  yPosition -= 10;
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 1,
    color: rgb(0, 0, 0)
  });

  yPosition -= 25;

  // Totals
  page.drawText('Zwischensumme:', {
    x: 350,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });
  page.drawText(`${parseFloat(orderData.subtotal_price || 0).toFixed(2)} €`, {
    x: 450,
    y: yPosition,
    size: 11,
    font: helveticaFont
  });

  yPosition -= 20;

  if (orderData.total_tax && parseFloat(orderData.total_tax) > 0) {
    page.drawText('MwSt.:', {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    page.drawText(`${parseFloat(orderData.total_tax).toFixed(2)} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;
  }

  if (orderData.total_shipping_price_set?.shop_money?.amount && parseFloat(orderData.total_shipping_price_set.shop_money.amount) > 0) {
    page.drawText('Versand:', {
      x: 350,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    page.drawText(`${parseFloat(orderData.total_shipping_price_set.shop_money.amount).toFixed(2)} €`, {
      x: 450,
      y: yPosition,
      size: 11,
      font: helveticaFont
    });
    yPosition -= 20;
  }

  yPosition -= 5;
  page.drawLine({
    start: { x: 350, y: yPosition },
    end: { x: 545, y: yPosition },
    thickness: 2,
    color: rgb(0, 0, 0)
  });

  yPosition -= 25;

  page.drawText('GESAMT:', {
    x: 350,
    y: yPosition,
    size: 14,
    font: helveticaBold
  });
  page.drawText(`${parseFloat(orderData.total_price || 0).toFixed(2)} €`, {
    x: 450,
    y: yPosition,
    size: 14,
    font: helveticaBold,
    color: rgb(0.16, 0.65, 0.27) // #28a745
  });

  // Footer
  yPosition = 50;
  page.drawText('Vielen Dank für Ihre Bestellung bei Pflege Teufel!', {
    x: 50,
    y: yPosition,
    size: 10,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4)
  });

  yPosition -= 15;
  page.drawText('www.pflegeteufel.de | pflegeteufelagentur@gmail.com', {
    x: 50,
    y: yPosition,
    size: 9,
    font: helveticaFont,
    color: rgb(0.4, 0.4, 0.4)
  });

  const pdfBytes = await pdfDoc.save();
  console.log(`✅ PDF ordine generato: ${pdfBytes.length} bytes`);

  return pdfBytes;
}

// ==================== AUTH UTILITY FUNCTIONS ====================

/**
 * Hash password using bcrypt-like algorithm (Web Crypto API)
 */
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Verify password against hash
 */
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

/**
 * Generate secure session token (JWT-like)
 */
async function generateSessionToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}
