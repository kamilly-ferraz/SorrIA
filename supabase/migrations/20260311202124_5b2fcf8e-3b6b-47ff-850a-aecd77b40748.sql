
-- Add LGPD consent fields to patients
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS lgpd_consent boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS lgpd_consent_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS lgpd_consent_ip text;

-- Create audit_logs table
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id text,
  ip_address text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs in tenant" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (tenant_id = get_user_tenant_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = get_user_tenant_id(auth.uid()));
