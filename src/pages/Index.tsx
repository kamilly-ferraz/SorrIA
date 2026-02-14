import { MainLayout } from '@/components/layout/MainLayout';
import { KPIGrid } from '@/components/dashboard/KPICards';
import { NextPatientCard } from '@/components/dashboard/NextPatientCard';
import { TodayQueueCard } from '@/components/dashboard/TodayQueueCard';
import { EfficiencyCard } from '@/components/dashboard/EfficiencyCard';

const Dashboard = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bom dia, Dra. Carolina 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sexta-feira, 14 de fevereiro de 2026 • 5 agendamentos hoje
          </p>
        </div>

        {/* KPIs */}
        <KPIGrid />

        {/* Grid: Next Patient + Efficiency | Queue */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <NextPatientCard />
            <EfficiencyCard />
          </div>
          <div className="lg:col-span-2">
            <TodayQueueCard />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
