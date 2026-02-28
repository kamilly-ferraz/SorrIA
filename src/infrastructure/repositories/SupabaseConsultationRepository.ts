import { Consultation, ConsultationFilter } from '@/domain/entities/Consultation';
import { IConsultationRepository } from '@/domain/repositories/IConsultationRepository';
import { ConsultationMapper, DbConsultation } from '@/infrastructure/mappers/ConsultationMapper';
import { supabase } from '@/services/api/SupabaseClient';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams,
  calculateOffset,
  createPaginatedResult 
} from '@/shared/types/Pagination';

export class SupabaseConsultationRepository implements IConsultationRepository {
  async findById(id: string, tenantId: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return ConsultationMapper.fromDatabase(data as DbConsultation);
  }

  /**
   * @deprecated Use findAllPaginated para evitar colapso com grandes volumes
   */
  async findAll(filter: ConsultationFilter): Promise<Consultation[]> {
    let query = supabase
      .from('atendimentos')
      .select('*')
      .eq('tenant_id', filter.tenantId)
      .order('data_atendimento', { ascending: false });

    if (filter.patientId) {
      query = query.eq('paciente_id', filter.patientId);
    }

    if (filter.date) {
      query = query.eq('data_atendimento', filter.date);
    }

    if (filter.type) {
      query = query.eq('tipo', filter.type);
    }

    const { data, error } = await query;
    if (error) throw error;

    return ConsultationMapper.fromDatabaseList((data || []) as DbConsultation[]);
  }

  async findAllPaginated(
    filter: ConsultationFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Consultation>> {
    const { page, pageSize } = createPaginationParams(pagination.page, pagination.pageSize);
    const offset = calculateOffset(page, pageSize);

    let query = supabase
      .from('atendimentos')
      .select('*', { count: 'exact' })
      .eq('tenant_id', filter.tenantId)
      .order('data_atendimento', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filter.patientId) {
      query = query.eq('paciente_id', filter.patientId);
    }

    if (filter.date) {
      query = query.eq('data_atendimento', filter.date);
    }

    if (filter.type) {
      query = query.eq('tipo', filter.type);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const consultations = ConsultationMapper.fromDatabaseList((data || []) as DbConsultation[]);

    return createPaginatedResult(consultations, total, page, pageSize);
  }

  async findByPatientPaginated(
    patientId: string, 
    tenantId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Consultation>> {
    const { page, pageSize } = createPaginationParams(pagination.page, pagination.pageSize);
    const offset = calculateOffset(page, pageSize);

    const { data, error, count } = await supabase
      .from('atendimentos')
      .select('*', { count: 'exact' })
      .eq('paciente_id', patientId)
      .eq('tenant_id', tenantId)
      .order('data_atendimento', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const total = count || 0;
    const consultations = ConsultationMapper.fromDatabaseList((data || []) as DbConsultation[]);

    return createPaginatedResult(consultations, total, page, pageSize);
  }

  /**
   * @deprecated Use findByPatientPaginated para evitar colapso com grandes volumes
   */
  async findByPatient(patientId: string, tenantId: string): Promise<Consultation[]> {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('paciente_id', patientId)
      .eq('tenant_id', tenantId)
      .order('data_atendimento', { ascending: false });

    if (error) throw error;

    return ConsultationMapper.fromDatabaseList((data || []) as DbConsultation[]);
  }

  async findByAppointment(appointmentId: string, tenantId: string): Promise<Consultation | null> {
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('agendamento_id', appointmentId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) return null;

    return ConsultationMapper.fromDatabase(data as DbConsultation);
  }

  async create(consultation: Consultation): Promise<Consultation> {
    const dbData = ConsultationMapper.toDatabase(consultation);
    
    const { data, error } = await supabase
      .from('atendimentos')
      .insert(dbData)
      .select()
      .single();

    if (error) throw error;
    return ConsultationMapper.fromDatabase(data as DbConsultation);
  }

  async update(id: string, consultation: Partial<Consultation>): Promise<Consultation> {
    const dbData = ConsultationMapper.toDatabasePartial(consultation);
    
    const { data, error } = await supabase
      .from('atendimentos')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return ConsultationMapper.fromDatabase(data as DbConsultation);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const { error } = await supabase
      .from('atendimentos')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}

export const consultationRepository = new SupabaseConsultationRepository();
