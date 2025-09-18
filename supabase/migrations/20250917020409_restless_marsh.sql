/*
  # Update Registered Agent Schema

  This migration updates the filings table to use a simpler registered agent structure.

  ## New Columns
  1. registered_agent_address - Text field with default address
  2. use_fileflow_registered_agent - Boolean flag for FileFlow service

  ## Security
  - No RLS changes needed as these are just new columns on existing table
*/

-- Add registered_agent_address column with default address
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'registered_agent_address'
  ) THEN
    ALTER TABLE filings ADD COLUMN registered_agent_address TEXT DEFAULT '123 Main St, Cheyenne, WY 82001';
  END IF;
END $$;

-- Add use_fileflow_registered_agent column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'use_fileflow_registered_agent'
  ) THEN
    ALTER TABLE filings ADD COLUMN use_fileflow_registered_agent BOOLEAN DEFAULT FALSE;
  END IF;
END $$;