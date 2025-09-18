/*
  # Allow Public Access to States Table
  
  This migration allows unauthenticated users to read from the states table,
  which is needed for the public filing wizard to show available states.
  
  ## Security Changes
  - Add policy to allow public read access to states table
*/

-- Allow unauthenticated users to read states
CREATE POLICY "Allow public read access to states" ON states 
FOR SELECT TO anon USING (true);
