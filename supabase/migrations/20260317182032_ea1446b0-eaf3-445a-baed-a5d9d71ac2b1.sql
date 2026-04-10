
-- Add created_by to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_by uuid;

-- Add user_role, entity, entity_id, description, metadata to audit_logs
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS entity_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb;

-- Add active column to tenants for super_admin management
ALTER TABLE public.tenants ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;
