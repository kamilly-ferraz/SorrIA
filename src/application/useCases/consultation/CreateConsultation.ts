import { Consultation, CreateConsultationInput } from '@/domain/entities/Consultation';
import { IConsultationRepository } from '@/domain/repositories/IConsultationRepository';

export class CreateConsultationUseCase {
  constructor(private readonly consultationRepository: IConsultationRepository) {}

  async execute(input: CreateConsultationInput, tenantId: string, professionalId: string): Promise<Consultation> {
    if (!input.patientId?.trim()) {
      throw new Error('ID do paciente é obrigatório');
    }

    if (!input.date?.trim()) {
      throw new Error('Data é obrigatória');
    }

    if (!input.time?.trim()) {
      throw new Error('Horário é obrigatório');
    }

    const consultation = new Consultation(
      '',
      tenantId,
      input.patientId,
      input.date,
      input.time,
      input.type || 'consulta',
      input.appointmentId,
      input.description,
      input.diagnosis,
      input.treatment,
      input.observations,
      input.nextAppointment
    );

    if (!consultation.isValid()) {
      throw new Error('Dados do atendimento inválidos');
    }

    return this.consultationRepository.create(consultation);
  }
}
