
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'dentist');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles per security requirements)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Dental records table (odontogram)
CREATE TABLE public.dental_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  tooth_number INTEGER NOT NULL CHECK (tooth_number BETWEEN 11 AND 48),
  diagnosis TEXT NOT NULL,
  notes TEXT,
  dentist_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinical records table (attendance records)
CREATE TABLE public.clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  chief_complaint TEXT,
  clinical_history TEXT,
  observations TEXT,
  diagnosis TEXT,
  treatment TEXT,
  dentist_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient files table
CREATE TABLE public.patient_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all profiles in tenant" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_user_tenant_id(auth.uid())
    AND public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Service role insert profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS policies for user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles in tenant" ON public.user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = public.user_roles.user_id
        AND p.tenant_id = public.get_user_tenant_id(auth.uid())
    )
    AND public.has_role(auth.uid(), 'admin')
  );

-- RLS for dental_records
ALTER TABLE public.dental_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for dental_records" ON public.dental_records
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS for clinical_records  
ALTER TABLE public.clinical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for clinical_records" ON public.clinical_records
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- RLS for patient_files
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for patient_files" ON public.patient_files
  FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tenant_id UUID;
  _full_name TEXT;
BEGIN
  _tenant_id := (NEW.raw_user_meta_data->>'tenant_id')::UUID;
  _full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  INSERT INTO public.profiles (user_id, tenant_id, full_name)
  VALUES (NEW.id, _tenant_id, _full_name);
  
  -- First user in tenant gets admin role, others get dentist
  IF NOT EXISTS (SELECT 1 FROM public.user_roles ur JOIN public.profiles p ON p.user_id = ur.user_id WHERE p.tenant_id = _tenant_id) THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'dentist');
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing table RLS policies to use tenant isolation via auth
-- Keep anon policies for the API edge function, add proper auth policies

-- Storage bucket for patient files
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-files', 'patient-files', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload patient files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'patient-files');

CREATE POLICY "Authenticated users can read patient files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'patient-files');

CREATE POLICY "Authenticated users can delete patient files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'patient-files');
