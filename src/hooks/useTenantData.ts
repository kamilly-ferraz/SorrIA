export {
  usePatients,
  useCreatePatient,
  useUpdatePatient,
  useDeletePatient,
} from '@/controllers/usePatients';

export {
  useAppointments,
  useAppointmentsByRange,
  useCreateAppointment,
  useUpdateAppointment,
  useDeleteAppointment,
  useUpdateAppointmentStatus,
} from '@/controllers/useAppointments';

export {
  useOffices,
  useCreateOffice,
  useUpdateOffice,
  useDeleteOffice,
} from '@/controllers/useOffices';

export {
  useProcedureTypes,
  useCreateProcedureType,
  useUpdateProcedureType,
  useDeleteProcedureType,
} from '@/controllers/useProcedureTypes';

export {
  useDashboardStats,
  useDashboardChartData,
} from '@/controllers/useDashboard';

export {
  useTenantProfiles,
} from '@/controllers/useProfiles';
