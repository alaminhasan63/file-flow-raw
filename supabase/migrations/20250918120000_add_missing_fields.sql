/*
  # Add Missing Fields for Public Filing Flow
  
  This migration adds missing fields that are needed for the public filing wizard:
  1. Address fields to businesses table
  2. user_id field to filings table for RLS compatibility
  
  ## New Columns
  - businesses.address_line1 - Street address
  - businesses.address_city - City
  - businesses.address_region - State/Region
  - businesses.address_postal - ZIP/Postal code
  - filings.user_id - User ID for RLS (references profiles.id)
  
  ## Security
  - No RLS changes needed as these are just new columns on existing tables
*/

-- Add address fields to businesses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_line1'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_line1 TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_city'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_city TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_region'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_region TEXT;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'businesses' AND column_name = 'address_postal'
  ) THEN
    ALTER TABLE businesses ADD COLUMN address_postal TEXT;
  END IF;
END $$;

-- Add user_id field to filings table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'filings' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE filings ADD COLUMN user_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update existing filings to have user_id based on business owner
UPDATE filings 
SET user_id = businesses.owner_id 
FROM businesses 
WHERE filings.business_id = businesses.id 
AND filings.user_id IS NULL;
