-- ============================================
-- ATENDIMENTOS E PRONTUÁRIO - Sistema SorrIA ERP
-- Contém: Atendimentos (Anamnese)
-- ============================================

-- Atendimentos table (Medical Records)
CREATE TABLE public.atendimentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  agendamento_id UUID REFERENCES public.agendamentos(id) ON DELETE SET NULL,
  profissional_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  data_atendimento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  queixa_principal TEXT NOT NULL,
  historico_br VARCHAR(500),
  observacoes_clinicas TEXT,
  conduta TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.atendimentos ENABLE ROW LEVEL SECURITY;

-- RLS Policy for atendimentos (multi-tenant)
CREATE POLICY "Users can read atendimentos of their tenant"
ON public.atendimentos FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR profissional_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert atendimentos in their tenant"
ON public.atendimentos FOR INSERT
TO authenticated
WITH CHECK (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR profissional_id = auth.uid()
);

CREATE POLICY "Users can update atendimentos of their tenant"
ON public.atendimentos FOR UPDATE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR profissional_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete atendimentos of their tenant"
ON public.atendimentos FOR DELETE
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_atendimentos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_atendimentos_updated_at ON atendimentos;
CREATE TRIGGER update_atendimentos_updated_at
  BEFORE UPDATE ON atendimentos
  FOR EACH ROW
  EXECUTE FUNCTION update_atendimentos_updated_at();

-- Indexes
CREATE INDEX idx_atendimentos_paciente ON public.atendimentos(paciente_id);
CREATE INDEX idx_atendimentos_data ON public.atendimentos(data_atendimento);
CREATE INDEX idx_atendimentos_tenant_id ON public.atendimentos(tenant_id);
CREATE INDEX idx_atendimentos_profissional ON public.atendimentos(profissional_id);

-- Comments
COMMENT ON TABLE atendimentos IS 'Tabela de registros de atendimento (anamnese)';
