export type { 
  Patient, 
  CreatePatientInput, 
  UpdatePatientInput, 
  PatientFilter 
} from '@/domain/entities/Patient';

export type { 
  Appointment, 
  AppointmentStatus,
  CreateAppointmentInput, 
  UpdateAppointmentInput, 
  AppointmentFilter 
} from '@/domain/entities/Appointment';

export type { 
  Consultation, 
  ConsultationType,
  CreateConsultationInput, 
  UpdateConsultationInput, 
  ConsultationFilter 
} from '@/domain/entities/Consultation';

export interface PatientFormData {
  nome: string;
  telefone: string;
  data_nascimento?: string;
  cpf?: string;
  email?: string;
  observacoes?: string;
  historico_clinico?: string;
}

export interface AppointmentFormData {
  paciente_id: string;
  data: string;
  horario: string;
  procedimento: string;
  cadeira?: string;
  status?: string;
}

export interface ConsultationFormData {
  paciente_id: string;
  agendamento_id: string | null;
  queixa_principal: string;
  historico_br?: string;
  observacoes_clinicas?: string;
  conduta?: string;
}
