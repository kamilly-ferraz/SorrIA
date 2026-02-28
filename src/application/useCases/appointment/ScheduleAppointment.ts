import { Appointment, CreateAppointmentInput } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';

export class ScheduleAppointmentUseCase {
  constructor(private readonly appointmentRepository: IAppointmentRepository) {}

  async execute(input: CreateAppointmentInput, tenantId: string): Promise<Appointment> {
    if (!input.patientId?.trim()) {
      throw new Error('Paciente e obrigatorio');
    }

    if (!input.date?.trim()) {
      throw new Error('Data e obrigatoria');
    }

    if (!input.time?.trim()) {
      throw new Error('Horario e obrigatorio');
    }

    if (!input.procedure?.trim()) {
      throw new Error('Procedimento e obrigatorio');
    }

    const hasConflict = await this.appointmentRepository.checkConflict(
      input.date,
      input.time,
      tenantId
    );

    if (hasConflict) {
      throw new Error('Ja existe agendamento neste horario');
    }

    const appointment = new Appointment(
      '',
      tenantId,
      input.patientId,
      '',
      input.date,
      input.time,
      input.procedure,
      input.status || 'agendado',
      input.chair
    );

    if (!appointment.isValid()) {
      throw new Error('Dados do agendamento invalidos');
    }

    return this.appointmentRepository.create(appointment);
  }
}
