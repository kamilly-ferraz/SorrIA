import { patientRepository } from '@/repositories/PatientRepository';
import { auditLogRepository } from '@/repositories/AuditLogRepository';
import { Errors } from '@/domain';
import type { Patient, CreatePatientInput, UpdatePatientInput } from '@/types';

interface CreatePatientWithDentist extends CreatePatientInput {
  dentist_id?: string;
}

interface CreateParams {
  input: CreatePatientWithDentist;
  tenantId: string;
  userId: string;
  userRole: string;
}

export class PatientService {
  getAll(tenantId: string, search?: string): Promise<Patient[]> {
    return patientRepository.findByTenant(tenantId, search);
  }

  getById(id: string): Promise<Patient | null> {
    return patientRepository.findById(id);
  }

  async create({ input, tenantId, userId, userRole }: CreateParams): Promise<Patient> {
    if (!input.name?.trim()) throw Errors.requiredField('nome');
    if (!input.lgpd_consent) throw Errors.lgpdConsentRequired();

    const dentistId = userRole === 'admin' ? input.dentist_id || userId : userId;
    const { dentist_id: _, ...rest } = input;

    const patient = await patientRepository.create(tenantId, {
      ...rest,
      dentist_id: dentistId,
    });

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'create', tableName: 'patients',
      recordId: patient.id,
      details: { name: patient.name },
      description: `Paciente ${patient.name} criado`,
    });

    return patient;
  }

  async update(id: string, input: UpdatePatientInput, tenantId: string, userId: string, userRole: string): Promise<Patient> {
    const existing = await patientRepository.findById(id);
    if (!existing) throw Errors.patientNotFound();

    const patient = await patientRepository.update(id, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'update', tableName: 'patients',
      recordId: id, details: input,
      description: `Paciente ${patient.name} atualizado`,
    });

    return patient;
  }

  async delete(id: string, tenantId: string, userId: string, userRole: string): Promise<void> {
    const existing = await patientRepository.findById(id);
    if (!existing) throw Errors.patientNotFound();

    await patientRepository.delete(id);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'delete', tableName: 'patients',
      recordId: id,
      description: `Paciente ${existing.name} excluído`,
    });
  }
}

export const patientService = new PatientService();
