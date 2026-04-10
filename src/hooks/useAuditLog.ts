import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useCallback } from 'react';
import { logger } from '@/lib/logger';

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
    try {
      await supabase.from('audit_logs' as any).insert({
        tenant_id: profile.tenant_id,
        user_id: user.id,
        user_role: role || null,
        action,
        table_name: tableName,
        entity: tableName,
        record_id: recordId || null,
        entity_id: recordId || null,
        details: details || null,
        metadata: details || null,
        description: description || null,
      });
    } catch (err) {
      logger.error('Audit log error:', err);
    }
  }, [user, profile, role]);

  return { logAction };
}
