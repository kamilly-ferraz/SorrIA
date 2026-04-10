import { patientRepository } from '@/repositories/PatientRepository';
import { appointmentRepository } from '@/repositories/AppointmentRepository';
import { officeRepository } from '@/repositories/OfficeRepository';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  activeOffices: number;
  todayDetails: unknown[];
}

export class DashboardService {
  async getStats(tenantId: string): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    
    const [patients, todayAppointments, activeOffices] = await Promise.all([
      patientRepository.countByTenant(tenantId),
      appointmentRepository.countByDate(tenantId, today),
      officeRepository.countActiveByTenant(tenantId),
    ]);

    return {
      totalPatients: patients,
      todayAppointments,
      activeOffices,
      todayDetails: [],
    };
  }

  async getChartData(tenantId: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const appointments = await appointmentRepository.findByDateRange(
      tenantId,
      startDate.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );

    const byStatus: { name: string; value: number }[] = [];
    const byProcedure: { name: string; value: number; fill: string }[] = [];

    const statusCount: Record<string, number> = {};
    const procedureCount: Record<string, { count: number; fill: string }> = {};

    appointments.forEach((apt: any) => {
      statusCount[apt.status] = (statusCount[apt.status] || 0) + 1;
      
      const procName = apt.procedure_types?.name || 'Outro';
      if (!procedureCount[procName]) {
        procedureCount[procName] = { count: 0, fill: apt.procedure_types?.color || '#6B7280' };
      }
      procedureCount[procName].count++;
    });

    Object.entries(statusCount).forEach(([name, value]) => {
      byStatus.push({ name, value });
    });

    Object.entries(procedureCount).forEach(([name, data]) => {
      byProcedure.push({ name, value: data.count, fill: data.fill });
    });

    return { byStatus, byProcedure };
  }
}

export const dashboardService = new DashboardService();
