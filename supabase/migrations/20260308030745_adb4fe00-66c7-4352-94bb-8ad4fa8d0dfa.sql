
-- Create appointment status enum
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled');

-- Tenants table
CREATE TABLE public.tenants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offices table
CREATE TABLE public.offices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true
);

-- Procedure types table
CREATE TABLE public.procedure_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  active BOOLEAN NOT NULL DEFAULT true
);

-- Appointments table
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  office_id UUID NOT NULL REFERENCES public.offices(id) ON DELETE CASCADE,
  procedure_type_id UUID NOT NULL REFERENCES public.procedure_types(id) ON DELETE CASCADE,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status public.appointment_status NOT NULL DEFAULT 'scheduled',
  notes TEXT,
  google_calendar_event_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_patients_tenant ON public.patients(tenant_id);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_name ON public.patients(name);
CREATE INDEX idx_offices_tenant ON public.offices(tenant_id);
CREATE INDEX idx_procedure_types_tenant ON public.procedure_types(tenant_id);
CREATE INDEX idx_appointments_tenant ON public.appointments(tenant_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_office_date ON public.appointments(office_id, appointment_date);

-- RLS policies - For now, allow all authenticated users access (multi-tenant filtering done in app)
-- In production, you'd use a user-tenant mapping table

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (tenant filtering at app level)
CREATE POLICY "Allow all for authenticated" ON public.tenants FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.patients FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.offices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.procedure_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON public.appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Also allow anon access for API endpoints (n8n integration)
CREATE POLICY "Allow all for anon" ON public.tenants FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.patients FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.offices FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.procedure_types FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.appointments FOR ALL TO anon USING (true) WITH CHECK (true);

-- Insert a default tenant for development
INSERT INTO public.tenants (id, name) VALUES ('00000000-0000-0000-0000-000000000001', 'Clínica Demo SorrIA');

-- Insert sample offices
INSERT INTO public.offices (tenant_id, name) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Consultório 1'),
  ('00000000-0000-0000-0000-000000000001', 'Consultório 2');

-- Insert sample procedure types
INSERT INTO public.procedure_types (tenant_id, name, duration, price, color) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Limpeza', 30, 150.00, '#10B981'),
  ('00000000-0000-0000-0000-000000000001', 'Restauração', 45, 250.00, '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', 'Extração', 60, 350.00, '#EF4444'),
  ('00000000-0000-0000-0000-000000000001', 'Canal', 90, 800.00, '#F59E0B'),
  ('00000000-0000-0000-0000-000000000001', 'Clareamento', 60, 500.00, '#8B5CF6');
