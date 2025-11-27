// ==================== CLOUDFLARE WORKER - AUTENTICAZIONE CLIENTI ====================
// Sistema completo di registrazione, login e gestione clienti
// Per pflegeteufel.de

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

// Utility per hashing password con Web Crypto API
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility per verificare password
async function verifyPassword(password, hash) {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// Genera JWT token (semplificato, senza librerie esterne)
async function generateJWT(payload, secret) {
  const header = { alg: 'HS256', typ: 'JWT' };

  const base64Header = btoa(JSON.stringify(header));
  const base64Payload = btoa(JSON.stringify(payload));

  const message = `${base64Header}.${base64Payload}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const base64Signature = btoa(String.fromCharCode(...new Uint8Array(signature)));

  return `${message}.${base64Signature}`;
}

// Verifica JWT token
async function verifyJWT(token, secret) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = JSON.parse(atob(parts[1]));

    // Verifica scadenza
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return null;
    }

    return payload;
  } catch (e) {
    return null;
  }
}

// Genera token random
function generateToken(length = 32) {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Validazione email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validazione password (min 8 caratteri, almeno 1 numero, 1 lettera)
function isValidPassword(password) {
  return password.length >= 8 && /[0-9]/.test(password) && /[a-zA-Z]/.test(password);
}

// Log audit per GDPR
async function logAudit(db, customerId, action, details, ipAddress, userAgent) {
  try {
    await db.prepare(`
      INSERT INTO audit_log (customer_id, action, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?)
    `).bind(customerId, action, details, ipAddress, userAgent).run();
  } catch (e) {
    console.error('Audit log error:', e);
  }
}

export default {
  async fetch(request, env) {
    const {
      ALLOWED_ORIGIN,
      WORKER_SHARED_KEY,
      CUSTOMERS_DB,
      RESEND_API_KEY,
      JWT_SECRET
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
      "Access-Control-Allow-Headers": "Content-Type, X-Worker-Key, Authorization",
      "Access-Control-Max-Age": "86400",
      "Vary": "Origin"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const ipAddress = request.headers.get('CF-Connecting-IP');
    const userAgent = request.headers.get('User-Agent');

    // Health check
    if (path === "/health") {
      return new Response(JSON.stringify({
        ok: true,
        database: !!CUSTOMERS_DB,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Parse body for POST/PUT
    let body = null;
    if (request.method === "POST" || request.method === "PUT") {
      try {
        const text = await request.text();
        if (text) body = JSON.parse(text);
      } catch (e) {
        return new Response(JSON.stringify({ success: false, error: 'Invalid JSON' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== REGISTRAZIONE CLIENTE ==========
    if (path === "/api/auth/register" && request.method === "POST") {
      try {
        const {
          email,
          password,
          anrede,
          vorname,
          nachname,
          telefon,
          geburtsdatum,
          strasse,
          hausnummer,
          plz,
          ort,
          land,
          pflegegrad,
          pflegekasse,
          versichertennummer,
          newsletter,
          marketing_consent
        } = body;

        // Validazione
        if (!email || !isValidEmail(email)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Email nicht gültig'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!password || !isValidPassword(password)) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Passwort muss mindestens 8 Zeichen, eine Zahl und einen Buchstaben enthalten'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!vorname || !nachname) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Vorname und Nachname sind erforderlich'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        if (!marketing_consent) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Datenschutzbestimmungen müssen akzeptiert werden'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verifica se email esiste già
        const existingCustomer = await CUSTOMERS_DB.prepare(
          'SELECT id FROM customers WHERE email = ?'
        ).bind(email).first();

        if (existingCustomer) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Diese E-Mail ist bereits registriert'
          }), {
            status: 409,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Inserisci nuovo cliente
        const result = await CUSTOMERS_DB.prepare(`
          INSERT INTO customers (
            email, password_hash, anrede, vorname, nachname, telefon, geburtsdatum,
            strasse, hausnummer, plz, ort, land, pflegegrad, pflegekasse,
            versichertennummer, newsletter, marketing_consent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          email, passwordHash, anrede, vorname, nachname, telefon, geburtsdatum,
          strasse, hausnummer, plz, ort || 'Germany', land, pflegegrad, pflegekasse,
          versichertennummer, newsletter ? 1 : 0, marketing_consent ? 1 : 0
        ).run();

        const customerId = result.meta.last_row_id;

        // Genera token verifica email
        const verificationToken = generateToken();
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 ore

        await CUSTOMERS_DB.prepare(`
          INSERT INTO email_verifications (customer_id, verification_token, expires_at)
          VALUES (?, ?, ?)
        `).bind(customerId, verificationToken, expiresAt).run();

        // Log audit
        await logAudit(CUSTOMERS_DB, customerId, 'REGISTER', 'New customer registered', ipAddress, userAgent);

        // TODO: Invia email di verifica con Resend
        // const verificationUrl = `https://pflegeteufel.de/verify-email?token=${verificationToken}`;

        return new Response(JSON.stringify({
          success: true,
          message: 'Registrierung erfolgreich! Bitte überprüfen Sie Ihre E-Mail.',
          customerId
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Registrierung fehlgeschlagen'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== LOGIN CLIENTE ==========
    if (path === "/api/auth/login" && request.method === "POST") {
      try {
        const { email, password } = body;

        if (!email || !password) {
          return new Response(JSON.stringify({
            success: false,
            error: 'E-Mail und Passwort sind erforderlich'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Trova cliente
        const customer = await CUSTOMERS_DB.prepare(
          'SELECT * FROM customers WHERE email = ? AND is_active = 1'
        ).bind(email).first();

        if (!customer) {
          return new Response(JSON.stringify({
            success: false,
            error: 'E-Mail oder Passwort falsch'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Verifica password
        const isValid = await verifyPassword(password, customer.password_hash);
        if (!isValid) {
          return new Response(JSON.stringify({
            success: false,
            error: 'E-Mail oder Passwort falsch'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Genera JWT token
        const jwtSecret = JWT_SECRET || 'pflegeteufel_secret_2025';
        const token = await generateJWT({
          customerId: customer.id,
          email: customer.email,
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 giorni
        }, jwtSecret);

        // Crea sessione
        const sessionToken = generateToken();
        const refreshToken = generateToken();
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        await CUSTOMERS_DB.prepare(`
          INSERT INTO sessions (customer_id, session_token, refresh_token, expires_at, ip_address, user_agent)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(customer.id, sessionToken, refreshToken, expiresAt, ipAddress, userAgent).run();

        // Aggiorna last_login
        await CUSTOMERS_DB.prepare(
          'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
        ).bind(customer.id).run();

        // Log audit
        await logAudit(CUSTOMERS_DB, customer.id, 'LOGIN', 'Customer logged in', ipAddress, userAgent);

        return new Response(JSON.stringify({
          success: true,
          token,
          sessionToken,
          refreshToken,
          customer: {
            id: customer.id,
            email: customer.email,
            vorname: customer.vorname,
            nachname: customer.nachname,
            is_verified: customer.is_verified
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Login error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Login fehlgeschlagen'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== LOGOUT ==========
    if (path === "/api/auth/logout" && request.method === "POST") {
      try {
        const authHeader = request.headers.get('Authorization');
        const sessionToken = body?.sessionToken;

        if (sessionToken) {
          // Elimina sessione
          await CUSTOMERS_DB.prepare(
            'DELETE FROM sessions WHERE session_token = ?'
          ).bind(sessionToken).run();
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Abgemeldet'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Logout error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Logout fehlgeschlagen'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== GET PROFILO CLIENTE ==========
    if (path === "/api/auth/me" && request.method === "GET") {
      try {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nicht autorisiert'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        const jwtSecret = JWT_SECRET || 'pflegeteufel_secret_2025';
        const payload = await verifyJWT(token, jwtSecret);

        if (!payload) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Token ungültig oder abgelaufen'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Trova cliente
        const customer = await CUSTOMERS_DB.prepare(
          'SELECT * FROM active_customers WHERE id = ?'
        ).bind(payload.customerId).first();

        if (!customer) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Kunde nicht gefunden'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          customer
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Get profile error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Fehler beim Laden des Profils'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== UPDATE PROFILO CLIENTE ==========
    if (path.startsWith("/api/customers/") && request.method === "PUT") {
      try {
        const customerId = path.split('/')[3];

        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nicht autorisiert'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.substring(7);
        const jwtSecret = JWT_SECRET || 'pflegeteufel_secret_2025';
        const payload = await verifyJWT(token, jwtSecret);

        if (!payload || payload.customerId != customerId) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nicht autorisiert'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const {
          anrede, vorname, nachname, telefon, geburtsdatum,
          strasse, hausnummer, plz, ort, land,
          pflegegrad, pflegekasse, versichertennummer, newsletter
        } = body;

        await CUSTOMERS_DB.prepare(`
          UPDATE customers SET
            anrede = ?, vorname = ?, nachname = ?, telefon = ?, geburtsdatum = ?,
            strasse = ?, hausnummer = ?, plz = ?, ort = ?, land = ?,
            pflegegrad = ?, pflegekasse = ?, versichertennummer = ?, newsletter = ?
          WHERE id = ?
        `).bind(
          anrede, vorname, nachname, telefon, geburtsdatum,
          strasse, hausnummer, plz, ort, land,
          pflegegrad, pflegekasse, versichertennummer, newsletter ? 1 : 0,
          customerId
        ).run();

        // Log audit
        await logAudit(CUSTOMERS_DB, customerId, 'UPDATE_PROFILE', 'Customer updated profile', ipAddress, userAgent);

        return new Response(JSON.stringify({
          success: true,
          message: 'Profil aktualisiert'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Update profile error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Fehler beim Aktualisieren des Profils'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== LISTA CLIENTI (Admin only) ==========
    if (path === "/api/customers" && request.method === "GET") {
      try {
        // Verifica chiave worker (admin)
        const workerKey = request.headers.get('X-Worker-Key');
        if (workerKey !== WORKER_SHARED_KEY) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nicht autorisiert'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const searchQuery = url.searchParams.get('search');
        let query = 'SELECT * FROM active_customers';
        let params = [];

        if (searchQuery) {
          query += ' WHERE vorname LIKE ? OR nachname LIKE ? OR email LIKE ? OR ort LIKE ?';
          const searchParam = `%${searchQuery}%`;
          params = [searchParam, searchParam, searchParam, searchParam];
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const stmt = CUSTOMERS_DB.prepare(query);
        if (params.length > 0) {
          params.forEach(param => stmt.bind(param));
        }

        const result = await stmt.all();

        return new Response(JSON.stringify({
          success: true,
          customers: result.results || []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('List customers error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Fehler beim Laden der Kunden'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== DELETE CLIENTE (GDPR) ==========
    if (path.startsWith("/api/customers/") && path.endsWith("/delete") && request.method === "DELETE") {
      try {
        const customerId = path.split('/')[3];

        const authHeader = request.headers.get('Authorization');
        const workerKey = request.headers.get('X-Worker-Key');

        // Può cancellare solo l'utente stesso o un admin
        let authorized = false;

        if (workerKey === WORKER_SHARED_KEY) {
          authorized = true;
        } else if (authHeader) {
          const token = authHeader.substring(7);
          const jwtSecret = JWT_SECRET || 'pflegeteufel_secret_2025';
          const payload = await verifyJWT(token, jwtSecret);
          if (payload && payload.customerId == customerId) {
            authorized = true;
          }
        }

        if (!authorized) {
          return new Response(JSON.stringify({
            success: false,
            error: 'Nicht autorisiert'
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Log audit prima di cancellare
        await logAudit(CUSTOMERS_DB, customerId, 'DELETE_ACCOUNT', 'Customer account deleted (GDPR)', ipAddress, userAgent);

        // Cancella cliente (cascade elimina anche sessioni, reset password, ecc.)
        await CUSTOMERS_DB.prepare(
          'DELETE FROM customers WHERE id = ?'
        ).bind(customerId).run();

        return new Response(JSON.stringify({
          success: true,
          message: 'Konto gelöscht'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error) {
        console.error('Delete customer error:', error);
        return new Response(JSON.stringify({
          success: false,
          error: 'Fehler beim Löschen des Kontos'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // 404
    return new Response(JSON.stringify({
      success: false,
      error: 'Endpoint nicht gefunden'
    }), {
      status: 404,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
};
