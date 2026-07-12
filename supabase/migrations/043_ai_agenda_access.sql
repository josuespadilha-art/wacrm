-- Migration: Add agenda access toggle to ai_configs

ALTER TABLE ai_configs ADD COLUMN IF NOT EXISTS agenda_access_enabled boolean NOT NULL DEFAULT false;

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
