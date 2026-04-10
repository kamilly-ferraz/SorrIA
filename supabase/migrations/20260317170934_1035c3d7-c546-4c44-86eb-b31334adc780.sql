
-- 1. Add dentist_id to patients
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS dentist_id uuid;

-- 2. Add check_in_at and check_out_at to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS check_in_at timestamptz;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS check_out_at timestamptz;

-- 3. Add confirmed and no_show to appointment_status enum
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'confirmed';
ALTER TYPE public.appointment_status ADD VALUE IF NOT EXISTS 'no_show';

-- 4. Create access_requests table
CREATE TABLE IF NOT EXISTS public.access_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text,
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- RLS: Admins can manage access requests in their tenant
CREATE POLICY "Admins manage access_requests" ON public.access_requests
FOR ALL TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));

-- RLS: Anyone can insert access requests (public form)
CREATE POLICY "Anyone can request access" ON public.access_requests
FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- 5. Update patients RLS: Allow dentist to manage patients they created
DROP POLICY IF EXISTS "Dentist own patients" ON public.patients;
CREATE POLICY "Dentist own patients" ON public.patients
FOR SELECT TO authenticated
USING (
  tenant_id = get_user_tenant_id(auth.uid()) AND (
    dentist_id = auth.uid() OR
    id IN (SELECT DISTINCT a.patient_id FROM appointments a WHERE a.dentist_id = auth.uid())
  )
);

-- Allow dentists to update their own patients
DROP POLICY IF EXISTS "Dentist update patients" ON public.patients;
CREATE POLICY "Dentist update patients" ON public.patients
FOR UPDATE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (dentist_id = auth.uid() OR id IN (SELECT DISTINCT a.patient_id FROM appointments a WHERE a.dentist_id = auth.uid())))
WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));

-- Allow dentists to delete their own patients
DROP POLICY IF EXISTS "Dentist delete patients" ON public.patients;
CREATE POLICY "Dentist delete patients" ON public.patients
FOR DELETE TO authenticated
USING (tenant_id = get_user_tenant_id(auth.uid()) AND (dentist_id = auth.uid() OR id IN (SELECT DISTINCT a.patient_id FROM appointments a WHERE a.dentist_id = auth.uid())));
