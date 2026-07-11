-- ============================================================
-- 037_sales.sql
--
-- Sales tracking table to record product sales with quantity
-- and value for analytics and reporting.
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Tenancy. Every member of the account shares its sales data.
  account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  -- Author / audit only — never used for tenancy isolation.
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- Sales reference
  sale_number TEXT,
  description TEXT,
  total_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity DECIMAL(12, 2) NOT NULL DEFAULT 1.00,
  unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  total_value DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_account ON sales(account_id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_created_at ON sales(created_at);
CREATE INDEX IF NOT EXISTS idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_product_id ON sales_items(product_id);
CREATE INDEX IF NOT EXISTS idx_sales_items_created_at ON sales_items(created_at);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;

-- Account-scoped policies: any member can read; agent+ can create/edit/delete.
DROP POLICY IF EXISTS sales_select ON sales;
DROP POLICY IF EXISTS sales_insert ON sales;
DROP POLICY IF EXISTS sales_update ON sales;
DROP POLICY IF EXISTS sales_delete ON sales;

CREATE POLICY sales_select ON sales FOR SELECT
  USING (is_account_member(account_id));

CREATE POLICY sales_insert ON sales FOR INSERT
  WITH CHECK (is_account_member(account_id, 'agent'));

CREATE POLICY sales_update ON sales FOR UPDATE
  USING (is_account_member(account_id, 'agent'));

CREATE POLICY sales_delete ON sales FOR DELETE
  USING (is_account_member(account_id, 'agent'));

-- Sales items inherit account access through sales
DROP POLICY IF EXISTS sales_items_select ON sales_items;
DROP POLICY IF EXISTS sales_items_insert ON sales_items;
DROP POLICY IF EXISTS sales_items_update ON sales_items;
DROP POLICY IF EXISTS sales_items_delete ON sales_items;

CREATE POLICY sales_items_select ON sales_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM sales WHERE id = sale_id AND is_account_member(account_id)
  ));

CREATE POLICY sales_items_insert ON sales_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales WHERE id = sale_id AND is_account_member(account_id, 'agent')
  ));

CREATE POLICY sales_items_update ON sales_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM sales WHERE id = sale_id AND is_account_member(account_id, 'agent')
  ));

CREATE POLICY sales_items_delete ON sales_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM sales WHERE id = sale_id AND is_account_member(account_id, 'agent')
  ));

-- Auto-update timestamp
DROP TRIGGER IF EXISTS set_updated_at ON sales;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
