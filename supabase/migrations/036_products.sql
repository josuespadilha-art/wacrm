-- ============================================================
-- 036_products.sql
--
-- Products table for managing products with pricing and units.
-- Account-scoped, allowing team collaboration.
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Tenancy. Every member of the account shares its products.
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Author / audit only — never used for tenancy isolation.
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Product details
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  unit TEXT NOT NULL DEFAULT 'un', -- unit of measure (un, kg, l, etc.)
  cost DECIMAL(12, 2),
  stock DECIMAL(12, 2),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Ensure unique SKU per account
  UNIQUE(account_id, sku)
);

CREATE INDEX IF NOT EXISTS idx_products_account ON products(account_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Account-scoped policies: any member can read; agent+ can create/edit/delete.
DROP POLICY IF EXISTS products_select ON products;
DROP POLICY IF EXISTS products_insert ON products;
DROP POLICY IF EXISTS products_update ON products;
DROP POLICY IF EXISTS products_delete ON products;

CREATE POLICY products_select ON products FOR SELECT
  USING (is_account_member(account_id));

CREATE POLICY products_insert ON products FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));

CREATE POLICY products_update ON products FOR UPDATE
  USING (is_account_member(account_id, 'agent'));

CREATE POLICY products_delete ON products FOR DELETE
  USING (is_account_member(account_id, 'agent'));

-- Auto-update timestamp
DROP TRIGGER IF EXISTS set_updated_at ON products;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
