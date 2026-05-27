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
