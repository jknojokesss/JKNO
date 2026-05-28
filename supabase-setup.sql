-- Run these in your Supabase SQL editor to set up the database

-- Clients table (one row per business you manage)
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chart of accounts
CREATE TABLE accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','income','expense')),
  parent_id UUID REFERENCES accounts(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal entries (the core of the accounting engine)
CREATE TABLE journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal entry lines (debits and credits)
CREATE TABLE journal_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES journal_entries(id),
  account_id UUID REFERENCES accounts(id),
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  memo TEXT
);

-- Row level security: clients only see their own data
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;

-- Policy: users can only see data for their client
CREATE POLICY "clients_own_data" ON clients
  FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "accounts_by_client" ON accounts
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "entries_by_client" ON journal_entries
  FOR ALL USING (
    client_id IN (SELECT id FROM clients WHERE email = auth.jwt() ->> 'email')
  );

CREATE POLICY "lines_by_client" ON journal_lines
  FOR ALL USING (
    entry_id IN (
      SELECT je.id FROM journal_entries je
      JOIN clients c ON je.client_id = c.id
      WHERE c.email = auth.jwt() ->> 'email'
    )
  );

-- ── ADMIN SETUP (run these in Supabase SQL editor) ──────────────────────────

-- Admins table — only emails in here can access /admin
CREATE TABLE IF NOT EXISTS admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Insert yourself as admin (replace with your email)
INSERT INTO admins (email, name) VALUES ('jk@jknojokes.com', 'Jonathan');

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  reference TEXT,
  created_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Journal lines (debits and credits)
CREATE TABLE IF NOT EXISTS journal_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('asset','liability','equity','income','expense')),
  debit DECIMAL(12,2) DEFAULT 0,
  credit DECIMAL(12,2) DEFAULT 0,
  memo TEXT
);

-- Transactions table (for CSV imports and POS data)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT CHECK (type IN ('income','expense')),
  category TEXT,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Admins can see all data
CREATE POLICY "admins_all" ON clients FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "admins_entries" ON journal_entries FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "admins_lines" ON journal_lines FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY "admins_transactions" ON transactions FOR ALL
  USING (EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email'));

-- Clients can only see their own transactions
CREATE POLICY "clients_own_transactions" ON transactions FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.jwt() ->> 'email'));
