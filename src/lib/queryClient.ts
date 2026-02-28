import { QueryClient } from '@tanstack/react-query';

export const queryKeys = {
  patients: {
    all: (tenantId: string) => ['patients', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) => 
      ['patients', tenantId, 'list', filters] as const,
    detail: (tenantId: string, patientId: string) => 
      ['patients', tenantId, 'detail', patientId] as const,
    search: (tenantId: string, term: string) => 
      ['patients', tenantId, 'search', term] as const,
  },

  appointments: {
    all: (tenantId: string) => ['appointments', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) => 
      ['appointments', tenantId, 'list', filters] as const,
    detail: (tenantId: string, appointmentId: string) => 
      ['appointments', tenantId, 'detail', appointmentId] as const,
    byPatient: (tenantId: string, patientId: string) => 
      ['appointments', tenantId, 'byPatient', patientId] as const,
  },

  consultations: {
    all: (tenantId: string) => ['consultations', tenantId] as const,
    list: (tenantId: string, filters?: Record<string, unknown>) => 
      ['consultations', tenantId, 'list', filters] as const,
    detail: (tenantId: string, consultationId: string) => 
      ['consultations', tenantId, 'detail', consultationId] as const,
    byPatient: (tenantId: string, patientId: string) => 
      ['consultations', tenantId, 'byPatient', patientId] as const,
  },
} as const;

export const cacheConfig = {
  staleTime: 5 * 60 * 1000,
  cacheTime: 10 * 60 * 1000,
  maxRetries: 3,
  retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  refetchOnWindowFocus: false,
  refetchOnReconnect: false,
  refetchInterval: false,
} as const;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: cacheConfig.staleTime,
      gcTime: cacheConfig.cacheTime,
      retry: cacheConfig.maxRetries,
      retryDelay: cacheConfig.retryDelay,
      refetchOnWindowFocus: cacheConfig.refetchOnWindowFocus,
      refetchOnReconnect: cacheConfig.refetchOnReconnect,
      refetchInterval: cacheConfig.refetchInterval,
      throwOnError: false,
    },
    mutations: {
      retry: 2,
      throwOnError: false,
    },
  },
});

/**
 * Invalidate all patient queries for a specific tenant
 * This function properly invalidates cache to ensure fresh data on next fetch
 */
export const invalidatePatientQueries = async (queryClient: QueryClient, tenantId: string): Promise<void> => {
  // Invalidate all patient queries - use prefix matching for comprehensive coverage
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: ['patients', tenantId],
    }),
    // Also invalidate exact matches
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.all(tenantId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.list(tenantId),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.list(tenantId, { activeOnly: true }),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.list(tenantId, { activeOnly: true, page: 1, pageSize: 1000 }),
    }),
    queryClient.invalidateQueries({
      queryKey: queryKeys.patients.list(tenantId, { activeOnly: true, page: 1, pageSize: 10 }),
    }),
  ]);
};

export const invalidateAppointmentQueries = (queryClient: QueryClient, tenantId: string) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.appointments.all(tenantId),
  });
};

export const invalidateConsultationQueries = (queryClient: QueryClient, tenantId: string) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.consultations.all(tenantId),
  });
};

export const invalidatePatientRelatedQueries = (
  queryClient: QueryClient, 
  tenantId: string, 
  patientId: string
) => {
  queryClient.invalidateQueries({
    queryKey: queryKeys.patients.detail(tenantId, patientId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.appointments.byPatient(tenantId, patientId),
  });
  queryClient.invalidateQueries({
    queryKey: queryKeys.consultations.byPatient(tenantId, patientId),
  });
};
