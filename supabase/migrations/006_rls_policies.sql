-- =====================================================
-- FUNÇÕES AUXILIARES E ÍNDICES ADICIONAIS
-- =====================================================
-- Este arquivo contém funções auxiliares para o sistema
-- e índices adicionais para performance
-- =====================================================

-- =====================================================
-- 1. FUNÇÕES PARA GERENCIAR TENANT
-- =====================================================

-- Função para definir o tenant atual (chamada pelo application)
CREATE OR REPLACE FUNCTION public.set_tenant_id(tenant_uuid UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_tenant_id', tenant_uuid::text, false);
END;
$$;

-- Função para obter o tenant atual
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tenant_id TEXT;
BEGIN
  tenant_id := current_setting('app.current_tenant_id', true);
  IF tenant_id IS NULL OR tenant_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN tenant_id::UUID;
END;
$$;

-- =====================================================
-- 2. FUNÇÕES DE AUDITORIA
-- =====================================================

-- Criar tabela de auditoria se não existir
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID REFERENCES auth.users(id),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- RLS para audit_log
CREATE POLICY "Admins can read audit log"
ON public.audit_log FOR SELECT
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id(auth.uid())
  AND public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can insert audit log"
ON public.audit_log FOR INSERT
TO authenticated
WITH CHECK (tenant_id = public.get_user_tenant_id(auth.uid()));

-- Função de auditoria
CREATE OR REPLACE FUNCTION public.audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_tenant_id UUID;
  v_user_id UUID;
BEGIN
  v_tenant_id := public.get_user_tenant_id(auth.uid());
  v_user_id := auth.uid();
  
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (tenant_id, table_name, operation, old_data, new_data, user_id, timestamp)
    VALUES (v_tenant_id, TG_TABLE_NAME, 'INSERT', NULL, row_to_json(NEW), v_user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (tenant_id, table_name, operation, old_data, new_data, user_id, timestamp)
    VALUES (v_tenant_id, TG_TABLE_NAME, 'UPDATE', row_to_json(OLD), row_to_json(NEW), v_user_id, NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (tenant_id, table_name, operation, old_data, new_data, user_id, timestamp)
    VALUES (v_tenant_id, TG_TABLE_NAME, 'DELETE', row_to_json(OLD), NULL, v_user_id, NOW());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Habilitar auditoria nas tabelas (opcional - descomente se necessário)
-- CREATE TRIGGER audit_pacientes
-- AFTER INSERT OR UPDATE OR DELETE ON pacientes
-- FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- CREATE TRIGGER audit_agendamentos
-- AFTER INSERT OR UPDATE OR DELETE ON agendamentos
-- FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_func();

-- =====================================================
-- 3. ÍNDICES ADICIONAIS PARA PERFORMANCE
-- =====================================================

-- Índices para busca por tenant ( já criados nas migrações anteriores, mas garantindo)
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_tenant ON public.audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_auditoria_logs_timestamp ON public.audit_log(timestamp DESC);

-- =====================================================
-- 4. FUNÇÕES DE BUSCA
-- =====================================================

-- Função para buscar pacientes por CPF
CREATE OR REPLACE FUNCTION public.buscar_paciente_por_cpf(_cpf TEXT)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  telefone TEXT,
  email TEXT,
  cpf VARCHAR(14)
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nome, p.telefone, p.email, p.cpf
  FROM public.pacientes p
  WHERE p.cpf = _cpf
    AND p.tenant_id = public.get_user_tenant_id(auth.uid())
    AND p.ativo = true;
END;
$$;

-- Função para buscar agendamentos do dia
CREATE OR REPLACE FUNCTION public.buscar_agendamentos_do_dia(_data DATE)
RETURNS TABLE (
  id UUID,
  paciente_nome TEXT,
  horario TIME,
  procedimento TEXT,
  status TEXT,
  cadeira INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    p.nome AS paciente_nome,
    a.horario,
    a.procedimento,
    a.status,
    a.cadeira
  FROM public.agendamentos a
  JOIN public.pacientes p ON a.paciente_id = p.id
  WHERE a.data = _data
    AND a.tenant_id = public.get_user_tenant_id(auth.uid())
  ORDER BY a.horario;
END;
$$;

-- Função para verificar disponibilidade de cadeira
CREATE OR REPLACE FUNCTION public.verificar_disponibilidade_cadeira(
  _data DATE,
  _horario TIME,
  _cadeira INTEGER,
  _exclude_id UUID DEFAULT NULL
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
    AND data = _data
    AND horario = _horario
    AND cadeira = _cadeira
    AND status NOT IN ('cancelado')
    AND ( _exclude_id IS NULL OR id != _exclude_id );
  
  RETURN v_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. VIEW PARA DASHBOARD
-- =====================================================

-- View para resumo do dia
CREATE OR REPLACE VIEW public.v_resumo_dia AS
SELECT 
  a.data,
  COUNT(*) FILTER (WHERE a.status = 'agendado') AS total_agendados,
  COUNT(*) FILTER (WHERE a.status = 'concluido') AS total_concluidos,
  COUNT(*) FILTER (WHERE a.status = 'cancelado') AS total_cancelados,
  COUNT(*) FILTER (WHERE a.status = 'em_atendimento') AS total_em_atendimento
FROM public.agendamentos a
WHERE a.tenant_id = public.get_user_tenant_id(auth.uid())
GROUP BY a.data;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================

-- Verificar se todas as tabelas têm RLS habilitado
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true;
