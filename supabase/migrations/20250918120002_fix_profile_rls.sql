/*
  # Fix Profile RLS Policy for Signup Flow
  
  This migration fixes the RLS policy issue that prevents profile creation
  during the signup process in the public filing wizard.
  
  ## Changes
  - Update the profile insertion policy to allow upserts during signup
  - Ensure the auto-create trigger works properly with manual profile creation
*/

-- Drop the existing profile creation policy
DROP POLICY IF EXISTS "Allow profile creation on signup" ON profiles;

-- Create a more permissive policy for profile creation that handles both
-- automatic creation (via trigger) and manual creation (via ensureUserProfile)
CREATE POLICY "Allow profile creation and upsert on signup" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK (
  auth.uid() = id OR 
  -- Allow service role to create profiles (for triggers)
  auth.jwt() ->> 'role' = 'service_role'
);

-- Also ensure UPDATE works for upserts
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
FOR UPDATE TO authenticated 
USING (
  auth.uid() = id OR 
  -- Allow admins to update any profile
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
)
WITH CHECK (
  auth.uid() = id OR 
  -- Allow admins to update any profile
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'ops'))
);
