import { Clock, FileText, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockAppointments } from '@/data/mockData';

export function NextPatientCard() {
  const next = mockAppointments.find((a) => a.status === 'aguardando');
  if (!next) return null;

  return (
    <div className="card-shadow rounded-2xl bg-card p-6">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        Próximo Paciente
      </h3>
      <div className="flex items-center gap-4">
        <Avatar className="h-14 w-14">
          <AvatarFallback className="bg-primary/10 text-lg font-bold text-primary">
            {next.paciente_nome.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="text-lg font-semibold text-card-foreground">{next.paciente_nome}</p>
          <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {next.horario}
            </span>
            <span>•</span>
            <span>{next.procedimento}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 flex gap-2">
        <Button size="sm" className="flex-1 gap-2 rounded-xl font-semibold">
          <Play className="h-3.5 w-3.5" />
          Iniciar Check-in
        </Button>
        <Button size="sm" variant="outline" className="flex-1 gap-2 rounded-xl">
          <FileText className="h-3.5 w-3.5" />
          Ver Prontuário
        </Button>
      </div>
    </div>
  );
}
