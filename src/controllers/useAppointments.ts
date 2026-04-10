import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { appointmentService } from '@/services/AppointmentService';
import type { CreateAppointmentInput, UpdateAppointmentInput, AppointmentStatus } from '@/types';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export function useAppointments(date?: string) {
  const tenantId = useTenantId();
  const targetDate = date || new Date().toISOString().split('T')[0];

  return useQuery({
    queryKey: ['appointments', tenantId, targetDate],
    queryFn: () => tenantId ? appointmentService.getByDate(tenantId, targetDate) : Promise.resolve([]),
    enabled: !!tenantId,
    refetchInterval: 30000,
  });
}

export function useAppointmentsByRange(startDate?: string, endDate?: string) {
  const tenantId = useTenantId();

  return useQuery({
    queryKey: ['appointments', 'range', tenantId, startDate, endDate],
    queryFn: () => (startDate && endDate && tenantId) ? appointmentService.getByRange(tenantId, startDate, endDate) : Promise.resolve([]),
    enabled: !!startDate && !!endDate && !!tenantId,
    refetchInterval: 30000,
  });
}

interface CreateAppointmentWithDentist extends CreateAppointmentInput {
  dentist_id?: string;
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (input: CreateAppointmentWithDentist) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      const dentistId = role === 'admin' ? input.dentist_id || user.id : user.id;
      return appointmentService.create({ input, tenantId, dentistId, userId: user.id, userRole: role });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateAppointment() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & UpdateAppointmentInput) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return appointmentService.update(id, input, tenantId, user.id, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentStatus }) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return appointmentService.changeStatus(id, status, tenantId, user.id, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}

export function useDeleteAppointment() {
  const qc = useQueryClient();
  const tenantId = useTenantId();
  const { user, role } = useAuth();

  return useMutation({
    mutationFn: (id: string) => {
      if (!tenantId || !user || !role) throw new Error('Contexto obrigatório');
      return appointmentService.delete(id, tenantId, user.id, role);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
  });
}
