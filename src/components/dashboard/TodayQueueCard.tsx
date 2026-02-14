import { mockAppointments } from '@/data/mockData';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  aguardando: { label: 'Aguardando', className: 'bg-warning/15 text-warning' },
  agendado: { label: 'Agendado', className: 'bg-info/15 text-info' },
  em_atendimento: { label: 'Em Atendimento', className: 'bg-success/15 text-success' },
  concluido: { label: 'Concluído', className: 'bg-muted text-muted-foreground' },
  cancelado: { label: 'Cancelado', className: 'bg-destructive/15 text-destructive' },
};

export function TodayQueueCard() {
  const today = mockAppointments.filter((a) => a.data === '2026-02-14');

  return (
    <div className="card-shadow rounded-2xl bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Fila de Hoje
        </h3>
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {today.length} pacientes
        </span>
      </div>
      <div className="space-y-3">
        {today.map((appt, i) => {
          const st = statusConfig[appt.status];
          return (
            <div
              key={appt.id}
              className="flex items-center gap-3 rounded-xl bg-secondary/50 px-4 py-3 transition-colors hover:bg-secondary animate-fade-in"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="w-12 text-sm font-semibold text-foreground">{appt.horario}</span>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-card-foreground">{appt.paciente_nome}</p>
                <p className="truncate text-xs text-muted-foreground">{appt.procedimento}</p>
              </div>
              <span className={cn('rounded-full px-2.5 py-1 text-xs font-medium', st.className)}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
