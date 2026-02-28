import { Patient, PatientFilter } from '@/domain/entities/Patient';
import { IPatientRepository } from '@/domain/repositories/IPatientRepository';
import { PatientMapper, DbPatient } from '@/infrastructure/mappers/PatientMapper';
import { supabase } from '@/services/api/SupabaseClient';
import { 
  PaginationParams, 
  PaginatedResult,
  createPaginationParams,
  calculateOffset,
  createPaginatedResult 
} from '@/shared/types/Pagination';

export class SupabasePatientRepository implements IPatientRepository {

  async findById(id: string, tenantId: string): Promise<Patient | null> {
    // Busca direta com tenant_id explícito - ignora RLS para garantir resultados corretos
    const { data, error } = await supabase
      .from('pacientes')
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

    return PatientMapper.fromDatabase(data as DbPatient);
  }

  async findAll(filter: PatientFilter): Promise<Patient[]> {
    let query = supabase
      .from('pacientes')
      .select('*')
      .eq('tenant_id', filter.tenantId)
      .order('created_at', { ascending: false });

    if (filter.activeOnly) {
      query = query.eq('ativo', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return PatientMapper.fromDatabaseList((data || []) as DbPatient[]);
  }

  async findAllPaginated(
    filter: PatientFilter, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Patient>> {
    const { page, pageSize } = createPaginationParams(pagination.page, pagination.pageSize);
    const offset = calculateOffset(page, pageSize);
    
    console.log('[SupabasePatientRepository] Buscando pacientes com filtro:', {
      tenantId: filter.tenantId,
      activeOnly: filter.activeOnly,
      page,
      pageSize,
      offset,
    });
    
    let query = supabase
      .from('pacientes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', filter.tenantId)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (filter.activeOnly) {
      query = query.eq('ativo', true);
    }

    const { data, error, count } = await query;
    
    console.log('[SupabasePatientRepository] Resposta do banco:', {
      error,
      count,
      dataLength: data?.length,
    });
    
    if (error) {
      console.error('[SupabasePatientRepository] Erro ao buscar pacientes:', error);
      throw error;
    }

    const total = count || 0;
    const patients = PatientMapper.fromDatabaseList((data || []) as DbPatient[]);

    return createPaginatedResult(patients, total, page, pageSize);
  }

  async searchPaginated(
    term: string, 
    tenantId: string, 
    pagination: PaginationParams
  ): Promise<PaginatedResult<Patient>> {
    const { page, pageSize } = createPaginationParams(pagination.page, pagination.pageSize);
    const offset = calculateOffset(page, pageSize);

    const query = supabase
      .from('pacientes')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,cpf.ilike.%${term}%`)
      .order('nome', { ascending: true })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    const total = count || 0;
    const patients = PatientMapper.fromDatabaseList((data || []) as DbPatient[]);

    return createPaginatedResult(patients, total, page, pageSize);
  }

  async search(term: string, tenantId: string): Promise<Patient[]> {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .or(`nome.ilike.%${term}%,telefone.ilike.%${term}%,cpf.ilike.%${term}%`)
      .order('nome', { ascending: true });

    if (error) throw error;

    return PatientMapper.fromDatabaseList((data || []) as DbPatient[]);
  }

  async create(patient: Patient): Promise<Patient> {
    const dbData = PatientMapper.toDatabase(patient);
    
    console.log('[SupabasePatientRepository] Inserindo paciente no banco:', dbData);
    
    // Type assertion para evitar erros de tipagem do Supabase
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('pacientes')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('[SupabasePatientRepository] Erro ao criar paciente:', error);
      throw error;
    }
    
    console.log('[SupabasePatientRepository] Paciente inserido, resposta do banco:', data);
    
    return PatientMapper.fromDatabase(data as DbPatient);
  }

  async update(id: string, patient: Partial<Patient>): Promise<Patient> {
    const dbData = PatientMapper.toDatabasePartial(patient);
    
    // Busca primeiro para obter o tenant_id
    const existing = await this.findById(id, patient.tenantId || '');
    if (!existing) {
      throw new Error('Paciente não encontrado');
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('pacientes')
      .update(dbData)
      .eq('id', id)
      .eq('tenant_id', patient.tenantId)
      .select()
      .single();

    if (error) throw error;
    return PatientMapper.fromDatabase(data as DbPatient);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('pacientes')
      .update({ ativo: false })
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) throw error;
  }
}

export const patientRepository = new SupabasePatientRepository();
