-- ============================================
-- PFLEGETEUFEL CUSTOMERS DATABASE SCHEMA
-- Database D1: pflegeteufel-customers
-- ============================================

-- Tabella CLIENTI
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,

  -- Dati Anagrafici
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  anrede TEXT CHECK(anrede IN ('Herr', 'Frau', 'Divers')),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT,
  geburtsdatum TEXT, -- formato: YYYY-MM-DD

  -- Indirizzo
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  land TEXT DEFAULT 'Germany',

  -- Dati Pflegebox (opzionali)
  pflegegrad INTEGER CHECK(pflegegrad BETWEEN 1 AND 5),
  pflegekasse TEXT,
  versichertennummer TEXT,

  -- Collegamento Shopify
  shopify_customer_id TEXT,

  -- Preferenze Marketing
  newsletter BOOLEAN DEFAULT 0,

  -- Metadati
  email_verified BOOLEAN DEFAULT 0,
  account_status TEXT DEFAULT 'active' CHECK(account_status IN ('active', 'suspended', 'deleted')),

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_shopify_id ON customers(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_plz ON customers(plz);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(account_status);

-- ============================================

-- Tabella SESSIONI (per login/logout)
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY, -- Session token (JWT)
  customer_id INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

-- ============================================

-- Tabella PASSWORD RESET (per recupero password)
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  reset_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_password_resets_customer ON password_resets(customer_id);

-- ============================================

-- Tabella INDIRIZZI (per indirizzi multipli)
CREATE TABLE IF NOT EXISTS addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,

  -- Tipo indirizzo
  address_type TEXT DEFAULT 'shipping' CHECK(address_type IN ('shipping', 'billing', 'both')),
  is_default BOOLEAN DEFAULT 0,

  -- Dati indirizzo
  anrede TEXT,
  vorname TEXT,
  nachname TEXT,
  firma TEXT, -- Nome azienda (opzionale)
  strasse TEXT NOT NULL,
  hausnummer TEXT NOT NULL,
  zusatz TEXT, -- Appartamento, scala, ecc.
  plz TEXT NOT NULL,
  ort TEXT NOT NULL,
  land TEXT DEFAULT 'Germany',
  telefon TEXT,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_addresses_customer ON addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_addresses_default ON addresses(customer_id, is_default);

-- ============================================

-- Tabella ATTIVITÀ LOG (per audit)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'register', 'update_profile', 'change_password', ecc.
  ip_address TEXT,
  user_agent TEXT,
  details TEXT, -- JSON con dettagli extra
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_customer ON activity_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_activity_type ON activity_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_logs(created_at);

-- ============================================

-- View per query veloci: Clienti con ultimo login
CREATE VIEW IF NOT EXISTS customers_with_stats AS
SELECT
  c.id,
  c.email,
  c.vorname,
  c.nachname,
  c.telefon,
  c.ort,
  c.plz,
  c.pflegegrad,
  c.pflegekasse,
  c.shopify_customer_id,
  c.newsletter,
  c.account_status,
  c.created_at,
  c.last_login_at,
  COUNT(DISTINCT s.id) as active_sessions,
  COUNT(DISTINCT a.id) as total_addresses
FROM customers c
LEFT JOIN sessions s ON c.id = s.customer_id AND s.expires_at > CURRENT_TIMESTAMP
LEFT JOIN addresses a ON c.id = a.customer_id
GROUP BY c.id;

-- ============================================
-- FINE SCHEMA
-- ============================================
