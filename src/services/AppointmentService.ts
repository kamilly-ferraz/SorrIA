import { appointmentRepository } from '@/repositories/AppointmentRepository';
import { auditLogRepository } from '@/repositories/AuditLogRepository';
import { Errors, Validation, AppointmentRules } from '@/domain';
import type { Appointment, CreateAppointmentInput, UpdateAppointmentInput, AppointmentStatus } from '@/types';

interface CreateParams {
  input: CreateAppointmentInput;
  tenantId: string;
  dentistId: string;
  userId: string;
  userRole: string;
}

export class AppointmentService {
  getByDate(tenantId: string, date: string): Promise<Appointment[]> {
    return appointmentRepository.findByDate(tenantId, date);
  }

  getByRange(tenantId: string, startDate: string, endDate: string): Promise<Appointment[]> {
    return appointmentRepository.findByDateRange(tenantId, startDate, endDate);
  }

  getById(id: string): Promise<Appointment | null> {
    return appointmentRepository.findById(id);
  }

  async create({ input, tenantId, dentistId, userId, userRole }: CreateParams): Promise<Appointment> {
    if (!input.patient_id) throw Errors.requiredField('paciente');
    if (!input.office_id) throw Errors.requiredField('consultório');
    if (!input.procedure_type_id) throw Errors.requiredField('procedimento');
    if (!input.appointment_date) throw Errors.requiredField('data');
    if (!input.appointment_time) throw Errors.requiredField('hora');
    if (Validation.isPastDate(input.appointment_date)) throw Errors.dateInPast();

    const appointment = await appointmentRepository.create(tenantId, dentistId, userId, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'create', tableName: 'appointments',
      recordId: appointment.id,
      description: 'Consulta agendada',
    });

    return appointment;
  }

  async update(id: string, input: UpdateAppointmentInput, tenantId: string, userId: string, userRole: string): Promise<Appointment> {
    const existing = await appointmentRepository.findById(id);
    if (!existing) throw Errors.appointmentNotFound();

    const appointment = await appointmentRepository.update(id, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'update', tableName: 'appointments',
      recordId: id,
      description: 'Consulta atualizada',
    });

    return appointment;
  }

  async changeStatus(id: string, status: AppointmentStatus, tenantId: string, userId: string, userRole: string): Promise<Appointment> {
    const updates: UpdateAppointmentInput = { status };

    if (status === 'in_progress') updates.check_in_at = new Date().toISOString();
    if (status === 'completed') updates.check_out_at = new Date().toISOString();

    const appointment = await appointmentRepository.update(id, updates);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: status === 'cancelled' ? 'cancel' : status === 'no_show' ? 'no_show' : 'update',
      tableName: 'appointments',
      recordId: id,
      description: `Consulta: ${status}`,
    });

    return appointment;
  }

  async delete(id: string, tenantId: string, userId: string, userRole: string): Promise<void> {
    const existing = await appointmentRepository.findById(id);
    if (!existing) throw Errors.appointmentNotFound();

    await appointmentRepository.delete(id);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'delete', tableName: 'appointments',
      recordId: id,
      description: 'Consulta excluída',
    });
  }

  checkConflict(appointments: Appointment[], officeId: string, date: string, time: string, excludeId?: string): boolean {
    return AppointmentRules.hasTimeConflict(appointments, officeId, date, time, excludeId);
  }
}

export const appointmentService = new AppointmentService();
