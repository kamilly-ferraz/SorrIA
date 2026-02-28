import { Consultation, ConsultationFilter } from '@/domain/entities/Consultation';
import { PaginationParams, PaginatedResult } from '@/shared/types/Pagination';

export interface IConsultationRepository {
  findById(id: string, tenantId: string): Promise<Consultation | null>;
  
  findAll(filter: ConsultationFilter): Promise<Consultation[]>;
  
  findAllPaginated(
    filter: ConsultationFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Consultation>>;
  
  findByPatientPaginated(
    patientId: string, 
    tenantId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Consultation>>;
  
  findByPatient(patientId: string, tenantId: string): Promise<Consultation[]>;
  
  findByAppointment(appointmentId: string, tenantId: string): Promise<Consultation | null>;
  
  create(consultation: Consultation): Promise<Consultation>;
  
  update(id: string, consultation: Partial<Consultation>): Promise<Consultation>;
  
  delete(id: string, tenantId: string): Promise<void>;
}
