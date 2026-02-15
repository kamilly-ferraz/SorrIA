import { MainLayout } from '@/components/layout/MainLayout';
import { mockAppointments } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Calendar, Users } from 'lucide-react';

const statusConfig: Record<string, { label: string; className: string }> = {
  aguardando: { label: 'Aguardando', className: 'bg-warning/15 text-warning' },
  agendado: { label: 'Agendado', className: 'bg-info/15 text-info' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-success/15 text-success' },
  concluido: { label: 'Concluído', className: 'bg-muted text-muted-foreground' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive' },
};

const RelatorioAtendimentos = () => {
  const concluidos = mockAppointments.filter(a => a.status === 'concluido').length;
  const total = mockAppointments.length;

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatório de Atendimentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Histórico e métricas de atendimentos</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Agendamentos</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{total}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Concluídos</p>
            <p className="mt-1 text-2xl font-bold text-success">{concluidos}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Taxa Conclusão</p>
            <p className="mt-1 text-2xl font-bold text-primary">
              {total > 0 ? Math.round((concluidos / total) * 100) : 0}%
            </p>
          </div>
        </div>

        <div className="card-shadow rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Lista de Atendimentos</h3>
          <div className="space-y-3">
            {mockAppointments.map((appt, i) => {
              const st = statusConfig[appt.status];
              return (
                <div
                  key={appt.id}
                  className="flex items-center gap-4 rounded-xl bg-secondary/50 px-4 py-3 animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-bold text-foreground">{appt.horario.split(':')[0]}</span>
                    <span className="text-xs text-muted-foreground">:{appt.horario.split(':')[1]}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-card-foreground">{appt.paciente_nome}</p>
                    <p className="text-xs text-muted-foreground">{appt.procedimento}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', st.className)}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RelatorioAtendimentos;
