-- =============================================================================
-- KALILUNI COFFEE FARMERS DELIVERY SYSTEM
-- PostgreSQL Database Schema & Initial Seed Data
-- =============================================================================

-- Drop tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS password_resets CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS forms CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS farmers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- -----------------------------------------------------------------------------
-- 1. USERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'staff', 'admin')),
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- -----------------------------------------------------------------------------
-- 2. FARMERS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE farmers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  member_no VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  location VARCHAR(255),
  total_delivered NUMERIC(10, 2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  join_date DATE DEFAULT CURRENT_DATE
);

CREATE INDEX idx_farmers_user_id ON farmers(user_id);
CREATE INDEX idx_farmers_member_no ON farmers(member_no);

-- -----------------------------------------------------------------------------
-- 3. DELIVERIES TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE deliveries (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  weight NUMERIC(10, 2) NOT NULL CHECK (weight > 0),
  receipt_no VARCHAR(50) UNIQUE NOT NULL,
  quality VARCHAR(50) DEFAULT 'Good',
  notes TEXT,
  status VARCHAR(50) DEFAULT 'Processed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_deliveries_farmer_id ON deliveries(farmer_id);
CREATE INDEX idx_deliveries_date ON deliveries(date);
CREATE INDEX idx_deliveries_receipt_no ON deliveries(receipt_no);

-- -----------------------------------------------------------------------------
-- 4. TRANSACTIONS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  farmer_id INTEGER NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
  date DATE DEFAULT CURRENT_DATE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('Advance', 'Deduction', 'Payment')),
  amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_date ON transactions(date);

-- -----------------------------------------------------------------------------
-- 5. ANNOUNCEMENTS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE announcements (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  author VARCHAR(100) DEFAULT 'Management',
  priority VARCHAR(50) DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_date ON announcements(date);

-- -----------------------------------------------------------------------------
-- 6. FORMS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE forms (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  size VARCHAR(50),
  type VARCHAR(50) DEFAULT 'PDF',
  upload_date DATE DEFAULT CURRENT_DATE,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 7. SYSTEM SETTINGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  rate_per_kg NUMERIC(10, 2) NOT NULL DEFAULT 80.00,
  cooperative_fee NUMERIC(10, 2) NOT NULL DEFAULT 1200.00,
  loan_interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
  season_start DATE DEFAULT '2026-06-01',
  season_end DATE DEFAULT '2026-12-31',
  current_season VARCHAR(50) DEFAULT '2026',
  sms_notifications BOOLEAN DEFAULT TRUE,
  email_notifications BOOLEAN DEFAULT FALSE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 8. AUDIT LOGS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  user_name VARCHAR(255) NOT NULL,
  role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  details TEXT,
  ip VARCHAR(50) DEFAULT '127.0.0.1'
);

CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- -----------------------------------------------------------------------------
-- 9. PASSWORD RESETS TABLE
-- -----------------------------------------------------------------------------
CREATE TABLE password_resets (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(10) NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_password_resets_email ON password_resets(email);
CREATE INDEX idx_password_resets_code ON password_resets(code);

-- =============================================================================
-- SEED DATA
-- Default password for demo accounts is 'password' (bcrypt hash: $2a$10$wN9i0fX1i4h9hT2s.Nq4Oe3pWwG3m8jXmIvhLgU2mE/rK5n5S5c.O)
-- =============================================================================

-- Users
INSERT INTO users (id, name, email, password, role, status, created_at) VALUES
  (1, 'John Mwangi',    'farmer@kaliluni.com', 'password', 'farmer', 'Active', '2026-01-15 08:00:00+00'),
  (2, 'Jane Wanjiru',   'staff@kaliluni.com',  'password', 'staff',  'Active', '2026-01-10 08:00:00+00'),
  (3, 'Admin Kaliluni', 'admin@kaliluni.com',  'password', 'admin',  'Active', '2026-01-01 08:00:00+00');

-- Synchronize users sequence
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));

-- Farmers
INSERT INTO farmers (id, user_id, member_no, name, phone, location, total_delivered, status, join_date) VALUES
  (1, 1, 'KFCS-00123', 'John Mwangi',  '0712345678', 'Kathiani', 1245.00, 'Active', '2020-03-15'),
  (2, 4, 'KFCS-00124', 'Mary Wanjiku', '0723456789', 'Mitaboni',  890.00, 'Active', '2021-05-20'),
  (3, 5, 'KFCS-00125', 'Peter Kamau',  '0734567890', 'Kathiani', 1520.00, 'Active', '2019-11-10');

-- Synchronize farmers sequence
SELECT setval('farmers_id_seq', (SELECT MAX(id) FROM farmers));

-- Deliveries
INSERT INTO deliveries (id, farmer_id, date, weight, receipt_no, quality, notes, status) VALUES
  (1, 1, '2026-09-10', 78.00, 'KAL-2026-0480', 'Good',      'Ripe cherry intake', 'Processed'),
  (2, 2, '2026-09-10', 92.00, 'KAL-2026-0481', 'Excellent', 'Top grade cherries', 'Processed'),
  (3, 3, '2026-09-10', 65.00, 'KAL-2026-0482', 'Good',      'Standard morning delivery', 'Processed');

-- Synchronize deliveries sequence
SELECT setval('deliveries_id_seq', (SELECT MAX(id) FROM deliveries));

-- Transactions
INSERT INTO transactions (id, farmer_id, date, type, amount, description, status) VALUES
  (1, 1, '2026-09-08', 'Advance',   10000.00, 'School fees', 'Completed'),
  (2, 3, '2026-09-07', 'Deduction',  2500.00, 'Fertilizer',  'Completed'),
  (3, 2, '2026-09-05', 'Advance',    5000.00, 'Medical',     'Completed');

-- Synchronize transactions sequence
SELECT setval('transactions_id_seq', (SELECT MAX(id) FROM transactions));

-- Announcements
INSERT INTO announcements (id, title, content, date, author, priority) VALUES
  (1, 'Payment Schedule 2026 Season', 'Farmers will receive payments starting September 15th, 2026.', '2026-09-10', 'Management', 'high'),
  (2, 'Fertilizer Distribution', 'Fertilizer will be available at the factory from September 20th.', '2026-09-08', 'Management', 'normal'),
  (3, 'Annual General Meeting', 'The AGM will be held on October 5th, 2026 at Kaliluni Factory.', '2026-09-05', 'Secretary', 'normal');

-- Synchronize announcements sequence
SELECT setval('announcements_id_seq', (SELECT MAX(id) FROM announcements));

-- Forms
INSERT INTO forms (id, title, description, size, type, upload_date) VALUES
  (1, 'Loan Application Form',     'Apply for a farmer advance loan',       '245 KB', 'PDF', '2026-01-15'),
  (2, 'Membership Application',    'Join Kaliluni Farmers Cooperative',     '180 KB', 'PDF', '2026-01-10'),
  (3, 'Input Request Form',        'Request fertilizers or pesticides',     '210 KB', 'PDF', '2026-02-05'),
  (4, 'Payment Query Form',        'Raise a payment-related complaint',     '150 KB', 'PDF', '2026-03-12');

-- Synchronize forms sequence
SELECT setval('forms_id_seq', (SELECT MAX(id) FROM forms));

-- System Settings
INSERT INTO settings (id, rate_per_kg, cooperative_fee, loan_interest_rate, season_start, season_end, current_season, sms_notifications, email_notifications, maintenance_mode)
VALUES (1, 80.00, 1200.00, 5.00, '2026-06-01', '2026-12-31', '2026', TRUE, FALSE, FALSE);

-- Synchronize settings sequence
SELECT setval('settings_id_seq', 1);

-- Audit Logs
INSERT INTO audit_logs (id, timestamp, user_name, role, action, details, ip) VALUES
  (1, '2026-09-10 08:15:00+00', 'John Mwangi', 'farmer', 'LOGIN', 'Successful login', '192.168.1.10');

-- Synchronize audit_logs sequence
SELECT setval('audit_logs_id_seq', (SELECT MAX(id) FROM audit_logs));
