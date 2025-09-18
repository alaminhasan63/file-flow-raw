-- FileFlow Database Seed Data
-- This file creates initial data for development including admin user

-- Create admin user profile directly
-- Note: You'll need to create the auth user first through sign-up, then run this

-- Method 1: If auth user already exists, just update the profile
UPDATE public.profiles 
SET 
    role = 'admin',
    full_name = 'FileFlow Admin'
WHERE email = 'admin@gmail.com';

-- Method 2: Insert admin profile if it doesn't exist
INSERT INTO public.profiles (id, email, role, full_name)
SELECT 
    u.id,
    'admin@gmail.com',
    'admin',
    'FileFlow Admin'
FROM auth.users u 
WHERE u.email = 'admin@gmail.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'FileFlow Admin';

-- Insert sample states data
INSERT INTO states (code, display_name, requires_ra) VALUES
    ('WY', 'Wyoming', false),
    ('DE', 'Delaware', true),
    ('NV', 'Nevada', true),
    ('TX', 'Texas', false),
    ('FL', 'Florida', false),
    ('CA', 'California', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample packages
INSERT INTO packages (id, name, description, base_price_cents) VALUES
    (gen_random_uuid(), 'Basic', 'Essential LLC formation package', 29900),
    (gen_random_uuid(), 'Premium', 'Complete LLC formation with extras', 49900)
ON CONFLICT (id) DO NOTHING;

-- Insert sample addons
INSERT INTO addons (id, name, description, price_cents, code) VALUES
    (gen_random_uuid(), 'EIN Service', 'Federal Tax ID application', 7900, 'ein'),
    (gen_random_uuid(), 'Operating Agreement', 'Custom operating agreement template', 5000, 'oa'),
    (gen_random_uuid(), 'Registered Agent', 'Registered agent service (1 year)', 9900, 'ra'),
    (gen_random_uuid(), 'Mail Forwarding', 'Mail forwarding service (1 year)', 19900, 'mail')
ON CONFLICT (code) DO NOTHING;

-- Verify admin user
SELECT 
    p.email,
    p.role,
    p.full_name,
    p.created_at
FROM public.profiles p
WHERE p.email = 'admin@gmail.com' AND p.role = 'admin';
