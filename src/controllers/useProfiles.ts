import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { profileRepository } from '@/repositories/ProfileRepository';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export interface ProfileSummary {
  user_id: string;
  full_name: string;
}

export function useTenantProfiles() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['tenant-profiles', tenantId],
    queryFn: () => tenantId ? profileRepository.findByTenant(tenantId) : Promise.resolve([] as ProfileSummary[]),
    enabled: !!tenantId,
  });
}
