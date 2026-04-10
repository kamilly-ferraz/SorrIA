import { supabase } from '@/integrations/supabase/client';
import type {
  ProcedureType,
  CreateProcedureTypeInput,
  UpdateProcedureTypeInput,
} from '@/types';

export class ProcedureTypeRepository {
  async findByTenant(tenantId: string): Promise<ProcedureType[]> {
    const { data, error } = await supabase
      .from('procedure_types')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      throw new Error(`Falha ao buscar procedimentos: ${error.message}`);
    }

    return data || [];
  }

  async findById(id: string): Promise<ProcedureType | null> {
    const { data, error } = await supabase
      .from('procedure_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async create(
    tenantId: string,
    input: CreateProcedureTypeInput
  ): Promise<ProcedureType> {
    const { data, error } = await supabase
      .from('procedure_types')
      .insert({
        ...input,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao criar procedimento: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    input: UpdateProcedureTypeInput
  ): Promise<ProcedureType> {
    const { data, error } = await supabase
      .from('procedure_types')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar procedimento: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('procedure_types')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir procedimento: ${error.message}`);
    }
  }
}

export const procedureTypeRepository = new ProcedureTypeRepository();
