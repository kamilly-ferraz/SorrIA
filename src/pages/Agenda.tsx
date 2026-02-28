import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { cn } from '@/lib/utils';
import { 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  User,
  Plus,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
  isToday,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useAuth } from '@/hooks/useAuth';
import { usePatientUseCases, useAppointmentUseCases } from '@/application/ApplicationContext';
import { AppointmentStatus } from '@/domain/entities/Appointment';
import { createUseCaseContext, UserRole } from '@/application/useCases/UseCaseContext';
import { supabase } from '@/services/api/SupabaseClient';
import { queryClient, queryKeys } from '@/lib/queryClient';

interface PatientUI {
  id: string;
  nome: string;
}

interface AppointmentUI {
  id: string;
  tenantId: string;
  paciente_id: string;
  paciente_nome: string;
  data: string;
  horario: string;
  procedimento: string;
  status: string;
  cadeira?: string;
}

interface AppointmentFormData {
  paciente_id: string;
  data: string;
  horario: string;
  procedimento: string;
  cadeira: string;
  status: string;
}

type ViewMode = 'month' | 'week' | 'day';

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  aguardando: { label: 'Aguardando', color: 'text-amber-600', bg: 'bg-amber-100 border-amber-300' },
  agendado: { label: 'Agendado', color: 'text-primary', bg: 'bg-primary/20 border-primary' },
  agendada: { label: 'Agendada', color: 'text-primary', bg: 'bg-primary/20 border-primary' },
  em_atendimento: { label: 'Em Atendimento', color: 'text-green-600', bg: 'bg-green-100 border-green-300' },
  concluido: { label: 'Concluído', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' },
  realizada: { label: 'Realizada', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' },
  cancelado: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-100 border-red-300' },
  cancelada: { label: 'Cancelada', color: 'text-red-600', bg: 'bg-red-100 border-red-300' },
};

const hours = Array.from({ length: 12 }, (_, i) => i + 8);

const initialFormData: AppointmentFormData = {
  paciente_id: '',
  data: '',
  horario: '',
  procedimento: '',
  cadeira: '1',
  status: 'agendado',
};

const normalizeStatus = (status: string): string => {
  if (status === 'agendada') return 'agendado';
  if (status === 'realizada') return 'concluido';
  return status;
};

const Agenda = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [appointments, setAppointments] = useState<AppointmentUI[]>([]);
  const [patients, setPatients] = useState<PatientUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<AppointmentFormData>(initialFormData);
  const [conflictError, setConflictError] = useState<string | null>(null);
  const { addNotification } = useNotifications();
  
  const { tenantId } = useAuth();
  
  const { listPatientsUseCase } = usePatientUseCases();
  const { 
    scheduleAppointmentUseCase, 
    listAppointmentsUseCase, 
    cancelAppointmentUseCase 
  } = useAppointmentUseCases();

  useEffect(() => {
    if (tenantId) {
      fetchData();
    }
  }, [tenantId]);

  const fetchData = async () => {
    if (!tenantId) return;
    
    const context = createUseCaseContext({
      tenantId,
      userId: '',
      roles: [UserRole.ADMIN],
      correlationId: crypto.randomUUID(),
    });
    
    try {
      setLoading(true);
      
      const patientsResult = await listPatientsUseCase.execute({ 
        activeOnly: true,
        pagination: { page: 1, pageSize: 1000 }
      }, context);
      
      const patientsList = patientsResult.isOk() ? patientsResult.unwrap().data : [];
      setPatients(patientsList.map((p: any) => ({
        id: p.id,
        nome: p.name,
      })));

      const appointmentsResult = await listAppointmentsUseCase.execute({ 
        filter: { tenantId },
        pagination: { page: 1, pageSize: 1000 }
      }, context);
      
      if (appointmentsResult.isOk()) {
        const appointmentsList = appointmentsResult.unwrap().data;
        const appointmentsWithNames = appointmentsList.map((appt: any) => ({
          id: appt.id,
          tenantId: appt.tenantId,
          paciente_id: appt.patientId,
          paciente_nome: patientsList.find((p: any) => p.id === appt.patientId)?.name || 'Paciente',
          data: appt.date,
          horario: appt.time,
          procedimento: appt.procedure,
          status: normalizeStatus(appt.status),
          cadeira: appt.chair?.toString(),
        }));
        setAppointments(appointmentsWithNames);
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const goToNext = () => {
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const goToPrev = () => {
    if (viewMode === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else setCurrentDate(subDays(currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const getAppointmentsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointments.filter(appt => appt.data === dateStr);
  };

  const getAppointmentForTime = (date: Date, hour: number) => {
    const dayAppointments = getAppointmentsForDay(date);
    return dayAppointments.find((appt): boolean => {
      if (!appt.horario) return false;
      const parts = String(appt.horario).split(':');
      if (!parts[0]) return false;
      const apptHour = parseInt(parts[0]);
      return apptHour === hour;
    });
  };

  const checkConflict = async (): Promise<boolean> => {
    // Verificação de conflito desabilitada temporariamente
    // O método checkConflict não existe no useCase
    return false;
  };

  const getAutoStatus = (): string => {
    const now = new Date();
    const appointmentDateTime = new Date(`${formData.data}T${formData.horario}`);
    const timeDiff = now.getTime() - appointmentDateTime.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    if (minutesDiff >= -5 && minutesDiff <= 30) {
      return 'agendado';
    }
    if (minutesDiff > 30) {
      return 'agendado';
    }
    return 'agendado';
  };

  const handleSaveAppointment = async () => {
    if (!formData.paciente_id || !formData.data || !formData.horario || !formData.procedimento || !tenantId) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const hasConflict = await checkConflict();
    if (hasConflict) return;

    const selectedPatient = patients.find(p => p.id === formData.paciente_id);
    const autoStatus = getAutoStatus();
    
    try {
       
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apptResult: any = await scheduleAppointmentUseCase.execute({
        patientId: formData.paciente_id,
        date: formData.data,
        time: formData.horario,
        procedure: formData.procedimento,
        chair: parseInt(formData.cadeira) || undefined,
        status: autoStatus as AppointmentStatus,
      }, tenantId);
      
      const appointmentUI: AppointmentUI = {
        id: apptResult.id,
        tenantId: apptResult.tenantId,
        paciente_id: apptResult.patientId,
        paciente_nome: selectedPatient?.nome || 'Paciente',
        data: apptResult.date,
        horario: apptResult.time,
        procedimento: apptResult.procedure,
        status: normalizeStatus(apptResult.status),
        cadeira: apptResult.chair?.toString(),
      };
      
      setAppointments([...appointments, appointmentUI]);
      if (tenantId) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(tenantId) });
      }
      addNotification('appointment', 'Novo agendamento', `Agendamento criado para ${selectedPatient?.nome} às ${appointmentUI.horario}`);
      toast.success('Agendamento criado com sucesso');
      setIsDialogOpen(false);
      setFormData(initialFormData);
      setConflictError(null);
    } catch (error) {
      console.error('Erro ao salvar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    if (!tenantId) return;
    
    const previousAppointments = appointments;
    setAppointments(prev => prev.map(appt =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      appt.id === appointmentId ? { ...appt, status: newStatus as any } : appt
    ));

    try {
      if (newStatus === 'cancelado' || newStatus === 'cancelada') {
        await cancelAppointmentUseCase.execute(appointmentId, tenantId);
      } else {
        const { error } = await supabase
          .from('agendamentos')
          .update({ status: newStatus })
          .eq('id', appointmentId)
          .eq('tenant_id', tenantId);

        if (error) throw error;
      }

      await queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all(tenantId) });
      toast.success('Status atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setAppointments(previousAppointments);
      toast.error('Erro ao atualizar status');
    }
  };

  const statusOptions = ['agendado', 'aguardando', 'em_atendimento', 'concluido', 'cancelado'] as const;

  const renderStatusSelect = (appt: AppointmentUI) => (
    <Select
      value={normalizeStatus(appt.status)}
      onValueChange={(value) => handleStatusChange(appt.id, value)}
    >
      <SelectTrigger className="h-7 w-[140px] bg-white/80 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {statusOptions.map((status) => (
          <SelectItem key={status} value={status}>
            {statusConfig[status]?.label || status}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  const renderMonthView = () => {
    const days = getMonthDays();
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="flex flex-col h-full">
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(day => (
            <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 flex-1">
          {days.map((day, idx) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div
                key={idx}
                className={cn(
                  "min-h-[100px] border-b border-r p-1 cursor-pointer transition-colors hover:bg-muted/50",
                  !isCurrentMonth && "bg-muted/30"
                )}
              >
                <div className={cn(
                  "text-sm font-medium mb-1",
                  isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                  isToday(day) && "bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center"
                )}>
                  {format(day, 'd')}
                </div>
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map(appt => {
                    const st = statusConfig[appt.status];
                    return (
                      <div 
                        key={appt.id} 
                        className={cn("text-xs px-1 py-0.5 rounded truncate", st?.bg)}
                        title={`${appt.horario} - ${appt.paciente_nome}`}
                      >
                        <span className="font-medium">{appt.horario}</span> {appt.paciente_nome}
                      </div>
                    );
                  })}
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-muted-foreground pl-1">
                      +{dayAppointments.length - 3} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const days = getWeekDays();
    
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className="grid grid-cols-8 border-b sticky top-0 bg-background z-10">
          <div className="w-16 border-r p-2"></div>
          {days.map(day => (
            <div 
              key={day.toISOString()} 
              className={cn(
                "text-center p-2 border-r",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className="text-xs text-muted-foreground uppercase">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className={cn(
                "text-lg font-semibold",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex-1">
          {hours.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[60px] border-b">
              <div className="w-16 border-r p-1 text-xs text-muted-foreground text-right pr-2 pt-1">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map(day => {
                const appt = getAppointmentForTime(day, hour);
                const st = appt ? statusConfig[appt.status] : null;
                
                return (
                  <div 
                    key={`${day.toISOString()}-${hour}`} 
                    className={cn(
                      "border-r p-0.5 relative",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {appt && st && (
                      <div className={cn(
                        "h-full rounded p-1 text-xs cursor-pointer hover:opacity-80 transition-opacity",
                        st.bg
                      )}>
                        <div className="flex items-center justify-between gap-1">
                          <div className="font-semibold">{appt.horario}</div>
                          {renderStatusSelect(appt)}
                        </div>
                        <div className="truncate">{appt.paciente_nome}</div>
                        <div className="truncate text-muted-foreground">{appt.procedimento}</div>
                        {appt.cadeira && (
                          <div className="flex items-center gap-0.5 mt-0.5">
                            <MapPin className="h-2.5 w-2.5" />
                            <span>Cadeira {appt.cadeira}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayAppointments = getAppointmentsForDay(currentDate);
    
    return (
      <div className="flex flex-col h-full overflow-auto">
        <div className={cn(
          "text-center p-4 border-b",
          isToday(currentDate) && "bg-primary/5"
        )}>
          <div className="text-sm text-muted-foreground uppercase">
            {format(currentDate, 'EEEE', { locale: ptBR })}
          </div>
          <div className={cn(
            "text-3xl font-bold",
            isToday(currentDate) && "text-primary"
          )}>
            {format(currentDate, 'd')} de {format(currentDate, 'MMMM', { locale: ptBR })}
          </div>
        </div>
        
        <div className="flex-1">
          {hours.map(hour => {
            const appt = getAppointmentForTime(currentDate, hour);
            const st = appt ? statusConfig[appt.status] : null;
            
            return (
              <div key={hour} className="grid grid-cols-[60px_1fr] min-h-[80px] border-b">
                <div className="border-r p-2 text-sm text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="p-1 relative">
                  {appt && st && (
                    <div className={cn(
                      "h-full rounded-lg p-3 cursor-pointer hover:opacity-90 transition-opacity",
                      st.bg
                    )}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-lg">{appt.horario}</span>
                        {renderStatusSelect(appt)}
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{appt.paciente_nome}</span>
                      </div>
                      <div className="text-sm text-muted-foreground mb-2">{appt.procedimento}</div>
                      {appt.cadeira && (
                        <div className="flex items-center gap-1 text-sm">
                          <MapPin className="h-4 w-4" />
                          <span>Cadeira {appt.cadeira}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy', { locale: ptBR });
    } else if (viewMode === 'week') {
      const days = getWeekDays();
      const firstDay = days[0];
      const lastDay = days[6];
      if (!firstDay || !lastDay) return '';
      return `${format(firstDay, 'd')} - ${format(lastDay, 'd MMM yyyy', { locale: ptBR })}`;
    } else {
      return format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR });
    }
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Agenda
            </h1>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={goToPrev} className="h-8 w-8 p-0 rounded-lg">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNext} className="h-8 w-8 p-0 rounded-lg">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="ml-2 rounded-lg">
                Hoje
              </Button>
            </div>
            <span className="text-lg font-medium capitalize text-muted-foreground">
              {getHeaderTitle()}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              className="rounded-lg font-medium"
              onClick={() => setIsDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Agendamento
            </Button>
            
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
              <Button
                variant={viewMode === 'month' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className={viewMode === 'month' ? 'rounded-md' : 'text-muted-foreground rounded-md'}
              >
                Mês
              </Button>
              <Button
                variant={viewMode === 'week' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className={viewMode === 'week' ? 'rounded-md' : 'text-muted-foreground rounded-md'}
              >
                Semana
              </Button>
              <Button
                variant={viewMode === 'day' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('day')}
                className={viewMode === 'day' ? 'rounded-md' : 'text-muted-foreground rounded-md'}
              >
                Dia
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 border rounded-xl overflow-hidden bg-background">
            {viewMode === 'month' && renderMonthView()}
            {viewMode === 'week' && renderWeekView()}
            {viewMode === 'day' && renderDayView()}
          </div>
        )}

        <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
          <span className="text-xs font-medium">Legenda:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span>Aguardando</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span>Agendado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Em Atendimento</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>Cancelado</span>
          </div>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="paciente">Paciente *</Label>
              <Select 
                value={formData.paciente_id} 
                onValueChange={(v) => setFormData({ ...formData, paciente_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="data">Data *</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => {
                    setFormData({ ...formData, data: e.target.value });
                    setConflictError(null);
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="horario">Horário *</Label>
                <Input
                  id="horario"
                  type="time"
                  value={formData.horario}
                  onChange={(e) => {
                    setFormData({ ...formData, horario: e.target.value });
                    setConflictError(null);
                  }}
                />
              </div>
            </div>
            
            {conflictError && (
              <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-2 rounded">
                <AlertCircle className="h-4 w-4" />
                {conflictError}
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="procedimento">Procedimento *</Label>
              <Input
                id="procedimento"
                value={formData.procedimento}
                onChange={(e) => setFormData({ ...formData, procedimento: e.target.value })}
                placeholder="Ex: Limpeza, Restauração, Consulta..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="cadeira">Cadeira</Label>
              <Select 
                value={formData.cadeira} 
                onValueChange={(v) => setFormData({ ...formData, cadeira: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Cadeira 1</SelectItem>
                  <SelectItem value="2">Cadeira 2</SelectItem>
                  <SelectItem value="3">Cadeira 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setConflictError(null);
            }}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAppointment}>
              Agendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Agenda;
