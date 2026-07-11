-- Migration: 039_contact_birth_date.sql
-- Description: Adds a `birth_date` column to the `contacts` table for birthday automations.

ALTER TABLE contacts
ADD COLUMN birth_date DATE;
