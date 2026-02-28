import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class CancelAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(appointmentId: string, tenantId: string): Promise<void> {
    const appointment = await this.appointmentRepository.findById(appointmentId, tenantId);
    
    if (!appointment) {
      throw new Error('Agendamento não encontrado');
    }

    if (appointment.status === 'cancelado') {
      throw new Error('Agendamento já está cancelado');
    }

    if (appointment.status === 'concluido') {
      throw new Error('Não é possível cancelar um agendamento já concluído');
    }

    await this.appointmentRepository.cancel(appointmentId, tenantId);
  }
}
