-- ============================================
-- PACIENTES E AGENDAMENTOS - Sistema SorrIA ERP
-- Contém: Pacientes, Agendamentos
-- ============================================

-- Pacientes table
CREATE TABLE public.pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  telefone TEXT,
  cpf VARCHAR(14),
  email VARCHAR(255),
  data_nascimento DATE,
  historico_clinico TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pacientes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pacientes (multi-tenant)
CREATE POLICY "Users can read pacientes of their tenant"
ON public.pacientes FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert pacientes in their tenant"
ON public.pacientes FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update pacientes of their tenant"
ON public.pacientes FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete pacientes of their tenant"
ON public.pacientes FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Agendamentos table
CREATE TABLE public.agendamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE NOT NULL,
  paciente_id UUID REFERENCES public.pacientes(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL,
  horario TIME NOT NULL,
  procedimento TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' 
    CHECK (status IN ('agendado', 'aguardando', 'em_atendimento', 'concluido', 'cancelado')),
  cadeira INTEGER,
  dentista_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agendamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies for agendamentos (multi-tenant)
CREATE POLICY "Users can read agendamentos of their tenant"
ON public.agendamentos FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can insert agendamentos in their tenant"
ON public.agendamentos FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can update agendamentos of their tenant"
ON public.agendamentos FOR UPDATE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

CREATE POLICY "Users can delete agendamentos of their tenant"
ON public.agendamentos FOR DELETE
TO authenticated
USING (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Function to check schedule conflicts
CREATE OR REPLACE FUNCTION verificar_conflito_horario(
  p_data DATE,
  p_horario TIME,
  p_dentista_id UUID,
  p_exclude_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_tenant_id UUID;
BEGIN
  v_tenant_id := public.get_user_tenant_id(auth.uid());
  
  SELECT COUNT(*) INTO v_count
  FROM agendamentos
  WHERE tenant_id = v_tenant_id
    AND data = p_data
    AND horario = p_horario
    AND dentista_id IS NOT DISTINCT FROM p_dentista_id
    AND status NOT IN ('cancelado')
    AND (p_exclude_id IS NULL OR id != p_exclude_id);
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Indexes
CREATE INDEX idx_pacientes_telefone ON public.pacientes(telefone);
CREATE INDEX idx_pacientes_tenant_id ON public.pacientes(tenant_id);
CREATE INDEX idx_pacientes_cpf ON public.pacientes(cpf) WHERE cpf IS NOT NULL;
CREATE INDEX idx_agendamentos_data ON public.agendamentos(data);
CREATE INDEX idx_agendamentos_paciente ON public.agendamentos(paciente_id);
CREATE INDEX idx_agendamentos_cadeira ON public.agendamentos(cadeira);
CREATE INDEX idx_agendamentos_tenant_id ON public.agendamentos(tenant_id);
CREATE INDEX idx_agendamentos_data_horario ON public.agendamentos(data, horario);

-- Comments
COMMENT ON TABLE pacientes IS 'Tabela de pacientes da clínica';
COMMENT ON TABLE agendamentos IS 'Tabela de agendamentos de consultas';
