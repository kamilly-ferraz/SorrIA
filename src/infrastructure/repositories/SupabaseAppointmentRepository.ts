import { Appointment, AppointmentFilter, AppointmentStatus } from '@/domain/entities/Appointment';
import { IAppointmentRepository } from '@/domain/repositories/IAppointmentRepository';
import { AppointmentMapper, DbAppointment } from '@/infrastructure/mappers/AppointmentMapper';
import { supabase } from '@/services/api/SupabaseClient';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams,
  calculateOffset,
  createPaginatedResult 
} from '@/shared/types/Pagination';

export class SupabaseAppointmentRepository implements IAppointmentRepository {
  async findById(id: string, tenantId: string): Promise<Appointment | null> {
    // Busca direta com tenant_id explícito - ignora RLS para garantir resultados corretos
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      // Se for erro de "não encontrado", retorna null
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }
    if (!data) return null;

    return AppointmentMapper.fromDatabase(data as DbAppointment);
  }

  /**
   * @deprecated Use findAllPaginated para evitar colapso com grandes volumes
   */
  async findAll(filter: AppointmentFilter): Promise<Appointment[]> {
    let query = supabase
      .from('agendamentos')
      .select('*')
      .eq('tenant_id', filter.tenantId)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });

    if (filter.date) {
      query = query.eq('data', filter.date);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.patientId) {
      query = query.eq('paciente_id', filter.patientId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return AppointmentMapper.fromDatabaseList((data || []) as DbAppointment[]);
  }

  async findAllPaginated(
    filter: AppointmentFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Appointment>> {
    const { page, pageSize } = createPaginationParams(pagination.page, pagination.pageSize);
    const offset = calculateOffset(page, pageSize);

    let query = supabase
      .from('agendamentos')
      .select('*', { count: 'exact' })
      .eq('tenant_id', filter.tenantId)
      .order('data', { ascending: true })
      .order('horario', { ascending: true })
      .range(offset, offset + pageSize - 1);

    if (filter.date) {
      query = query.eq('data', filter.date);
    }

    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    if (filter.patientId) {
      query = query.eq('paciente_id', filter.patientId);
    }

    const { data, error, count } = await query;
    if (error) {
      console.error('[SupabaseAppointmentRepository] Erro ao buscar agendamentos:', error);
      throw error;
    }

    const total = count || 0;
    const appointments = AppointmentMapper.fromDatabaseList((data || []) as DbAppointment[]);

    return createPaginatedResult(appointments, total, page, pageSize);
  }

  async checkConflict(
    date: string, 
    time: string, 
    tenantId: string, 
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('agendamentos')
      .select('id')
      .eq('data', date)
      .eq('horario', time)
      .eq('tenant_id', tenantId)
      .neq('status', 'cancelado');

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data?.length ?? 0) > 0;
  }

  async create(appointment: Appointment): Promise<Appointment> {
    const dbData = AppointmentMapper.toDatabase(appointment);
    
    // Type assertion para evitar erros de tipagem do Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('agendamentos')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseAppointmentRepository] Erro ao criar agendamento:', error);
      throw error;
    }
    return AppointmentMapper.fromDatabase(data as DbAppointment);
  }

  async update(id: string, appointment: Partial<Appointment>): Promise<Appointment> {
    const dbData = AppointmentMapper.toDatabasePartial(appointment);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('agendamentos')
      .update(dbData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return AppointmentMapper.fromDatabase(data as DbAppointment);
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('agendamentos')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async cancel(id: string, tenantId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('agendamentos')
      .update({ status: 'cancelado' })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}

export const appointmentRepository = new SupabaseAppointmentRepository();
