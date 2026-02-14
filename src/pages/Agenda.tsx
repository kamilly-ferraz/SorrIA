import { MainLayout } from '@/components/layout/MainLayout';
import { mockAppointments } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Calendar as CalIcon, Clock, MapPin } from 'lucide-react';

const statusConfig: Record<string, { label: string; dot: string; bg: string }> = {
  aguardando: { label: 'Aguardando', dot: 'bg-warning', bg: 'bg-warning/10' },
  agendado: { label: 'Agendado', dot: 'bg-info', bg: 'bg-info/10' },
  em_atendimento: { label: 'Em Atendimento', dot: 'bg-success', bg: 'bg-success/10' },
  concluido: { label: 'Concluído', dot: 'bg-muted-foreground', bg: 'bg-muted' },
  cancelado: { label: 'Cancelado', dot: 'bg-destructive', bg: 'bg-destructive/10' },
};

const Agenda = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <CalIcon className="mr-1 inline h-4 w-4" />
            Sexta-feira, 14 de fevereiro de 2026
          </p>
        </div>

        <div className="space-y-3">
          {mockAppointments.map((appt, i) => {
            const st = statusConfig[appt.status];
            return (
              <div
                key={appt.id}
                className="card-shadow flex items-center gap-5 rounded-2xl bg-card px-6 py-4 transition-all hover:card-shadow-hover animate-fade-in cursor-pointer"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground">{appt.horario.split(':')[0]}</span>
                  <span className="text-xs text-muted-foreground">:{appt.horario.split(':')[1]}</span>
                </div>
                <div className="h-12 w-px bg-border" />
                <div className="flex-1">
                  <p className="font-semibold text-card-foreground">{appt.paciente_nome}</p>
                  <p className="text-sm text-muted-foreground">{appt.procedimento}</p>
                </div>
                {appt.cadeira && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    Cadeira {appt.cadeira}
                  </span>
                )}
                <div className={cn('flex items-center gap-1.5 rounded-full px-3 py-1', st.bg)}>
                  <div className={cn('h-2 w-2 rounded-full', st.dot)} />
                  <span className="text-xs font-medium">{st.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Agenda;
