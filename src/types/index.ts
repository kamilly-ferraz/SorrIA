import type { Tables, TablesInsert, TablesUpdate, Enums } from '@/integrations/supabase/types';

export type Patient = Tables<'patients'> & {
  dentist_name?: string | null;
};

export type CreatePatientInput = Omit<TablesInsert<'patients'>, 'id' | 'created_at' | 'tenant_id'>;

export type UpdatePatientInput = Partial<CreatePatientInput>;

export type Office = Tables<'offices'>;

export interface CreateOfficeInput {
  name: string;
  active?: boolean;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export interface UpdateOfficeInput {
  name?: string;
  active?: boolean;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
}

export type ProcedureType = Tables<'procedure_types'>;

export interface CreateProcedureTypeInput {
  name: string;
  duration?: number;
  price?: number;
  color?: string;
  active?: boolean;
}

export interface UpdateProcedureTypeInput {
  name?: string;
  duration?: number;
  price?: number;
  color?: string;
  active?: boolean;
}

export type AppointmentStatus = Enums<'appointment_status'>;

export type Appointment = Tables<'appointments'> & {
  patients?: { name: string; phone: string | null } | null;
  offices?: { name: string } | null;
  procedure_types?: {
    name: string;
    color: string;
    duration: number;
  } | null;
  dentist_name?: string | null;
};

export type CreateAppointmentInput = Omit<
  TablesInsert<'appointments'>,
  'id' | 'created_at' | 'tenant_id' | 'dentist_id' | 'created_by'
>;

export type UpdateAppointmentInput = Partial<CreateAppointmentInput> & {
  status?: AppointmentStatus;
  check_in_at?: string | null;
  check_out_at?: string | null;
};

export type AuditLog = Tables<'audit_logs'>;

export type Profile = Tables<'profiles'>;

export interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activeOffices: number;
  todayDetails: Appointment[];
}

export interface ChartDataItem {
  name: string;
  value: number;
  fill?: string;
}

export interface ChartData {
  byStatus: ChartDataItem[];
  byProcedure: ChartDataItem[];
}
