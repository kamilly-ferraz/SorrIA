
-- RLS: super_admin can manage all tenants
DROP POLICY IF EXISTS "Super admin read all tenants" ON public.tenants;
CREATE POLICY "Super admin read all tenants" ON public.tenants
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: super_admin can read all profiles
DROP POLICY IF EXISTS "Super admin read all profiles" ON public.profiles;
CREATE POLICY "Super admin read all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: super_admin can manage all user_roles
DROP POLICY IF EXISTS "Super admin manage all roles" ON public.user_roles;
CREATE POLICY "Super admin manage all roles" ON public.user_roles
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: super_admin can read all audit_logs
DROP POLICY IF EXISTS "Super admin read all audit_logs" ON public.audit_logs;
CREATE POLICY "Super admin read all audit_logs" ON public.audit_logs
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- RLS: super_admin can manage access_requests globally
DROP POLICY IF EXISTS "Super admin manage access_requests" ON public.access_requests;
CREATE POLICY "Super admin manage access_requests" ON public.access_requests
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
