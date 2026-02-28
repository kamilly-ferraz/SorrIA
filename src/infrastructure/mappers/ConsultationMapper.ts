import { Consultation, ConsultationType } from '@/domain/entities/Consultation';

export interface DbConsultation {
  id: string;
  tenant_id: string;
  paciente_id: string;
  agendamento_id?: string | null;
  profissional_id?: string | null;
  data_atendimento: string;
  hora_atendimento: string;
  tipo: string;
  queixa_principal?: string | null;
  historico_br?: string | null;
  observacoes_clinicas?: string | null;
  diagnostico?: string | null;
  tratamento?: string | null;
  conduta?: string | null;
  proxima_consulta?: string | null;
  created_at: string;
  updated_at: string;
}

const TYPE_MAP: Record<string, ConsultationType> = {
  consulta: 'consulta',
  retorno: 'retorno',
  emergencia: 'emergencia',
  preventiva: 'preventiva',
};

export class ConsultationMapper {
  static fromDatabase(data: DbConsultation): Consultation {
    const type: ConsultationType = TYPE_MAP[data.tipo] || 'consulta';
    const toUndefined = <T>(value: T | null | undefined): T | undefined => 
      value === null ? undefined : value;
    return new Consultation(
      data.id,
      data.tenant_id,
      data.paciente_id,
      data.data_atendimento,
      data.hora_atendimento,
      type,
      toUndefined(data.agendamento_id),
      toUndefined(data.queixa_principal),
      toUndefined(data.diagnostico),
      toUndefined(data.tratamento),
      toUndefined(data.observacoes_clinicas),
      toUndefined(data.proxima_consulta),
      new Date(data.created_at),
      new Date(data.updated_at)
    );
  }

  static fromDatabaseList(data: DbConsultation[]): Consultation[] {
    return data.map(this.fromDatabase);
  }

  static toDatabase(consultation: Consultation): Omit<DbConsultation, 'id' | 'created_at' | 'updated_at'> {
    return {
      tenant_id: consultation.tenantId,
      paciente_id: consultation.patientId,
      agendamento_id: consultation.appointmentId || null,
      data_atendimento: consultation.date || '',
      hora_atendimento: consultation.time || '',
      tipo: consultation.type || '',
      queixa_principal: consultation.description || null,
      diagnostico: consultation.diagnosis || null,
      tratamento: consultation.treatment || null,
      observacoes_clinicas: consultation.observations || null,
      proxima_consulta: consultation.nextAppointment || null,
    };
  }

  static toDatabasePartial(consultation: Partial<Consultation>): Partial<DbConsultation> {
    const result: Partial<DbConsultation> = {};
    
    if (consultation.patientId !== undefined) result.paciente_id = consultation.patientId;
    if (consultation.date !== undefined) result.data_atendimento = consultation.date;
    if (consultation.time !== undefined) result.hora_atendimento = consultation.time;
    if (consultation.type !== undefined) result.tipo = consultation.type;
    if (consultation.appointmentId !== undefined) result.agendamento_id = consultation.appointmentId;
    if (consultation.description !== undefined) result.queixa_principal = consultation.description;
    if (consultation.diagnosis !== undefined) result.diagnostico = consultation.diagnosis;
    if (consultation.treatment !== undefined) result.tratamento = consultation.treatment;
    if (consultation.observations !== undefined) result.observacoes_clinicas = consultation.observations;
    if (consultation.nextAppointment !== undefined) result.proxima_consulta = consultation.nextAppointment;
    
    return result;
  }
}
