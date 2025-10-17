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
            "/locations", "/inventory_levels", "/inventory_levels/set"
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
};
