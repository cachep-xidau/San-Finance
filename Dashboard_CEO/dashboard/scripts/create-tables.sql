-- S Group CEO Dashboard — Raw Data Tables
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Master Data (expense categories)
CREATE TABLE IF NOT EXISTS master_data (
  id SERIAL PRIMARY KEY,
  code TEXT,
  classify TEXT,
  category TEXT,
  expense_type TEXT
);

-- 2. Raw Revenue per clinic per day
CREATE TABLE IF NOT EXISTS raw_revenue (
  id SERIAL PRIMARY KEY,
  clinic TEXT NOT NULL,
  month TEXT,
  date TEXT,
  cash BIGINT DEFAULT 0,
  card BIGINT DEFAULT 0,
  card_net BIGINT DEFAULT 0,
  transfer BIGINT DEFAULT 0,
  installment BIGINT DEFAULT 0,
  deposit BIGINT DEFAULT 0,
  total BIGINT DEFAULT 0,
  total_net BIGINT DEFAULT 0
);

-- 3. Raw Expenses per clinic
CREATE TABLE IF NOT EXISTS raw_expenses (
  id SERIAL PRIMARY KEY,
  clinic TEXT NOT NULL,
  month TEXT,
  description TEXT,
  classify TEXT,
  amount BIGINT DEFAULT 0,
  cash_flow TEXT,
  finance TEXT
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_raw_revenue_clinic ON raw_revenue(clinic);
CREATE INDEX IF NOT EXISTS idx_raw_revenue_month ON raw_revenue(month);
CREATE INDEX IF NOT EXISTS idx_raw_expenses_clinic ON raw_expenses(clinic);
CREATE INDEX IF NOT EXISTS idx_raw_expenses_month ON raw_expenses(month);

-- 5. RLS policies
ALTER TABLE master_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE raw_expenses ENABLE ROW LEVEL SECURITY;

-- Read access for authenticated users
DROP POLICY IF EXISTS "auth_read_master_data" ON master_data;
CREATE POLICY "auth_read_master_data" ON master_data FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_read_raw_revenue" ON raw_revenue;
CREATE POLICY "auth_read_raw_revenue" ON raw_revenue FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "auth_read_raw_expenses" ON raw_expenses;
CREATE POLICY "auth_read_raw_expenses" ON raw_expenses FOR SELECT TO authenticated USING (true);
