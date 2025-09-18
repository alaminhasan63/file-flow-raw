/*
  # Fix Profile Auto-Creation Trigger
  
  This migration updates the profile auto-creation trigger to work properly
  with the signup flow, regardless of email confirmation settings.
  
  ## Changes
  - Update trigger to create profiles immediately on signup
  - Handle both confirmed and unconfirmed users
*/

-- Update the profile creation function to handle immediate profile creation
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile immediately for all new users
  -- This handles both confirmed and unconfirmed email scenarios
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, COALESCE(NEW.email, NEW.raw_user_meta_data->>'email'), 'customer')
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    -- Update timestamp to show profile was refreshed
    created_at = CASE 
      WHEN profiles.email IS NULL OR profiles.email = '' 
      THEN NOW() 
      ELSE profiles.created_at 
    END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger fires on all user insertions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Also trigger on updates (for email confirmation)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (OLD.email_confirmed_at IS DISTINCT FROM NEW.email_confirmed_at OR
        OLD.confirmed_at IS DISTINCT FROM NEW.confirmed_at)
  EXECUTE FUNCTION create_user_profile();
