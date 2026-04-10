-- Add dentist_id to appointments for LGPD filtering
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS dentist_id uuid;

-- Drop old permissive tenant-only policies and replace with LGPD-aware ones
-- appointments
DROP POLICY IF EXISTS "Tenant isolation for appointments" ON public.appointments;
CREATE POLICY "Admin full access appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Dentist own appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid())
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid());

-- clinical_records
DROP POLICY IF EXISTS "Tenant isolation for clinical_records" ON public.clinical_records;
CREATE POLICY "Admin full access clinical_records" ON public.clinical_records
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Dentist own clinical_records" ON public.clinical_records
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid())
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid());

-- dental_records
DROP POLICY IF EXISTS "Tenant isolation for dental_records" ON public.dental_records;
CREATE POLICY "Admin full access dental_records" ON public.dental_records
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Dentist own dental_records" ON public.dental_records
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid())
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND dentist_id = auth.uid());

-- patient_files: dentist sees files of patients they have appointments with
DROP POLICY IF EXISTS "Tenant isolation for patient_files" ON public.patient_files;
CREATE POLICY "Admin full access patient_files" ON public.patient_files
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Dentist own patient_files" ON public.patient_files
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND patient_id IN (
    SELECT DISTINCT a.patient_id FROM public.appointments a WHERE a.dentist_id = auth.uid()
  ))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND patient_id IN (
    SELECT DISTINCT a.patient_id FROM public.appointments a WHERE a.dentist_id = auth.uid()
  ));

-- patients: admin full, dentist sees patients linked via appointments
DROP POLICY IF EXISTS "Tenant isolation for patients" ON public.patients;
CREATE POLICY "Admin full access patients" ON public.patients
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'))
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));
CREATE POLICY "Dentist own patients" ON public.patients
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND id IN (
    SELECT DISTINCT a.patient_id FROM public.appointments a WHERE a.dentist_id = auth.uid()
  ));
CREATE POLICY "Dentist insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));