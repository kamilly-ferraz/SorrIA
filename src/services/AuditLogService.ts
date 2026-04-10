import { auditLogRepository, CreateAuditLogInput } from '@/repositories/AuditLogRepository';

export class AuditLogService {
  async log(input: CreateAuditLogInput) {
    return auditLogRepository.create(input);
  }
}

export const auditLogService = new AuditLogService();
