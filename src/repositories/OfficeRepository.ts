import { supabase } from '@/integrations/supabase/client';
import type {
  Office,
  CreateOfficeInput,
  UpdateOfficeInput,
} from '@/types';

export class OfficeRepository {
  async findByTenant(tenantId: string): Promise<Office[]> {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (error) {
      throw new Error(`Falha ao buscar consultórios: ${error.message}`);
    }

    return data || [];
  }

  async findById(id: string): Promise<Office | null> {
    const { data, error } = await supabase
      .from('offices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async create(tenantId: string, input: CreateOfficeInput): Promise<Office> {
    const { data, error } = await supabase
      .from('offices')
      .insert({
        ...input,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao criar consultório: ${error.message}`);
    }

    return data;
  }

  async update(id: string, input: UpdateOfficeInput): Promise<Office> {
    const { data, error } = await supabase
      .from('offices')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar consultório: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('offices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir consultório: ${error.message}`);
    }
  }

  async countActiveByTenant(tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('offices')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('active', true);

    if (error) {
      throw new Error(`Falha ao contar consultórios: ${error.message}`);
    }

    return count || 0;
  }
}

export const officeRepository = new OfficeRepository();
