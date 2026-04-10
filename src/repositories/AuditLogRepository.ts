import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface CreateAuditLogInput {
  tenantId: string;
  userId: string;
  userRole?: string;
  action: string;
  tableName: string;
  recordId?: string;
  details?: Record<string, unknown>;
  description?: string;
}

export class AuditLogRepository {
  async create(input: CreateAuditLogInput): Promise<void> {
    const { error } = await supabase.from('audit_logs' as any).insert({
      tenant_id: input.tenantId,
      user_id: input.userId,
      user_role: input.userRole || null,
      action: input.action,
      table_name: input.tableName,
      entity: input.tableName,
      record_id: input.recordId || null,
      entity_id: input.recordId || null,
      details: input.details || null,
      metadata: input.details || null,
      description: input.description || null,
    });

    if (error) {
      logger.error('Falha ao criar log de auditoria:', error);
    }
  }

  async findRecentByTenant(
    tenantId: string,
    limit: number = 10
  ): Promise<any[]> {
    const { data, error } = await supabase
      .from('audit_logs' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Falha ao buscar logs de auditoria: ${error.message}`);
    }

    return data || [];
  }
}

export const auditLogRepository = new AuditLogRepository();
