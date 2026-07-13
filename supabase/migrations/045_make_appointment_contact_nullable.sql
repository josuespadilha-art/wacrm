-- 045_make_appointment_contact_nullable.sql
ALTER TABLE appointments ALTER COLUMN contact_id DROP NOT NULL;
