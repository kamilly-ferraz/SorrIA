import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { officeService } from '@/services/OfficeService';
import type { CreateOfficeInput, UpdateOfficeInput } from '@/types';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export function useOffices() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['offices', tenantId],
    queryFn: () => tenantId ? officeService.getAll(tenantId) : Promise.resolve([]),
    enabled: !!tenantId,
  });
}

export function useCreateOffice() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (input: CreateOfficeInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return officeService.create({ input, tenantId, userId: user.id, userRole: role });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offices'] }),
  });
}

export function useUpdateOffice() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateOfficeInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return officeService.update(id, input, tenantId, user.id, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offices'] }),
  });
}

export function useDeleteOffice() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return officeService.delete(id, tenantId, user.id, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offices'] }),
  });
}
