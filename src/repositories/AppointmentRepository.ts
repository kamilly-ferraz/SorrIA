import { supabase } from '@/integrations/supabase/client';
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from '@/types';

export class AppointmentRepository {
  async findByDate(
    tenantId: string,
    date: string
  ): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients(name, phone),
        offices(name),
        procedure_types(name, color, duration)
      `)
      .eq('tenant_id', tenantId)
      .eq('appointment_date', date)
      .order('appointment_time');

    if (error) {
      throw new Error(`Falha ao buscar consultas: ${error.message}`);
    }

    if (data && data.length > 0) {
      await this.mapDentistNames(data);
    }

    return data || [];
  }

  async findByDateRange(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<Appointment[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients(name, phone),
        offices(name),
        procedure_types(name, color, duration)
      `)
      .eq('tenant_id', tenantId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate)
      .order('appointment_date')
      .order('appointment_time');

    if (error) {
      throw new Error(`Falha ao buscar consultas: ${error.message}`);
    }

    if (data && data.length > 0) {
      await this.mapDentistNames(data);
    }

    return data || [];
  }

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        patients(name, phone),
        offices(name),
        procedure_types(name, color, duration)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return null;
    }

    return data;
  }

  async create(
    tenantId: string,
    dentistId: string,
    createdBy: string,
    input: CreateAppointmentInput
  ): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .insert({
        ...input,
        tenant_id: tenantId,
        dentist_id: dentistId,
        created_by: createdBy,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao criar consulta: ${error.message}`);
    }

    return data;
  }

  async update(
    id: string,
    input: UpdateAppointmentInput
  ): Promise<Appointment> {
    const { data, error } = await supabase
      .from('appointments')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Falha ao atualizar consulta: ${error.message}`);
    }

    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Falha ao excluir consulta: ${error.message}`);
    }
  }

  async countByDate(
    tenantId: string,
    date: string
  ): Promise<number> {
    const { count, error } = await supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('appointment_date', date);

    if (error) {
      throw new Error(`Falha ao contar consultas: ${error.message}`);
    }

    return count || 0;
  }

  async findWithCheckTimes(
    tenantId: string,
    date: string
  ): Promise<Pick<Appointment, 'id' | 'status' | 'check_in_at' | 'check_out_at' | 'appointment_date'>[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, status, check_in_at, check_out_at, appointment_date')
      .eq('tenant_id', tenantId)
      .eq('appointment_date', date);

    if (error) {
      throw new Error(`Falha ao buscar consultas: ${error.message}`);
    }

    return data || [];
  }

  async findByStatusAndDateRange(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<{ status: string }[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('status')
      .eq('tenant_id', tenantId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    if (error) {
      throw new Error(`Falha ao buscar consultas: ${error.message}`);
    }

    return data || [];
  }

  async findProcedureDistribution(
    tenantId: string,
    startDate: string,
    endDate: string
  ): Promise<{ procedure_types: { name: string; color: string } }[]> {
    const { data, error } = await supabase
      .from('appointments')
      .select('procedure_types(name, color)')
      .eq('tenant_id', tenantId)
      .gte('appointment_date', startDate)
      .lte('appointment_date', endDate);

    if (error) {
      throw new Error(`Falha ao buscar distribuição de procedimentos: ${error.message}`);
    }

    return data || [];
  }

  private async mapDentistNames(appointments: Appointment[]): Promise<void> {
    const dentistIds = [
      ...new Set(
        appointments
          .map(a => a.dentist_id)
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

    appointments.forEach(appointment => {
      if (appointment.dentist_id) {
        appointment.dentist_name = profileMap.get(appointment.dentist_id) || null;
      }
    });
  }
}

export const appointmentRepository = new AppointmentRepository();
