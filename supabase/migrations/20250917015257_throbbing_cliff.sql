/*
  # Add Registered Agent columns to filings table

  This migration adds columns to store registered agent information for filings.

  ## New Columns
  1. registered_agent_provider - Text field to store provider type ("fileflow" or "custom")
  2. registered_agent_address - JSONB field to store agent address information

  ## Security
  - No RLS changes needed as these are just new columns on existing table
*/

-- Add registered agent columns to filings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'registered_agent_provider'
  ) THEN
    ALTER TABLE filings ADD COLUMN registered_agent_provider TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'registered_agent_address'
  ) THEN
    ALTER TABLE filings ADD COLUMN registered_agent_address JSONB;
  END IF;
END $$;