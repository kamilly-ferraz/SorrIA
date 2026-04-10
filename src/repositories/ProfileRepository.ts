import { supabase } from '@/integrations/supabase/client';
import type { Profile } from '@/types';

export interface ProfileSummary {
  user_id: string;
  full_name: string;
}

export class ProfileRepository {
  async findByTenant(tenantId: string): Promise<ProfileSummary[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Falha ao buscar perfis: ${error.message}`);
    }

    return data || [];
  }

  async findByUserId(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async update(
    id: string,
    updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>
  ): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar perfil: ${error.message}`);
    }

    return data;
  }
}

export const profileRepository = new ProfileRepository();
