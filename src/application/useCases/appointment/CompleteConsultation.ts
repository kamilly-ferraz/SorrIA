import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class CompleteConsultationUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(appointmentId: string, tenantId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId, tenantId);
    
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    if (appointment.status === 'cancelado') {
      throw new Error('Não é possível concluir um agendamento cancelado');
    }

    if (appointment.status === 'concluido') {
      throw new Error('Agendamento já foi concluído');
    }

    await this.appointmentRepository.updateStatus(appointmentId, 'concluido');
  }
}
