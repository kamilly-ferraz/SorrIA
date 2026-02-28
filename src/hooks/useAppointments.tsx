import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { useAppointmentUseCases, usePatientUseCases, useLogger } from '@/application/ApplicationContext';
import { 
  Appointment, 
  AppointmentFilter,
  CreateAppointmentInput,
  AppointmentStatus 
} from '@/domain/entities/Appointment';
import { createUseCaseContext, UserRole } from '@/application/useCases/UseCaseContext';
import { queryKeys, invalidateAppointmentQueries } from '@/lib/queryClient';
import type { AppointmentFormData } from '@/types/index';
import { toastManager } from '@/lib/ToastManager';
import { PaginationParams, PaginatedResult } from '@/shared/types/Pagination';

export interface AppointmentUI {
  id: string;
  tenantId: string;
  paciente_id: string;
  paciente_nome: string;
  data: string;
  horario: string;
  procedimento: string;
  status: string;
  cadeira?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedAppointmentsUI {
  data: AppointmentUI[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function toUIFormat(appointment: Appointment, patientName?: string): AppointmentUI {
  const safeToIso = (value: Date | undefined): string => {
    if (!value || isNaN(value.getTime())) return new Date().toISOString();
    return value.toISOString();
  };

  return {
    id: appointment.id,
    tenantId: appointment.tenantId,
    paciente_id: appointment.patientId,
    paciente_nome: patientName || appointment.patientName || 'Paciente',
    data: appointment.date,
    horario: appointment.time,
    procedimento: appointment.procedure,
    status: appointment.status,
    cadeira: appointment.chair?.toString(),
    createdAt: safeToIso(appointment.createdAt),
    updatedAt: safeToIso(appointment.updatedAt),
  };
}

function toPaginatedUIFormat(paginatedResult: PaginatedResult<Appointment>): PaginatedAppointmentsUI {
  return {
    data: paginatedResult.data.map(a => toUIFormat(a)),
    total: paginatedResult.total,
    page: paginatedResult.page,
    pageSize: paginatedResult.pageSize,
    totalPages: paginatedResult.totalPages,
    hasNext: paginatedResult.hasNext,
    hasPrevious: paginatedResult.hasPrevious,
  };
}

function toDomainFormat(formData: AppointmentFormData): CreateAppointmentInput {
  return {
    patientId: formData.paciente_id,
    date: formData.data,
    time: formData.horario,
    procedure: formData.procedimento,
    chair: formData.cadeira ? parseInt(formData.cadeira) : undefined,
    status: (formData.status as AppointmentStatus) || 'agendado',
  };
}

function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function useAppointments() {
  const { tenantId } = useAuth();
  const queryClient = useQueryClient();
  const logger = useLogger();
  
  const { 
    scheduleAppointmentUseCase, 
    listAppointmentsUseCase, 
    cancelAppointmentUseCase,
    completeConsultationUseCase 
  } = useAppointmentUseCases();
  const { listPatientsUseCase } = usePatientUseCases();

  const context = createUseCaseContext({
    tenantId: tenantId || '',
    userId: '',
    roles: [UserRole.ADMIN],
    correlationId: crypto.randomUUID(),
  });

  const useAppointmentsPaginated = (pagination: PaginationParams, filter?: AppointmentFilter) => {
    return useQuery({
      queryKey: queryKeys.appointments.list(tenantId || '', { 
        page: pagination.page, 
        pageSize: pagination.pageSize 
      }),
      queryFn: async () => {
        if (!tenantId) {
          return {
            data: [],
            total: 0,
            page: 1,
            pageSize: pagination.pageSize,
            totalPages: 0,
            hasNext: false,
            hasPrevious: false,
          } as PaginatedAppointmentsUI;
        }
        
        const appointmentFilter: AppointmentFilter = { tenantId, ...filter };
        const result = await listAppointmentsUseCase.execute({ 
          filter: appointmentFilter, 
          pagination 
        }, context);
        
        if (result.isErr()) {
          logger.error('Erro ao buscar agendamentos', result.unwrapErr());
          throw result.unwrapErr();
        }
        
        return toPaginatedUIFormat(result.unwrap());
      },
      enabled: !!tenantId,
    });
  };

  const patientsQuery = useQuery({
    queryKey: queryKeys.patients.list(tenantId || '', { activeOnly: true }),
    queryFn: async () => {
      if (!tenantId) return [];
      const result = await listPatientsUseCase.execute({ 
        activeOnly: true,
        pagination: { page: 1, pageSize: 1000 } 
      }, context);
      if (result.isErr()) {
        return [];
      }
      return result.unwrap().data.map(p => ({
        id: p.id,
        tenantId: p.tenantId,
        nome: p.name,
        telefone: p.phone,
        data_nascimento: p.birthDate?.toISOString().split('T')[0],
        cpf: p.cpf,
        email: p.email,
        observacoes: p.observations,
        historico_clinico: p.medicalHistory,
        ativo: p.active,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      }));
    },
    enabled: !!tenantId,
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: AppointmentFormData) => {
      if (!tenantId) throw new Error('Tenant não identificado');
      const domainData = toDomainFormat(data);
      const appointment = await scheduleAppointmentUseCase.execute(domainData, tenantId);
      const patients = patientsQuery.data || [];
      const patient = patients.find(p => p.id === data.paciente_id);
      return toUIFormat(appointment, patient?.nome);
    },
    onSuccess: () => {
      if (tenantId) {
        invalidateAppointmentQueries(queryClient, tenantId);
      }
      toastManager.success('Agendamento criado com sucesso');
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao criar agendamento', error.message);
    },
  });

  const cancelAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => {
      if (!tenantId) throw new Error('Tenant não identificado');
      await cancelAppointmentUseCase.execute(appointmentId, tenantId);
    },
    onSuccess: () => {
      if (tenantId) {
        invalidateAppointmentQueries(queryClient, tenantId);
      }
      toastManager.success('Agendamento cancelado com sucesso');
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao cancelar agendamento', error.message);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ appointmentId, status }: { appointmentId: string; status: string }) => {
      if (!tenantId) throw new Error('Tenant não identificado');
      await completeConsultationUseCase.execute(appointmentId, tenantId);
    },
    onSuccess: () => {
      if (tenantId) {
        invalidateAppointmentQueries(queryClient, tenantId);
      }
      toastManager.success('Status atualizado com sucesso');
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao atualizar status', error.message);
    },
  });

  const appointmentsQuery = useQuery({
    queryKey: queryKeys.appointments.list(tenantId || '', {}),
    queryFn: async () => {
      if (!tenantId) return [];
      
      const result = await listAppointmentsUseCase.execute({ 
        filter: { tenantId },
        pagination: { page: 1, pageSize: 1000 }
      }, context);
      
      if (result.isErr()) {
        logger.error('Erro ao buscar agendamentos', result.unwrapErr());
        return [];
      }
      
      const appointments = result.unwrap().data;
      const patients = patientsQuery.data || [];
      
      return appointments.map(apt => {
        const patient = patients.find(p => p.id === apt.patientId);
        return toUIFormat(apt, patient?.nome);
      });
    },
    enabled: !!tenantId,
  });

  const getTodayAppointments = useCallback((): AppointmentUI[] => {
    const today = getLocalDateString();
    return appointmentsQuery.data?.filter((apt) => apt.data === today) || [];
  }, [appointmentsQuery.data]);

  const refetchAppointments = useCallback(async () => {
    if (tenantId) {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.all(tenantId),
        refetchType: 'all',
      });
      await queryClient.refetchQueries({
        queryKey: queryKeys.appointments.all(tenantId),
        type: 'all',
      });
    }
  }, [tenantId, queryClient]);

  return {
    useAppointmentsPaginated,
    appointments: appointmentsQuery.data ?? [],
    patients: patientsQuery.data ?? [],
    loading: appointmentsQuery.isLoading || patientsQuery.isLoading,
    isLoading: appointmentsQuery.isLoading || patientsQuery.isLoading,
    isFetching: appointmentsQuery.isFetching || patientsQuery.isFetching,
    error: appointmentsQuery.error || patientsQuery.error,
    isError: appointmentsQuery.isError || patientsQuery.isError,
    createAppointment: createAppointmentMutation.mutate,
    cancelAppointment: cancelAppointmentMutation.mutate,
    updateAppointmentStatus: updateStatusMutation.mutate,
    isCreating: createAppointmentMutation.isPending,
    isCancelling: cancelAppointmentMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    refetchAppointments,
    getTodayAppointments,
  };
}
