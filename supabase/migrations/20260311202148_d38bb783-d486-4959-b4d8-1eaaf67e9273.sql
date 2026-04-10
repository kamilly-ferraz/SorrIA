
-- Fix overly permissive RLS policies on core tables
-- Replace "Allow all for anon" and "Allow all for authenticated" with tenant-scoped policies

-- PATIENTS
DROP POLICY IF EXISTS "Allow all for anon" ON public.patients;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.patients;

CREATE POLICY "Tenant isolation for patients" ON public.patients
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- OFFICES
DROP POLICY IF EXISTS "Allow all for anon" ON public.offices;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.offices;

CREATE POLICY "Tenant isolation for offices" ON public.offices
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- PROCEDURE_TYPES
DROP POLICY IF EXISTS "Allow all for anon" ON public.procedure_types;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.procedure_types;

CREATE POLICY "Tenant isolation for procedure_types" ON public.procedure_types
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- APPOINTMENTS
DROP POLICY IF EXISTS "Allow all for anon" ON public.appointments;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.appointments;

CREATE POLICY "Tenant isolation for appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- TENANTS
DROP POLICY IF EXISTS "Allow all for anon" ON public.tenants;
DROP POLICY IF EXISTS "Allow all for authenticated" ON public.tenants;

CREATE POLICY "Users can read own tenant" ON public.tenants
  FOR SELECT TO authenticated
  USING (id = get_user_tenant_id(auth.uid()));

CREATE POLICY "Anon can create tenant for signup" ON public.tenants
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can create tenant" ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (true);
