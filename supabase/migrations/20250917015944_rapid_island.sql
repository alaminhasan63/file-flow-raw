/*
  # Add Mail Forwarding column to filings table

  This migration adds a column to store mail forwarding service selection for filings.

  ## New Column
  1. mail_forwarding - Boolean field to store whether user wants FileFlow mail forwarding service

  ## Security
  - No RLS changes needed as this is just a new column on existing table
*/

-- Add mail forwarding column to filings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'mail_forwarding'
  ) THEN
    ALTER TABLE filings ADD COLUMN mail_forwarding BOOLEAN DEFAULT FALSE;
  END IF;
END $$;