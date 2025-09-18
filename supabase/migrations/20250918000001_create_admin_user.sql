-- Create admin user directly in the database
-- Email: admin@gmail.com
-- Password: 123@Admin

-- Insert admin user into auth.users table
-- Note: This creates a confirmed user that can log in immediately
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  confirmation_sent_at,
  recovery_sent_at,
  email_change_sent_at,
  last_sign_in_at,
  confirmed_at
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'admin@gmail.com',
  crypt('123@Admin', gen_salt('bf')), -- Encrypted password
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  '',
  NOW(),
  NOW(),
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- Get the user ID for the admin user
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    -- Get the admin user ID
    SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@gmail.com';
    
    -- Insert admin profile
    INSERT INTO public.profiles (id, email, role, full_name)
    VALUES (
        admin_user_id,
        'admin@gmail.com',
        'admin',
        'FileFlow Admin'
    ) ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        email = 'admin@gmail.com',
        full_name = 'FileFlow Admin';
END $$;

-- Verify admin user was created
SELECT 
    u.email,
    p.role,
    p.full_name,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM auth.users u
JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@gmail.com';
