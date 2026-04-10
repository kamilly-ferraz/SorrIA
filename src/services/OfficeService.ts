import { officeRepository } from '@/repositories/OfficeRepository';
import { auditLogRepository } from '@/repositories/AuditLogRepository';
import { Errors } from '@/domain';
import type { Office, CreateOfficeInput, UpdateOfficeInput } from '@/types';

export class OfficeService {
  getAll(tenantId: string): Promise<Office[]> {
    return officeRepository.findByTenant(tenantId);
  }

  async create({ input, tenantId, userId, userRole }: { input: CreateOfficeInput; tenantId: string; userId: string; userRole: string }): Promise<Office> {
    if (!input.name?.trim()) throw Errors.requiredField('nome');

    const office = await officeRepository.create(tenantId, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'create', tableName: 'offices',
      recordId: office.id,
      description: `Consultório ${office.name} criado`,
    });

    return office;
  }

  async update(id: string, input: UpdateOfficeInput, tenantId: string, userId: string, userRole: string): Promise<Office> {
    const existing = await officeRepository.findById(id);
    if (!existing) throw Errors.officeNotFound();

    const office = await officeRepository.update(id, input);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'update', tableName: 'offices',
      recordId: id,
      description: `Consultório ${office.name} atualizado`,
    });

    return office;
  }

  async delete(id: string, tenantId: string, userId: string, userRole: string): Promise<void> {
    const existing = await officeRepository.findById(id);
    if (!existing) throw Errors.officeNotFound();

    await officeRepository.delete(id);

    await auditLogRepository.create({
      tenantId, userId, userRole,
      action: 'delete', tableName: 'offices',
      recordId: id,
      description: `Consultório ${existing.name} excluído`,
    });
  }
}

export const officeService = new OfficeService();
