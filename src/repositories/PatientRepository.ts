import { supabase } from '@/integrations/supabase/client';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '@/types';

export class PatientRepository {
  async findByTenant(
    tenantId: string,
    search?: string
  ): Promise<Patient[]> {
    let query = supabase
      .from('patients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name');

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,phone.ilike.%${search}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Falha ao buscar pacientes: ${error.message}`);
    }

    if (data && data.length > 0) {
      await this.mapDentistNames(data);
    }

    return data || [];
  }

  async findById(id: string): Promise<Patient | null> {
    const { data, error } = await supabase
      .from('patients')
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
    input: CreatePatientInput
  ): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .insert({
        ...input,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao criar paciente: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    input: UpdatePatientInput
  ): Promise<Patient> {
    const { data, error } = await supabase
      .from('patients')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar paciente: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir paciente: ${error.message}`);
    }
  }

  async countByTenant(tenantId: string): Promise<number> {
    const { count, error } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    if (error) {
      throw new Error(`Falha ao contar pacientes: ${error.message}`);
    }

    return count || 0;
  }

  private async mapDentistNames(patients: Patient[]): Promise<void> {
    const dentistIds = [
      ...new Set(
        patients
          .map(p => p.dentist_id)
          .filter((id): id is string => id !== null)
      ),
    ];

    if (dentistIds.length === 0) {
      return;
    }

    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .in('user_id', dentistIds);

    if (!profiles) {
      return;
    }

    const profileMap = new Map(
      profiles.map(p => [p.user_id, p.full_name])
    );

    patients.forEach(patient => {
      if (patient.dentist_id) {
        patient.dentist_name = profileMap.get(patient.dentist_id) || null;
      }
    });
  }
}

export const patientRepository = new PatientRepository();
