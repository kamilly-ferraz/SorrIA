import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { auditLogService } from '@/services/AuditLogService';

export function useAuditLog() {
  const { user, profile, role } = useAuth();

  const logAction = useCallback(async (
    action: string,
    tableName: string,
    recordId?: string,
    details?: Record<string, unknown>,
    description?: string
  ) => {
    if (!user || !profile?.tenant_id) return;
    await auditLogService.log({
      tenantId: profile.tenant_id,
      userId: user.id,
      userRole: role || undefined,
      action, tableName, recordId, details, description,
    });
  }, [user, profile, role]);

  return { logAction };
}
