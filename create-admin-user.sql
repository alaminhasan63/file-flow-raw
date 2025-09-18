-- Script to create an admin user for FileFlow
-- Run this after starting Supabase locally

-- First, let's create the admin user in the auth.users table
-- You'll need to run this through the Supabase dashboard or CLI

-- Example admin credentials:
-- Email: admin@fileflow.com
-- Password: Admin123!FileFlow

-- After creating the user through sign-up, update their role to admin:
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@fileflow.com';

-- Alternative: If you want to create multiple admin users:
-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email IN ('admin@fileflow.com', 'ops@fileflow.com');

-- Verify the admin user was created:
SELECT id, email, role, created_at 
FROM profiles 
WHERE role IN ('admin', 'ops');
