import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from './useAuth';
import { usePatientUseCases, useLogger, useApplication } from '@/application/ApplicationContext';
import { 
  Patient, 
  PatientFilter,
  CreatePatientInput 
} from '@/domain/entities/Patient';
import { createUseCaseContext, UserRole } from '@/application/useCases/UseCaseContext';
import { queryKeys, invalidatePatientQueries } from '@/lib/queryClient';
import type { PatientFormData } from '@/types/index';
import { toastManager } from '@/lib/ToastManager';
import { PaginationParams, PaginatedResult } from '@/shared/types/Pagination';

export interface PatientUI {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  data_nascimento?: string;
  cpf?: string;
  email?: string;
  observacoes?: string;
  historico_clinico?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPatientsUI {
  data: PatientUI[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

function toUIFormat(patient: Patient): PatientUI {
  // Verificar se birthDate é uma data válida antes de converter
  let data_nascimento: string | undefined;
  if (patient.birthDate && patient.birthDate instanceof Date && !isNaN(patient.birthDate.getTime())) {
    data_nascimento = patient.birthDate.toISOString().split('T')[0];
  }
  
  return {
    id: patient.id,
    tenantId: patient.tenantId,
    nome: patient.name,
    telefone: patient.phone,
    data_nascimento,
    cpf: patient.cpf,
    email: patient.email,
    observacoes: patient.observations,
    historico_clinico: patient.medicalHistory,
    ativo: patient.active,
    createdAt: patient.createdAt?.toISOString() || new Date().toISOString(),
    updatedAt: patient.updatedAt?.toISOString() || new Date().toISOString(),
  };
}

function toPaginatedUIFormat(paginatedResult: PaginatedResult<Patient>): PaginatedPatientsUI {
  return {
    data: paginatedResult.data.map(toUIFormat),
    total: paginatedResult.total,
    page: paginatedResult.page,
    pageSize: paginatedResult.pageSize,
    totalPages: paginatedResult.totalPages,
    hasNext: paginatedResult.hasNext,
    hasPrevious: paginatedResult.hasPrevious,
  };
}

function toDomainFormat(formData: PatientFormData): CreatePatientInput {
  return {
    name: formData.nome,
    phone: formData.telefone,
    birthDate: formData.data_nascimento,
    cpf: formData.cpf,
    email: formData.email,
    observations: formData.observacoes,
    medicalHistory: formData.historico_clinico,
  };
}

export function usePatients() {
  const { tenantId, user } = useAuth();
  const queryClient = useQueryClient();
  const logger = useLogger();
  const { patientRepository } = useApplication();
  const { createPatientUseCase, listPatientsUseCase, updatePatientUseCase } = usePatientUseCases();

  // Função helper para criar contexto dinamicamente
  const createContext = () => createUseCaseContext({
    tenantId: tenantId || '',
    userId: user?.id || '',
    roles: [UserRole.ADMIN],
    correlationId: crypto.randomUUID(),
  });

  const usePatientsPaginated = (pagination: PaginationParams) => {
    return useQuery({
      queryKey: queryKeys.patients.list(tenantId || '', { 
        activeOnly: true, 
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
          } as PaginatedPatientsUI;
        }
        
        const context = createContext();
        const filter: PatientFilter = { tenantId, activeOnly: true };
        const result = await listPatientsUseCase.execute({ 
          activeOnly: true,
          pagination 
        }, context);
        
        if (result.isErr()) {
          logger.error('Erro ao buscar pacientes', result.unwrapErr());
          throw result.unwrapErr();
        }
        
        return toPaginatedUIFormat(result.unwrap());
      },
      enabled: !!tenantId,
    });
  };

  /**
   * Create patient mutation with proper cache invalidation and refetch
   */
  const createPatientMutation = useMutation({
    mutationFn: async (data: PatientFormData) => {
      if (!tenantId) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }
      const context = createContext();
      const domainData = toDomainFormat(data);
      const result = await createPatientUseCase.execute(domainData, context);
      
      if (result.isErr()) {
        const err = result.unwrapErr();
        throw err;
      }
      
      return toUIFormat(result.unwrap());
    },
    onSuccess: async (patient: PatientUI) => {
      if (tenantId) {
        // Atualiza cache da lista principal imediatamente para refletir na UI sem atraso
        queryClient.setQueryData<PatientUI[]>(
          queryKeys.patients.list(tenantId, { activeOnly: true }),
          (current = []) => {
            if (current.some((item) => item.id === patient.id)) {
              return current;
            }
            return [patient, ...current];
          }
        );

        await invalidatePatientQueries(queryClient, tenantId);

        // Refetch amplo por prefixo para cobrir todas as variantes de chave
        await queryClient.refetchQueries({
          queryKey: queryKeys.patients.all(tenantId),
          type: 'all',
        });
      }
      return patient;
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao criar paciente', error.message);
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<PatientFormData> }) => {
      if (!tenantId) throw new Error('Tenant não identificado');
      const context = createContext();
      const domainData = toDomainData(data);
      const result = await updatePatientUseCase.execute({ patientId: id, ...domainData }, context);
      
      if (result.isErr()) {
        throw result.unwrapErr();
      }
      
      return toUIFormat(result.unwrap());
    },
    onSuccess: () => {
      if (tenantId) {
        invalidatePatientQueries(queryClient, tenantId);
      }
      toastManager.success('Paciente atualizado com sucesso');
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao atualizar paciente', error.message);
    },
  });

  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!tenantId) throw new Error('Tenant não identificado');
      await patientRepository.delete(patientId, tenantId);
      return patientId;
    },
    onSuccess: (patientId: string) => {
      if (tenantId) {
        invalidatePatientQueries(queryClient, tenantId);
      }
      queryClient.setQueryData<PatientUI[]>(
        queryKeys.patients.list(tenantId || '', { activeOnly: true }),
        (current = []) => current.filter((patient) => patient.id !== patientId)
      );
      toastManager.success('Paciente removido com sucesso');
    },
    onError: (error: Error) => {
      toastManager.error('Erro ao remover paciente', error.message);
    },
  });

  const searchPatients = async (
    searchTerm: string, 
    pagination: PaginationParams
  ): Promise<PaginatedPatientsUI> => {
    if (!tenantId || !searchTerm.trim()) {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }
    
    const ctx = createContext();
    const result = await listPatientsUseCase.execute({ 
      searchTerm: searchTerm.trim(), 
      activeOnly: true,
      pagination 
    }, ctx);
    
    if (result.isErr()) {
      return {
        data: [],
        total: 0,
        page: 1,
        pageSize: pagination.pageSize,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      };
    }
    
    return toPaginatedUIFormat(result.unwrap());
  };

  // Simple query for fetching all patients (non-paginated)
  const allPatientsQuery = useQuery({
    queryKey: queryKeys.patients.list(tenantId || '', { activeOnly: true }),
    queryFn: async () => {
      if (!tenantId) {
        console.warn('[usePatients] TenantId não disponível para buscar pacientes');
        return [];
      }
      
      try {
        console.log('[usePatients] Buscando pacientes para tenant:', tenantId);
        const ctx = createContext();
        console.log('[usePatients] Contexto criado:', { 
          tenantId: ctx.tenantId, 
          userId: ctx.userId,
          roles: ctx.roles 
        });
        
        const result = await listPatientsUseCase.execute({ 
          activeOnly: true,
          pagination: { page: 1, pageSize: 1000 }
        }, ctx);
        
        if (result.isErr()) {
          const err = result.unwrapErr();
          logger.error('Erro ao buscar pacientes', err);
          console.error('[usePatients] Erro ao buscar pacientes:', err.message, err);
          return [];
        }
        
        const unwrapped = result.unwrap();
        console.log('[usePatients] Pacientes retornados do useCase:', {
          total: unwrapped.total,
          dataCount: unwrapped.data.length
        });
        
        const data = unwrapped.data.map(toUIFormat);
        console.log('[usePatients] Pacientes convertidos para UI:', data.length);
        
        return data;
      } catch (err) {
        console.error('[usePatients] Exceção na query:', err);
        return [];
      }
    },
    enabled: !!tenantId,
    staleTime: 0, // Always stale to force fresh data fetch
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: false, // Don't auto-refetch on interval
    retry: 2,
  });

  /**
   * Refetch patients - Force refetch all patient queries
   * This method invalidates AND refetches to ensure fresh data
   */
  const refetchPatients = useCallback(async () => {
    if (!tenantId) return;
    
    // Invalidate all patient queries to mark them as stale
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.patients.all(tenantId),
      refetchType: 'all',
    });
    
    // Explicitly refetch by prefix to ensure all related queries are refreshed
    await queryClient.refetchQueries({
      queryKey: queryKeys.patients.all(tenantId),
      type: 'all',
    });
  }, [tenantId, queryClient]);

  return {
    usePatientsPaginated,
    patients: allPatientsQuery.data ?? [],
    loading: allPatientsQuery.isLoading,
    error: allPatientsQuery.error,
    fetchPatients: refetchPatients,
    createPatient: createPatientMutation.mutate,
    updatePatient: updatePatientMutation.mutate,
    deletePatient: deletePatientMutation.mutate,
    isCreating: createPatientMutation.isPending,
    isUpdating: updatePatientMutation.isPending,
    isDeleting: deletePatientMutation.isPending,
    searchPatients,
    refetchPatients,
  };
}

function toDomainData(data: Partial<PatientFormData>): Partial<CreatePatientInput> {
  return {
    name: data.nome,
    phone: data.telefone,
    birthDate: data.data_nascimento,
    cpf: data.cpf,
    email: data.email,
    observations: data.observacoes,
    medicalHistory: data.historico_clinico,
  };
}
