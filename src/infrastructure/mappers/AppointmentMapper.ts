import { Appointment, AppointmentStatus } from '@/domain/entities/Appointment';

export interface DbAppointment {
  id: string;
  tenant_id: string;
  paciente_id: string;
  profissional_id?: string;
  data: string;
  horario: string;
  procedimento: string;
  status: string;
  cadeira?: number;
  created_at: string;
  updated_at: string;
}

const STATUS_MAP: Record<string, AppointmentStatus> = {
  agendado: 'agendado',
  aguardando: 'aguardando',
  em_atendimento: 'em_atendimento',
  concluido: 'concluido',
  cancelado: 'cancelado',
};

export class AppointmentMapper {
  private static parseDate(value?: string): Date {
    if (!value) return new Date();
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return new Date();
    return parsed;
  }

  static fromDatabase(data: DbAppointment): Appointment {
    const status: AppointmentStatus = STATUS_MAP[data.status] || 'agendado';
    return new Appointment(
      data.id,
      data.tenant_id,
      data.paciente_id,
      '',
      data.data,
      data.horario,
      data.procedimento,
      status,
      data.cadeira,
      data.profissional_id,
      this.parseDate(data.created_at),
      this.parseDate(data.updated_at || data.created_at)
    );
  }

  static fromDatabaseList(data: DbAppointment[]): Appointment[] {
    return data.map((item) => this.fromDatabase(item));
  }

  static toDatabase(appointment: Appointment): Omit<DbAppointment, 'id' | 'created_at' | 'updated_at'> {
    return {
      tenant_id: appointment.tenantId,
      paciente_id: appointment.patientId,
      profissional_id: appointment.dentistId,
      data: appointment.date,
      horario: appointment.time,
      procedimento: appointment.procedure,
      status: appointment.status,
      cadeira: appointment.chair,
    };
  }

  static toDatabasePartial(appointment: Partial<Appointment>): Partial<DbAppointment> {
    const result: Partial<DbAppointment> = {};
    
    if (appointment.patientId !== undefined) result.paciente_id = appointment.patientId;
    // patientName is not stored in DB, it's a runtime property
    if (appointment.date !== undefined) result.data = appointment.date;
    if (appointment.time !== undefined) result.horario = appointment.time;
    if (appointment.procedure !== undefined) result.procedimento = appointment.procedure;
    if (appointment.status !== undefined) result.status = appointment.status;
    if (appointment.chair !== undefined) result.cadeira = appointment.chair;
    if (appointment.dentistId !== undefined) result.profissional_id = appointment.dentistId;
    
    return result;
  }
}
