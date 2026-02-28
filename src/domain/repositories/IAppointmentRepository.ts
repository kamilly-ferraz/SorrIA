import { Appointment, AppointmentFilter } from '../entities/Appointment';
import { AppointmentStatus } from '../entities/Appointment';
import { PaginationParams, PaginatedResult } from '@/shared/types/Pagination';

export interface IAppointmentRepository {
  findById(id: string, tenantId: string): Promise<Appointment | null>;
  
  findAll(filter: AppointmentFilter): Promise<Appointment[]>;
  
  findAllPaginated(
    filter: AppointmentFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Appointment>>;
  
  checkConflict(date: string, time: string, tenantId: string, excludeId?: string): Promise<boolean>;
  
  create(appointment: Appointment): Promise<Appointment>;
  
  update(id: string, appointment: Partial<Appointment>): Promise<Appointment>;
  
  updateStatus(id: string, status: AppointmentStatus): Promise<void>;
  
  cancel(id: string, tenantId: string): Promise<void>;
}
