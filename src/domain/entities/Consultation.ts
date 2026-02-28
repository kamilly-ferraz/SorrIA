export type ConsultationType = 
  | 'consulta' 
  | 'retorno' 
  | 'emergencia' 
  | 'preventiva';

export const CONSULTATION_TYPE_LABELS: Record<ConsultationType, string> = {
  consulta: 'Consulta',
  retorno: 'Retorno',
  emergencia: 'Emergencia',
  preventiva: 'Preventiva',
};

export class Consultation {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public patientId: string,
    public date: string,
    public time: string,
    public type: ConsultationType = 'consulta',
    public appointmentId?: string,
    public description?: string,
    public diagnosis?: string,
    public treatment?: string,
    public observations?: string,
    public nextAppointment?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  isFollowUp(): boolean {
    return this.type === 'retorno';
  }

  isEmergency(): boolean {
    return this.type === 'emergencia';
  }

  isPreventive(): boolean {
    return this.type === 'preventiva';
  }

  hasMedicalHistory(): boolean {
    return !!this.diagnosis || !!this.treatment;
  }

  hasNextAppointment(): boolean {
    return !!this.nextAppointment;
  }

  getTypeLabel(): string {
    return CONSULTATION_TYPE_LABELS[this.type];
  }

  isValid(): boolean {
    return (
      this.patientId.length > 0 &&
      this.date.length > 0 &&
      this.time.length > 0
    );
  }
}

export interface CreateConsultationInput {
  patientId: string;
  date: string;
  time: string;
  type: ConsultationType;
  appointmentId?: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  nextAppointment?: string;
}

export interface UpdateConsultationInput {
  type?: ConsultationType;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  nextAppointment?: string;
}

export interface ConsultationFilter {
  tenantId: string;
  patientId?: string;
  date?: string;
  type?: ConsultationType;
}
