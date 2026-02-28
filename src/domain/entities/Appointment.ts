export type AppointmentStatus = 
  | 'agendado' 
  | 'aguardando' 
  | 'em_atendimento' 
  | 'concluido' 
  | 'cancelado';

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  agendado: 'Agendado',
  aguardando: 'Aguardando',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluido',
  cancelado: 'Cancelado',
};

export class Appointment {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public patientId: string,
    public patientName: string = '',
    public date: string,
    public time: string,
    public procedure: string,
    public status: AppointmentStatus = 'agendado',
    public chair?: number,
    public dentistId?: string,
    public readonly createdAt: Date = new Date(),
    public updatedAt: Date = new Date()
  ) {}

  isActive(): boolean {
    return this.status !== 'cancelado';
  }

  isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.date === today;
  }

  isPast(): boolean {
    const now = new Date();
    const appointmentDate = new Date(`${this.date}T${this.time}`);
    return appointmentDate < now;
  }

  isFuture(): boolean {
    return !this.isPast();
  }

  markAsWaiting(): void {
    if (this.status === 'agendado') {
      this.status = 'aguardando';
      this.updatedAt = new Date();
    }
  }

  markAsInProgress(): void {
    this.status = 'em_atendimento';
    this.updatedAt = new Date();
  }

  markAsCompleted(): void {
    this.status = 'concluido';
    this.updatedAt = new Date();
  }

  cancel(): void {
    this.status = 'cancelado';
    this.updatedAt = new Date();
  }

  getStatusLabel(): string {
    return APPOINTMENT_STATUS_LABELS[this.status];
  }

  getDateTime(): string {
    return `${this.date} as ${this.time}`;
  }

  isValid(): boolean {
    return (
      this.patientId.length > 0 &&
      this.date.length > 0 &&
      this.time.length > 0 &&
      this.procedure.length > 0
    );
  }
}

export interface CreateAppointmentInput {
  patientId: string;
  date: string;
  time: string;
  procedure: string;
  chair?: number;
  status?: AppointmentStatus;
}

export interface UpdateAppointmentInput {
  patientId?: string;
  date?: string;
  time?: string;
  procedure?: string;
  chair?: number;
  status?: AppointmentStatus;
}

export interface AppointmentFilter {
  tenantId: string;
  date?: string;
  status?: AppointmentStatus;
  patientId?: string;
}
