-- ============================================================
-- 038_sales_contact_id.sql
--
-- Add contact_id to sales table to track which customer made
-- a purchase, enabling customer-scoped sales history and analytics.
-- ============================================================

ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_contact_id ON sales(contact_id);
