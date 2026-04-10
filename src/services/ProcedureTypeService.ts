import { procedureTypeRepository } from '@/repositories/ProcedureTypeRepository';
import { auditLogRepository } from '@/repositories/AuditLogRepository';
import { Errors } from '@/domain';
import type { ProcedureType, CreateProcedureTypeInput, UpdateProcedureTypeInput } from '@/types';

export class ProcedureTypeService {
  getAll(tenantId: string): Promise<ProcedureType[]> {
    return procedureTypeRepository.findByTenant(tenantId);
  }

  async create({ input, tenantId, userId, userRole }: { input: CreateProcedureTypeInput; tenantId: string; userId: string; userRole: string }): Promise<ProcedureType> {
    if (!input.name?.trim()) throw Errors.requiredField('nome');

    const procedure = await procedureTypeRepository.create(tenantId, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'create', tableName: 'procedure_types',
      recordId: procedure.id,
      description: `Procedimento ${procedure.name} criado`,
    });

    return procedure;
  }

  async update(id: string, input: UpdateProcedureTypeInput, tenantId: string, userId: string, userRole: string): Promise<ProcedureType> {
    const existing = await procedureTypeRepository.findById(id);
    if (!existing) throw Errors.procedureTypeNotFound();

    const procedure = await procedureTypeRepository.update(id, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'update', tableName: 'procedure_types',
      recordId: id,
      description: `Procedimento ${procedure.name} atualizado`,
    });

    return procedure;
  }

  async delete(id: string, tenantId: string, userId: string, userRole: string): Promise<void> {
    const existing = await procedureTypeRepository.findById(id);
    if (!existing) throw Errors.procedureTypeNotFound();

    await procedureTypeRepository.delete(id);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'delete', tableName: 'procedure_types',
      recordId: id,
      description: `Procedimento ${existing.name} excluído`,
    });
  }
}

export const procedureTypeService = new ProcedureTypeService();
