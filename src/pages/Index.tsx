import { MainLayout } from '@/components/layout/MainLayout';
import { KPICard } from '@/components/dashboard/KPICards';
import { NextPatientCard } from '@/components/dashboard/NextPatientCard';
import { TodayQueueCard } from '@/components/dashboard/TodayQueueCard';
import { EfficiencyCard } from '@/components/dashboard/EfficiencyCard';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, Users, AlertTriangle, Calendar, TrendingUp, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Dashboard = () => {
  const { profile, role } = useAuth();
  const nome = profile?.nome?.split(' ')[0] || 'Usuário';

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bom dia, {nome} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {role === 'admin' ? <AdminDashboard /> : <DentistaDashboard />}
      </div>
    </MainLayout>
  );
};

function AdminDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard title="Faturamento Hoje" value="R$ 1.650" subtitle="Meta: R$ 3.500" icon={DollarSign} trend="+12% vs. ontem" variant="success" />
        <KPICard title="Faturamento Mensal" value="R$ 42.800" subtitle="Meta: R$ 60.000" icon={TrendingUp} variant="default" />
        <KPICard title="Pacientes Atendidos" value="3 / 8" subtitle="5 restantes" icon={Users} variant="info" />
        <KPICard title="Alertas de Estoque" value="2" subtitle="Itens abaixo do nível" icon={AlertTriangle} variant="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <NextPatientCard />
          <EfficiencyCard />
          <div className="flex flex-col gap-2">
            <Link to="/relatorios/financeiro">
              <Button variant="outline" className="w-full gap-2 rounded-xl">
                <BarChart3 className="h-4 w-4" />
                Ver Relatório Financeiro
              </Button>
            </Link>
            <Link to="/relatorios/atendimentos">
              <Button variant="outline" className="w-full gap-2 rounded-xl">
                <Users className="h-4 w-4" />
                Ver Relatório de Atendimentos
              </Button>
            </Link>
          </div>
        </div>
        <div className="lg:col-span-2">
          <TodayQueueCard />
        </div>
      </div>
    </>
  );
}

function DentistaDashboard() {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KPICard title="Pacientes Hoje" value="3 / 8" subtitle="5 restantes" icon={Users} variant="info" />
        <KPICard title="Próximos Agendamentos" value="5" subtitle="Hoje" icon={Calendar} variant="default" />
        <KPICard title="Atendimentos do Mês" value="47" subtitle="Fevereiro 2026" icon={TrendingUp} trend="+8% vs. mês anterior" variant="success" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <NextPatientCard />
          <Link to="/relatorios/atendimentos">
            <Button variant="outline" className="w-full gap-2 rounded-xl">
              <BarChart3 className="h-4 w-4" />
              Ver Minha Performance
            </Button>
          </Link>
        </div>
        <div className="lg:col-span-2">
          <TodayQueueCard />
        </div>
      </div>
    </>
  );
}

export default Dashboard;
