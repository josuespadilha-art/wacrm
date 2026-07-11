-- 040_appointments.sql

CREATE TABLE operating_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL, -- 0 = Domingo, 1 = Segunda, etc.
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_closed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(account_id, day_of_week)
);

-- Enable RLS
ALTER TABLE operating_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view operating hours of their accounts"
  ON operating_hours FOR SELECT
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage operating hours of their accounts"
  ON operating_hours FOR ALL
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')));


CREATE TABLE appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  assignee_id uuid REFERENCES account_members(id) ON DELETE SET NULL, -- Professional
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'canceled'
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Index for searching appointments by date
CREATE INDEX appointments_account_date_idx ON appointments (account_id, start_time);

-- Enable RLS
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage appointments of their accounts"
  ON appointments FOR ALL
  USING (account_id IN (SELECT account_id FROM account_members WHERE user_id = auth.uid()));
