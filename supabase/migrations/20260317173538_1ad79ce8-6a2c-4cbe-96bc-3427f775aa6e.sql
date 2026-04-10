
-- Fix access_requests RLS: admin can see requests where tenant_id matches OR is NULL
DROP POLICY IF EXISTS "Admins manage access_requests" ON public.access_requests;
CREATE POLICY "Admins manage access_requests" ON public.access_requests
FOR ALL TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) AND 
  (tenant_id IS NULL OR tenant_id = get_user_tenant_id(auth.uid()))
);
