/*
  # Seed Data for FileFlow

  This migration adds initial seed data for development and testing.

  ## Data Added
  1. US States (focus on WY initially)
  2. Formation packages (Basic, Premium)
  3. Add-on services
  4. State pricing configuration
  5. State adapters configuration
*/

-- Insert US States (starting with key states)
INSERT INTO states (code, display_name, requires_ra, notes) VALUES
  ('WY', 'Wyoming', true, 'Business-friendly state with low fees'),
  ('DE', 'Delaware', false, 'Corporate-friendly jurisdiction'),
  ('NV', 'Nevada', true, 'No state income tax'),
  ('CA', 'California', false, 'High fees but large market'),
  ('TX', 'Texas', false, 'No state income tax, business-friendly'),
  ('FL', 'Florida', false, 'No state income tax')
ON CONFLICT (code) DO NOTHING;

-- Insert formation packages
INSERT INTO packages (id, name, description, base_price_cents, includes) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'Basic', 'Essential LLC formation services', 9900, '["Articles of Filing", "EIN Application", "Operating Agreement Template"]'),
  ('550e8400-e29b-41d4-a716-446655440001', 'Premium', 'Complete LLC formation with extras', 19900, '["Articles of Filing", "EIN Application", "Custom Operating Agreement", "Registered Agent (1 year)", "LLC Kit"]'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Express', 'Fast-track LLC formation', 29900, '["Expedited Filing", "Articles of Filing", "EIN Application", "Custom Operating Agreement", "Registered Agent (1 year)", "Priority Support"]')
ON CONFLICT (id) DO NOTHING;

-- Insert add-on services
INSERT INTO addons (id, name, description, price_cents, code) VALUES
  ('660e8400-e29b-41d4-a716-446655440000', 'Registered Agent (1 Year)', 'Professional registered agent service for one year', 9900, 'RA_1YEAR'),
  ('660e8400-e29b-41d4-a716-446655440001', 'EIN Application', 'Federal tax ID number application', 4900, 'EIN_APP'),
  ('660e8400-e29b-41d4-a716-446655440002', 'Custom Operating Agreement', 'Professionally drafted operating agreement', 9900, 'CUSTOM_OA'),
  ('660e8400-e29b-41d4-a716-446655440003', 'LLC Kit', 'Physical LLC kit with seal and certificates', 4900, 'LLC_KIT'),
  ('660e8400-e29b-41d4-a716-446655440004', 'Expedited Processing', 'Rush processing for faster filing', 9900, 'EXPEDITED')
ON CONFLICT (id) DO NOTHING;

-- Insert state pricing for Wyoming
INSERT INTO state_pricing (state_code, package_id, govt_fee_cents, surcharge_cents) VALUES
  ('WY', '550e8400-e29b-41d4-a716-446655440000', 10000, 0),
  ('WY', '550e8400-e29b-41d4-a716-446655440001', 10000, 0),
  ('WY', '550e8400-e29b-41d4-a716-446655440002', 15000, 0),
  ('DE', '550e8400-e29b-41d4-a716-446655440000', 9000, 0),
  ('DE', '550e8400-e29b-41d4-a716-446655440001', 9000, 0),
  ('DE', '550e8400-e29b-41d4-a716-446655440002', 15000, 0),
  ('NV', '550e8400-e29b-41d4-a716-446655440000', 7500, 0),
  ('NV', '550e8400-e29b-41d4-a716-446655440001', 7500, 0),
  ('NV', '550e8400-e29b-41d4-a716-446655440002', 12500, 0)
ON CONFLICT DO NOTHING;

-- Insert state adapters configuration
INSERT INTO state_adapters (state_code, enabled, config) VALUES
  ('WY', true, '{"filing_url": "https://wyobiz.wy.gov", "processing_time_days": 3, "expedited_available": true}'),
  ('DE', false, '{"filing_url": "https://corp.delaware.gov", "processing_time_days": 7, "expedited_available": true}'),
  ('NV', false, '{"filing_url": "https://www.nvsos.gov", "processing_time_days": 5, "expedited_available": false}')
ON CONFLICT DO NOTHING;