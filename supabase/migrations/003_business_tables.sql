-- ============================================
-- TABELAS DE NEGÓCIOS - Sistema SorrIA ERP
-- Contém: Financeiro, Estoque, Metas
-- ============================================

-- Financeiro table
CREATE TABLE public.financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida')),
  valor NUMERIC(12,2) NOT NULL,
  descricao TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financeiro ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financeiro (multi-tenant)
CREATE POLICY "Users can read financeiro of their tenant"
ON public.financeiro FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert financeiro in their tenant"
ON public.financeiro FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update financeiro of their tenant"
ON public.financeiro FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete financeiro of their tenant"
ON public.financeiro FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Estoque table (IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS public.estoque (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  item TEXT NOT NULL,
  quantidade INTEGER NOT NULL DEFAULT 0,
  nivel_alerta INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.estoque ENABLE ROW LEVEL SECURITY;

-- RLS Policies for estoque (multi-tenant)
CREATE POLICY "Users can read estoque of their tenant"
ON public.estoque FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert estoque in their tenant"
ON public.estoque FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update estoque of their tenant"
ON public.estoque FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete estoque of their tenant"
ON public.estoque FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Metas table
CREATE TABLE public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL 
    CHECK (tipo IN ('faturamento_diario', 'faturamento_mensal', 'pacientes_dia', 'pacientes_mes')),
  valor NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for metas (multi-tenant)
CREATE POLICY "Users can read metas of their tenant"
ON public.metas FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert metas in their tenant"
ON public.metas FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update metas of their tenant"
ON public.metas FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete metas of their tenant"
ON public.metas FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Trigger for updating updated_at on metas
CREATE OR REPLACE FUNCTION update_metas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_metas_updated_at ON metas;
CREATE TRIGGER update_metas_updated_at
  BEFORE UPDATE ON metas
  FOR EACH ROW
  EXECUTE FUNCTION update_metas_updated_at();

-- Indexes
CREATE INDEX idx_financeiro_data ON public.financeiro(data);
CREATE INDEX idx_financeiro_tenant_id ON public.financeiro(tenant_id);
CREATE INDEX idx_estoque_quantidade ON public.estoque(quantidade);
CREATE INDEX idx_estoque_tenant_id ON public.estoque(tenant_id);
CREATE INDEX idx_metas_tenant_id ON public.metas(tenant_id);
CREATE INDEX idx_metas_usuario ON public.metas(usuario_id);
