-- ============================================
-- NOTIFICAÇÕES E AUDITORIA - Sistema SorrIA ERP
-- Contém: Notificações, Auditoria Logs
-- ============================================

-- Notificações table
CREATE TABLE public.notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('patient', 'appointment', 'stock', 'system')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notificacoes (multi-tenant)
CREATE POLICY "Users can read notificacoes of their tenant"
ON public.notificacoes FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR usuario_id = auth.uid());

CREATE POLICY "Users can insert notificacoes in their tenant"
ON public.notificacoes FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update notificacoes of their tenant"
ON public.notificacoes FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR usuario_id = auth.uid());

CREATE POLICY "Users can delete notificacoes of their tenant"
ON public.notificacoes FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()) OR usuario_id = auth.uid());

-- Auditoria logs table
CREATE TABLE public.auditoria_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  acao TEXT NOT NULL,
  entidade TEXT NOT NULL,
  entidade_id UUID,
  detalhes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auditoria_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for auditoria_logs (apenas admins)
CREATE POLICY "Admins can read audit logs"
ON public.auditoria_logs FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid()) 
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert audit logs"
ON public.auditoria_logs FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Indexes for notifications
CREATE INDEX idx_notificacoes_usuario ON public.notificacoes(usuario_id);
CREATE INDEX idx_notificacoes_tenant_id ON public.notificacoes(tenant_id);
CREATE INDEX idx_notificacoes_lida ON public.notificacoes(lida);
CREATE INDEX idx_notificacoes_created_at ON public.notificacoes(created_at DESC);
CREATE INDEX idx_auditoria_logs_tenant_id ON public.auditoria_logs(tenant_id);
CREATE INDEX idx_auditoria_logs_usuario ON public.auditoria_logs(usuario_id);
