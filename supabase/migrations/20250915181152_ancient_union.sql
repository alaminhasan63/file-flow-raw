/*
  # FileFlow Initial Schema

  This migration creates the complete database schema for the LLC formation SaaS application.

  ## New Tables
  1. profiles - User profiles with role-based access
  2. businesses - Business entities being formed
  3. filings - Individual filing requests with stages
  4. filing_tasks - Task tracking for each filing
  5. documents - Document storage metadata
  6. packages - Formation packages (Basic, Premium, etc.)
  7. addons - Add-on services (EIN, Registered Agent, etc.)
  8. state_pricing - Pricing per state and package
  9. filing_addons - Many-to-many relationship between filings and addons
  10. payments - Payment tracking
  11. messages - Customer-staff communication
  12. webhooks - Webhook event logging
  13. states - State information and requirements
  14. state_adapters - State-specific configuration for automation

  ## Security
  - Row Level Security (RLS) enabled on all tables
  - Customers can only access their own data
  - Admins and ops can access all data
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin', 'ops')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Businesses table
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  dba TEXT,
  formation_state TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('LLC', 'CORP', 'NONPROFIT', 'OTHER')),
  foreign_qual_state TEXT,
  formation_package_id UUID,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;

-- States table
CREATE TABLE IF NOT EXISTS states (
  code TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  requires_ra BOOLEAN DEFAULT FALSE,
  notes TEXT
);

ALTER TABLE states ENABLE ROW LEVEL SECURITY;

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  base_price_cents INTEGER NOT NULL DEFAULT 0,
  includes JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

-- Addons table
CREATE TABLE IF NOT EXISTS addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  code TEXT UNIQUE NOT NULL
);

ALTER TABLE addons ENABLE ROW LEVEL SECURITY;

-- State pricing table
CREATE TABLE IF NOT EXISTS state_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL REFERENCES states(code) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  govt_fee_cents INTEGER NOT NULL DEFAULT 0,
  surcharge_cents INTEGER DEFAULT 0
);

ALTER TABLE state_pricing ENABLE ROW LEVEL SECURITY;

-- Filings table
CREATE TABLE IF NOT EXISTS filings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'intake' CHECK (stage IN ('intake', 'ready', 'queued', 'submitting', 'submitted', 'approved', 'rejected', 'needs_info', 'failed')),
  state_code TEXT NOT NULL REFERENCES states(code),
  filing_type TEXT NOT NULL CHECK (filing_type IN ('LLC_FORMATION', 'ANNUAL_REPORT', 'EIN', 'AMENDMENT')),
  quoted_total_cents INTEGER NOT NULL DEFAULT 0,
  paid_total_cents INTEGER DEFAULT 0,
  external_ref JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE filings ENABLE ROW LEVEL SECURITY;

-- Filing tasks table
CREATE TABLE IF NOT EXISTS filing_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'blocked', 'done', 'error')),
  payload JSONB,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE filing_tasks ENABLE ROW LEVEL SECURITY;

-- Filing addons table (many-to-many)
CREATE TABLE IF NOT EXISTS filing_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE CASCADE,
  qty INTEGER DEFAULT 1
);

ALTER TABLE filing_addons ENABLE ROW LEVEL SECURITY;

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('receipt', 'articles', 'operating_agreement', 'ein_letter', 'misc')),
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_id UUID NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  provider TEXT NOT NULL DEFAULT 'stripe' CHECK (provider IN ('stripe', 'manual', 'test')),
  provider_ref TEXT,
  amount_cents INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filing_id UUID REFERENCES filings(id) ON DELETE CASCADE,
  from_role TEXT NOT NULL CHECK (from_role IN ('customer', 'staff')),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  event TEXT NOT NULL,
  status INTEGER DEFAULT 200,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

-- State adapters table
CREATE TABLE IF NOT EXISTS state_adapters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL REFERENCES states(code) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}'::jsonb,
  last_healthcheck_at TIMESTAMPTZ
);

ALTER TABLE state_adapters ENABLE ROW LEVEL SECURITY;

-- Add foreign key constraints
ALTER TABLE businesses ADD CONSTRAINT businesses_formation_package_id_fkey 
  FOREIGN KEY (formation_package_id) REFERENCES packages(id);

-- RLS Policies

-- Profiles policies
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Admins can read all profiles" ON profiles FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
CREATE POLICY "Allow profile creation on signup" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Businesses policies
CREATE POLICY "Users can read own businesses" ON businesses FOR SELECT TO authenticated USING (
  owner_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
CREATE POLICY "Users can create own businesses" ON businesses FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update own businesses" ON businesses FOR UPDATE TO authenticated USING (
  owner_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Filings policies
CREATE POLICY "Users can read own filings" ON filings FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
CREATE POLICY "Users can create filings for own businesses" ON filings FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM businesses WHERE id = business_id AND owner_id = auth.uid())
);
CREATE POLICY "Admins can update all filings" ON filings FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Filing tasks policies
CREATE POLICY "Users can read tasks for own filings" ON filing_tasks FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM filings f 
    JOIN businesses b ON f.business_id = b.id 
    WHERE f.id = filing_id AND (b.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops')))
  )
);
CREATE POLICY "Admins can manage filing tasks" ON filing_tasks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Documents policies
CREATE POLICY "Users can read own documents" ON documents FOR SELECT TO authenticated USING (
  owner_id = auth.uid() OR 
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
CREATE POLICY "Users can create own documents" ON documents FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Admins can manage all documents" ON documents FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Public read policies for reference tables
CREATE POLICY "Allow public read access to packages" ON packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to addons" ON addons FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to states" ON states FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow public read access to state_pricing" ON state_pricing FOR SELECT TO authenticated USING (true);

-- Payments policies
CREATE POLICY "Users can read payments for own filings" ON payments FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM filings f 
    JOIN businesses b ON f.business_id = b.id 
    WHERE f.id = filing_id AND (b.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops')))
  )
);
CREATE POLICY "Admins can manage all payments" ON payments FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Messages policies
CREATE POLICY "Users can read messages for own filings" ON messages FOR SELECT TO authenticated USING (
  filing_id IS NULL OR EXISTS (
    SELECT 1 FROM filings f 
    JOIN businesses b ON f.business_id = b.id 
    WHERE f.id = filing_id AND (b.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops')))
  )
);
CREATE POLICY "Users can create messages" ON messages FOR INSERT TO authenticated WITH CHECK (sender_id = auth.uid());
CREATE POLICY "Admins can manage all messages" ON messages FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Webhooks - admin only
CREATE POLICY "Admins can manage webhooks" ON webhooks FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- State adapters - admin only
CREATE POLICY "Admins can manage state adapters" ON state_adapters FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Filing addons policies
CREATE POLICY "Users can read addons for own filings" ON filing_addons FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM filings f 
    JOIN businesses b ON f.business_id = b.id 
    WHERE f.id = filing_id AND (b.owner_id = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops')))
  )
);
CREATE POLICY "Users can manage addons for own filings" ON filing_addons FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM filings f 
    JOIN businesses b ON f.business_id = b.id 
    WHERE f.id = filing_id AND b.owner_id = auth.uid()
  ) OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for filing_tasks updated_at
CREATE TRIGGER update_filing_tasks_updated_at BEFORE UPDATE ON filing_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();