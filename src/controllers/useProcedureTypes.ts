import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { procedureTypeService } from '@/services/ProcedureTypeService';
import type { CreateProcedureTypeInput, UpdateProcedureTypeInput } from '@/types';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export function useProcedureTypes() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['procedure_types', tenantId],
    queryFn: () => tenantId ? procedureTypeService.getAll(tenantId) : Promise.resolve([]),
    enabled: !!tenantId,
  });
}

export function useCreateProcedureType() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (input: CreateProcedureTypeInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return procedureTypeService.create({ input, tenantId, userId: user.id, userRole: role });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procedure_types'] }),
  });
}

export function useUpdateProcedureType() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateProcedureTypeInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return procedureTypeService.update(id, input, tenantId, user.id, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procedure_types'] }),
  });
}

export function useDeleteProcedureType() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return procedureTypeService.delete(id, tenantId, user.id, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['procedure_types'] }),
  });
}
