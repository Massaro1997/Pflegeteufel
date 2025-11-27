-- ==================== SCHEMA DATABASE CLIENTI PFLEGETEUFEL ====================
-- Database: Cloudflare D1
-- Scopo: Gestione registrazione clienti e autenticazione
-- GDPR Compliant

-- Tabella principale clienti registrati
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,

  -- Dati anagrafici
  anrede TEXT CHECK(anrede IN ('Herr', 'Frau', 'Divers')),
  vorname TEXT NOT NULL,
  nachname TEXT NOT NULL,
  telefon TEXT,
  geburtsdatum TEXT,

  -- Indirizzo
  strasse TEXT,
  hausnummer TEXT,
  plz TEXT,
  ort TEXT,
  land TEXT DEFAULT 'Germany',

  -- Dati Pflegebox (opzionali)
  pflegegrad INTEGER CHECK(pflegegrad >= 1 AND pflegegrad <= 5),
  pflegekasse TEXT,
  versichertennummer TEXT,

  -- Preferenze
  newsletter BOOLEAN DEFAULT 0,
  marketing_consent BOOLEAN DEFAULT 0,

  -- Collegamento Shopify
  shopify_customer_id TEXT,

  -- Status account
  is_verified BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,

  -- Timestamp
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

-- Tabella sessioni per JWT/Session management
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  refresh_token TEXT UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabella per reset password
CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  reset_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabella per email verification
CREATE TABLE IF NOT EXISTS email_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  verification_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  verified BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- Tabella audit log per GDPR compliance
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER,
  action TEXT NOT NULL,
  details TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL
);

-- Indici per performance
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_shopify_id ON customers(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_customer ON sessions(customer_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(reset_token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_audit_log_customer ON audit_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- Trigger per aggiornare updated_at automaticamente
CREATE TRIGGER IF NOT EXISTS update_customer_timestamp
AFTER UPDATE ON customers
BEGIN
  UPDATE customers SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Vista per clienti attivi (senza dati sensibili)
CREATE VIEW IF NOT EXISTS active_customers AS
SELECT
  id,
  email,
  anrede,
  vorname,
  nachname,
  telefon,
  strasse,
  hausnummer,
  plz,
  ort,
  land,
  pflegegrad,
  pflegekasse,
  newsletter,
  shopify_customer_id,
  is_verified,
  created_at,
  last_login
FROM customers
WHERE is_active = 1;
