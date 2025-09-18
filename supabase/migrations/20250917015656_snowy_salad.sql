/*
  # Add EIN service column to filings table

  This migration adds a column to store EIN service selection for filings.

  ## New Column
  1. ein_service - Boolean field to store whether user wants FileFlow to obtain EIN

  ## Security
  - No RLS changes needed as this is just a new column on existing table
*/

-- Add EIN service column to filings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'ein_service'
  ) THEN
    ALTER TABLE filings ADD COLUMN ein_service BOOLEAN DEFAULT FALSE;
  END IF;
END $$;