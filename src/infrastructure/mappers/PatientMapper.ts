import { Patient } from '@/domain/entities/Patient';
import type { TablesInsert, TablesUpdate } from '@/integrations/supabase/Types';

export interface DbPatient {
  id: string;
  tenant_id: string;
  nome: string;
  telefone: string;
  data_nascimento?: string;
  cpf?: string;
  email?: string;
  observacoes?: string;
  historico_clinico?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export class PatientMapper {
  // Helper para validar datas do banco
  private static parseDate(dateString: string | undefined | null): Date | undefined {
    if (!dateString || dateString.trim() === '') {
      return undefined;
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return undefined;
    }
    return date;
  }

  static fromDatabase(data: DbPatient): Patient {
    // Validar data de nascimento
    const birthDate = this.parseDate(data.data_nascimento);
    
    // Validar datas de criação/atualização
    const createdAt = this.parseDate(data.created_at) || new Date();
    const updatedAt = this.parseDate(data.updated_at) || new Date();
    
    return new Patient(
      data.id,
      data.tenant_id,
      data.nome,
      data.telefone,
      birthDate,
      data.cpf,
      data.email,
      data.observacoes,
      data.historico_clinico,
      data.ativo,
      createdAt,
      updatedAt
    );
  }

  static fromDatabaseList(data: DbPatient[]): Patient[] {
    return data.map((item) => this.fromDatabase(item));
  }

  static toDatabase(patient: Patient): TablesInsert<'pacientes'> {
    // Validar birthDate antes de converter
    let data_nascimento: string | undefined;
    if (patient.birthDate instanceof Date && !isNaN(patient.birthDate.getTime())) {
      data_nascimento = patient.birthDate.toISOString().split('T')[0];
    }
    
    return {
      tenant_id: patient.tenantId,
      nome: patient.name,
      telefone: patient.phone,
      data_nascimento,
      cpf: patient.cpf,
      email: patient.email,
      observacoes: patient.observations,
      historico_clinico: patient.medicalHistory,
      ativo: patient.active,
    };
  }

  static toDatabasePartial(patient: Partial<Patient>): TablesUpdate<'pacientes'> {
    const result: TablesUpdate<'pacientes'> = {};
    
    if (patient.name !== undefined) result.nome = patient.name;
    if (patient.phone !== undefined) result.telefone = patient.phone;
    if (patient.birthDate !== undefined) {
      // Validar birthDate antes de converter
      if (patient.birthDate instanceof Date && !isNaN(patient.birthDate.getTime())) {
        result.data_nascimento = patient.birthDate.toISOString().split('T')[0];
      }
    }
    if (patient.cpf !== undefined) result.cpf = patient.cpf;
    if (patient.email !== undefined) result.email = patient.email;
    if (patient.observations !== undefined) result.observacoes = patient.observations;
    if (patient.medicalHistory !== undefined) result.historico_clinico = patient.medicalHistory;
    if (patient.active !== undefined) result.ativo = patient.active;
    
    return result;
  }
}
