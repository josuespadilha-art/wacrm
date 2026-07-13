-- Migration: Configurable lead retention thresholds per account
--
-- Adds two columns to `accounts`:
--   lead_at_risk_days:   days of inactivity before a lead is flagged as "at risk" (default 30)
--   lead_lost_days:      days of inactivity before a lead is considered "lost" (default 90)

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS lead_at_risk_days integer NOT NULL DEFAULT 30
    CHECK (lead_at_risk_days BETWEEN 1 AND 365);

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS lead_lost_days integer NOT NULL DEFAULT 90
    CHECK (lead_lost_days BETWEEN 1 AND 730);

NOTIFY pgrst, 'reload schema';
