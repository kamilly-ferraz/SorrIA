import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { dashboardService } from '@/services/DashboardService';

function useTenantId() {
  const { profile } = useAuth();
  return profile?.tenant_id || null;
}

export function useDashboardStats() {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['dashboard-stats', tenantId],
    queryFn: () => tenantId ? dashboardService.getStats(tenantId) : Promise.resolve({
      totalPatients: 0, todayAppointments: 0, activeOffices: 0, todayDetails: [],
    }),
    enabled: !!tenantId,
    refetchInterval: 30000,
  });
}

export function useDashboardChartData(days = 30) {
  const tenantId = useTenantId();
  return useQuery({
    queryKey: ['dashboard-chart', tenantId, days],
    queryFn: () => tenantId ? dashboardService.getChartData(tenantId, days) : Promise.resolve({
      byStatus: [], byProcedure: [],
    }),
    enabled: !!tenantId,
    refetchInterval: 60000,
  });
}
