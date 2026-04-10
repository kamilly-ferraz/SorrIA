// Regras de negócio centralizadas
import { Errors } from './errors';
import type { Appointment, AppointmentStatus } from '@/types';

export class AppointmentRules {
  // Dentistas que não podem ter consulta ao mesmo tempo
  static hasTimeConflict(
    existingAppointments: Appointment[],
    officeId: string,
    date: string,
    time: string,
    excludeId?: string
  ): boolean {
    return existingAppointments.some(apt =>
      apt.id !== excludeId &&
      apt.office_id === officeId &&
      apt.appointment_date === date &&
      apt.appointment_time === time &&
      !this.isCancelable(apt.status)
    );
  }

  static isCancelable(status: AppointmentStatus): boolean {
    return !['completed', 'cancelled', 'no_show'].includes(status);
  }

  static canChangeStatus(from: AppointmentStatus, to: AppointmentStatus): boolean {
    const validTransitions: Record<AppointmentStatus, AppointmentStatus[]> = {
      scheduled: ['confirmed', 'checked_in', 'cancelled', 'no_show'],
      confirmed: ['checked_in', 'cancelled', 'no_show'],
      checked_in: ['in_progress', 'waiting', 'cancelled', 'no_show'],
      waiting: ['in_progress', 'cancelled', 'no_show'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: [],
      no_show: [],
    };
    return validTransitions[from]?.includes(to) ?? false;
  }
}

export class PatientRules {
  static requiresLgpdConsent(): boolean {
    return true;
  }
}
