-- Quick Admin User Creation Script
-- Email: admin@gmail.com
-- Password: 123@Admin

-- Step 1: First create the user through sign-up at /sign-up, then run this SQL

-- Step 2: Update the user's role to admin
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = 'FileFlow Admin'
WHERE email = 'admin@gmail.com';

-- Step 3: Verify the admin user was created
SELECT 
    email,
    role,
    full_name,
    created_at
FROM public.profiles
WHERE email = 'admin@gmail.com';
