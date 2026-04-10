export const APPOINTMENT_STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  checked_in: 'Check-in',
  waiting: 'Aguardando',
  in_progress: 'Em Atendimento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Falta',
};

export const APPOINTMENT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-info/10 text-info',
  confirmed: 'bg-blue-100 text-blue-700',
  checked_in: 'bg-purple-100 text-purple-700',
  waiting: 'bg-warning/10 text-warning',
  in_progress: 'bg-primary/10 text-primary',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  no_show: 'bg-orange-100 text-orange-700',
};
