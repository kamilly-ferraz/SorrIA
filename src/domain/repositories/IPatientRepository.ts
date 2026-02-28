import { Patient, PatientFilter } from '../entities/Patient';
import { PaginationParams, PaginatedResult } from '@/shared/types/Pagination';

export interface IPatientRepository {
  findById(id: string, tenantId: string): Promise<Patient | null>;
  
  findAll(filter: PatientFilter): Promise<Patient[]>;
  
  findAllPaginated(
    filter: PatientFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Patient>>;
  
  searchPaginated(
    term: string, 
    tenantId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Patient>>;
  
  create(patient: Patient): Promise<Patient>;
  
  update(id: string, patient: Partial<Patient>): Promise<Patient>;
  
  delete(id: string, tenantId: string): Promise<void>;
}
