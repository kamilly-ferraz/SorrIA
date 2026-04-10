-- Allow super_admin to insert profiles for users they create
DROP POLICY IF EXISTS "Super admin insert profiles" ON public.profiles;
CREATE POLICY "Super admin insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to delete profiles
DROP POLICY IF EXISTS "Super admin delete profiles" ON public.profiles;
CREATE POLICY "Super admin delete profiles"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Allow super_admin to update any profile
DROP POLICY IF EXISTS "Super admin update profiles" ON public.profiles;
CREATE POLICY "Super admin update profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Hide system tenant from super admin dashboard
-- (will filter in frontend instead)