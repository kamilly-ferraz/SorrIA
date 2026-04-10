-- Create system tenant for super_admin users
INSERT INTO public.tenants (id, name, active)
VALUES ('00000000-0000-0000-0000-000000000000', 'Sistema SorrIA', true)
ON CONFLICT (id) DO NOTHING;

-- Update handle_new_user to handle missing tenant_id gracefully
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tenant_id UUID;
  _full_name TEXT;
BEGIN
  _tenant_id := NULLIF(NEW.raw_user_meta_data->>'tenant_id', '')::UUID;
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- If no tenant_id provided, use system tenant
  IF _tenant_id IS NULL THEN
    _tenant_id := '00000000-0000-0000-0000-000000000000'::UUID;
  END IF;
  
  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (NEW.id, _tenant_id, _full_name)
  ON CONFLICT DO NOTHING;
  
  -- First user in tenant gets admin role, others get dentist
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    JOIN public.profiles p ON p.user_id = ur.user_id 
    WHERE p.tenant_id = _tenant_id AND _tenant_id != '00000000-0000-0000-0000-000000000000'
  ) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin')
    ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dentist')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
