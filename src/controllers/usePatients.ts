import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { patientService } from '@/services/PatientService';
import type { CreatePatientInput, UpdatePatientInput } from '@/types';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export function usePatients(search?: string) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['patients', tenantId, search],
    queryFn: () => tenantId ? patientService.getAll(tenantId, search) : Promise.resolve([]),
    enabled: !!tenantId,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (input: CreatePatientInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return patientService.create({ input, tenantId, userId: user.id, userRole: role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdatePatient() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdatePatientInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return patientService.update(id, input, tenantId, user.id, role);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['patients'] }),
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return patientService.delete(id, tenantId, user.id, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
