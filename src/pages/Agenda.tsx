import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Unlink, UserCheck, Play, CheckCircle2, XCircle, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppointmentsByRange, useCreateAppointment, useUpdateAppointment, useDeleteAppointment, usePatients, useOffices, useProcedureTypes } from '@/hooks/useTenantData';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/lib/constants';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import PageHeader from '@/components/PageHeader';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isBefore, startOfDay, addWeeks, addMonths, subWeeks, subMonths, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { logger } from '@/lib/logger';

type ViewMode = 'day' | 'week' | 'month';

type AppointmentStatus = 'scheduled' | 'checked_in' | 'waiting' | 'in_progress' | 'completed' | 'cancelled' | 'confirmed' | 'no_show';

interface AptForm {
  patient_id: string;
  office_id: string;
  procedure_type_id: string;
  appointment_date: string;
  appointment_time: string;
  notes: string;
  status: AppointmentStatus;
}

const emptyForm: AptForm = { patient_id: '', office_id: '', procedure_type_id: '', appointment_date: '', appointment_time: '09:00', notes: '', status: 'scheduled' };

export default function Agenda() {
  const [view, setView] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<AptForm>(emptyForm);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const { data: patients } = usePatients();
  const { data: offices } = useOffices();
  const { data: procTypes } = useProcedureTypes();
  const createApt = useCreateAppointment();
  const updateApt = useUpdateAppointment();
  const deleteApt = useDeleteAppointment();
  const gcal = useGoogleCalendar();

  const dateRange = useMemo(() => {
    if (view === 'day') return { start: currentDate, end: currentDate };
    if (view === 'week') return { start: startOfWeek(currentDate, { weekStartsOn: 1 }), end: endOfWeek(currentDate, { weekStartsOn: 1 }) };
    return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
  }, [view, currentDate]);

  const startStr = format(dateRange.start, 'yyyy-MM-dd');
  const endStr = format(dateRange.end, 'yyyy-MM-dd');
  const { data: appointments } = useAppointmentsByRange(startStr, endStr);

  const navigate = (dir: number) => {
    if (view === 'day') setCurrentDate(prev => dir > 0 ? addDays(prev, 1) : subDays(prev, 1));
    else if (view === 'week') setCurrentDate(prev => dir > 0 ? addWeeks(prev, 1) : subWeeks(prev, 1));
    else setCurrentDate(prev => dir > 0 ? addMonths(prev, 1) : subMonths(prev, 1));
  };

  const handleSave = async () => {
    if (!form.patient_id || !form.office_id || !form.procedure_type_id || !form.appointment_date || !form.appointment_time) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    // Valida: sem datas passadas para novos agendamentos
    if (!editing && isBefore(new Date(form.appointment_date + 'T23:59:59'), startOfDay(new Date()))) {
      toast({ title: 'Não é possível agendar em datas passadas', variant: 'destructive' });
      return;
    }
    const conflicting = appointments?.find((a: any) =>
      a.id !== editing &&
      a.office_id === form.office_id &&
      a.appointment_date === form.appointment_date &&
      a.appointment_time === form.appointment_time &&
      a.status !== 'cancelled' && a.status !== 'no_show'
    );
    if (conflicting) {
      toast({ title: 'Conflito de horário neste consultório', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updateApt.mutateAsync({ id: editing, ...form } as any);
        await logAction('update', 'appointments', editing, { status: form.status }, `Consulta atualizada`);
        toast({ title: 'Consulta atualizada' });
      } else {
        const result = await createApt.mutateAsync(form as any);
        await logAction('create', 'appointments', (result as any)?.id, { patient_id: form.patient_id }, `Consulta agendada`);
        if (gcal.connected && result) {
          try {
            const patient = patients?.find((p: any) => p.id === form.patient_id);
            const proc = procTypes?.find((t: any) => t.id === form.procedure_type_id);
            const office = offices?.find((o: any) => o.id === form.office_id);
            await gcal.createEvent({
              patient_name: patient?.name || '',
              procedure_name: proc?.name || '',
              office_name: office?.name || '',
              date: form.appointment_date,
              time: form.appointment_time,
              duration: proc?.duration || 30,
              notes: form.notes,
            });
          } catch (err) {
            logger.error('GCal sync error:', err);
          }
        }
        toast({ title: 'Consulta agendada' });
      }
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (aptId: string, newStatus: string) => {
    try {
      const updateData: any = { id: aptId, status: newStatus };
      if (newStatus === 'in_progress') updateData.check_in_at = new Date().toISOString();
      if (newStatus === 'completed') updateData.check_out_at = new Date().toISOString();
      await updateApt.mutateAsync(updateData);
      await logAction(newStatus === 'cancelled' ? 'cancel' : newStatus === 'no_show' ? 'no_show' : newStatus, 'appointments', aptId, { status: newStatus }, `Consulta: ${APPOINTMENT_STATUS_LABELS[newStatus]}`);
      toast({ title: `Status: ${APPOINTMENT_STATUS_LABELS[newStatus]}` });
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    }
  };

  const handleEditApt = (apt: any) => {
    setForm({
      patient_id: apt.patient_id,
      office_id: apt.office_id,
      procedure_type_id: apt.procedure_type_id,
      appointment_date: apt.appointment_date,
      appointment_time: apt.appointment_time,
      notes: apt.notes || '',
      status: apt.status,
    });
    setEditing(apt.id);
    setOpen(true);
  };

  const openNew = (date?: Date) => {
    setForm({ ...emptyForm, appointment_date: format(date || currentDate, 'yyyy-MM-dd') });
    setEditing(null);
    setOpen(true);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 7);

  const titleText = view === 'day'
    ? format(currentDate, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : view === 'week'
    ? `${format(dateRange.start, 'dd MMM', { locale: ptBR })} — ${format(dateRange.end, 'dd MMM yyyy', { locale: ptBR })}`
    : format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });

  const statusActions = (apt: any) => {
    const s = apt.status as AppointmentStatus;
    const buttons: { label: string; status: AppointmentStatus; icon: any; variant: any }[] = [];
    if (s === 'scheduled' || s === 'confirmed') buttons.push({ label: 'Check-in', status: 'checked_in', icon: UserCheck, variant: 'outline' as const });
    if (s === 'checked_in' || s === 'waiting') buttons.push({ label: 'Iniciar', status: 'in_progress', icon: Play, variant: 'outline' as const });
    if (s === 'in_progress') buttons.push({ label: 'Finalizar', status: 'completed', icon: CheckCircle2, variant: 'default' as const });
    if (s !== 'completed' && s !== 'cancelled' && s !== 'no_show') {
      buttons.push({ label: 'Falta', status: 'no_show', icon: UserX, variant: 'outline' as const });
      buttons.push({ label: 'Cancelar', status: 'cancelled', icon: XCircle, variant: 'destructive' as const });
    }
    return buttons;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Agenda"
        description="Gerencie as consultas da clínica"
        action={
          <div className="flex items-center gap-2 flex-wrap">
            {gcal.connected ? (
              <div className="flex items-center gap-1">
                <Badge variant="secondary" className="bg-green-100 text-green-700">Google Calendar conectado</Badge>
                <Button variant="ghost" size="sm" onClick={gcal.disconnect} title="Desconectar"><Unlink className="h-3.5 w-3.5" /></Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={gcal.connect} disabled={gcal.loading}>Conectar Google Calendar</Button>
            )}
            <Button onClick={() => openNew()}><Plus className="mr-2 h-4 w-4" /> Nova Consulta</Button>
          </div>
        }
      />

      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(1)}><ChevronRight className="h-4 w-4" /></Button>
          <span className="ml-4 text-lg font-semibold text-foreground capitalize">{titleText}</span>
        </div>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['day', 'week', 'month'] as ViewMode[]).map((v) => (
            <Button key={v} variant={view === v ? 'default' : 'ghost'} size="sm" onClick={() => setView(v)}>
              {{ day: 'Dia', week: 'Semana', month: 'Mês' }[v]}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar views */}
      {view === 'month' ? (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-px">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d) => (
                <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {days.map((day) => {
                const dayAppts = appointments?.filter((a: any) => a.appointment_date === format(day, 'yyyy-MM-dd')) || [];
                return (
                  <div key={day.toISOString()} className={`min-h-[100px] border border-border/30 rounded-md p-2 cursor-pointer hover:bg-muted/30 transition-colors ${isToday(day) ? 'bg-primary/5 border-primary/30' : ''}`} onClick={() => { setCurrentDate(day); setView('day'); }}>
                    <span className={`text-sm font-medium ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</span>
                    <div className="mt-1 space-y-1">
                      {dayAppts.slice(0, 3).map((a: any) => (
                        <div key={a.id} className="rounded px-1 py-0.5 text-xs truncate text-white" style={{ backgroundColor: a.procedure_types?.color || '#3B82F6' }}>
                          {a.appointment_time?.slice(0, 5)} {a.patients?.name}
                        </div>
                      ))}
                      {dayAppts.length > 3 && <span className="text-xs text-muted-foreground">+{dayAppts.length - 3}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50 shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid border-b border-border/50" style={{ gridTemplateColumns: `80px repeat(${view === 'day' ? 1 : 7}, 1fr)` }}>
                <div className="p-3 text-xs text-muted-foreground" />
                {(view === 'day' ? [currentDate] : days.slice(0, 7)).map((day) => (
                  <div key={day.toISOString()} className={`p-3 text-center border-l border-border/30 ${isToday(day) ? 'bg-primary/5' : ''}`}>
                    <div className="text-xs text-muted-foreground">{format(day, 'EEE', { locale: ptBR })}</div>
                    <div className={`text-lg font-semibold ${isToday(day) ? 'text-primary' : 'text-foreground'}`}>{format(day, 'd')}</div>
                  </div>
                ))}
              </div>
              {hours.map((hour) => (
                <div key={hour} className="grid border-b border-border/20" style={{ gridTemplateColumns: `80px repeat(${view === 'day' ? 1 : 7}, 1fr)` }}>
                  <div className="p-2 text-right text-xs text-muted-foreground pr-4">{String(hour).padStart(2, '0')}:00</div>
                  {(view === 'day' ? [currentDate] : days.slice(0, 7)).map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const slotAppts = appointments?.filter((a: any) =>
                      a.appointment_date === dateStr && parseInt(a.appointment_time?.split(':')[0]) === hour
                    ) || [];
                    return (
                      <div key={day.toISOString()} className="min-h-[60px] border-l border-border/20 p-1 cursor-pointer hover:bg-muted/20" onClick={() => openNew(day)}>
                        {slotAppts.map((a: any) => (
                          <div key={a.id} className="rounded-md px-2 py-1 mb-1 text-xs cursor-pointer text-white shadow-sm" style={{ backgroundColor: a.procedure_types?.color || '#3B82F6' }} onClick={(e) => { e.stopPropagation(); handleEditApt(a); }}>
                            <div className="font-medium">{a.appointment_time?.slice(0, 5)} {a.patients?.name}</div>
                            <div className="opacity-80">{a.procedure_types?.name}</div>
                            <Badge variant="secondary" className="mt-0.5 text-[10px] px-1 py-0 bg-white/20 text-white border-0">
                              {APPOINTMENT_STATUS_LABELS[a.status]}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointment Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Consulta' : 'Nova Consulta'}</DialogTitle>
            <DialogDescription>Preencha os dados da consulta abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Paciente *</Label>
              <Select value={form.patient_id} onValueChange={(v) => setForm({ ...form, patient_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o paciente" /></SelectTrigger>
                <SelectContent>{patients?.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Procedimento *</Label>
              <Select value={form.procedure_type_id} onValueChange={(v) => setForm({ ...form, procedure_type_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o procedimento" /></SelectTrigger>
                <SelectContent>
                  {procTypes?.filter((t: any) => t.active).map((t: any) => (
                    <SelectItem key={t.id} value={t.id}>
                      <span className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full inline-block" style={{ backgroundColor: t.color }} />
                        {t.name} ({t.duration}min)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Consultório *</Label>
              <Select value={form.office_id} onValueChange={(v) => setForm({ ...form, office_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione o consultório" /></SelectTrigger>
                <SelectContent>{offices?.filter((o: any) => o.active).map((o: any) => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={form.appointment_date} min={!editing ? new Date().toISOString().split('T')[0] : undefined} onChange={(e) => setForm({ ...form, appointment_date: e.target.value })} />
              </div>
              <div>
                <Label>Hora *</Label>
                <Input type="time" value={form.appointment_time} onChange={(e) => setForm({ ...form, appointment_time: e.target.value })} />
              </div>
            </div>

            {editing && (
              <>
                <div>
                  <Label>Status</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(() => {
                      const apt = appointments?.find((a: any) => a.id === editing);
                      if (!apt) return null;
                      return statusActions(apt).map((action) => (
                        <Button key={action.status} variant={action.variant} size="sm" onClick={() => { handleStatusChange(editing, action.status); setForm({ ...form, status: action.status }); }} className="gap-1">
                          <action.icon className="h-3.5 w-3.5" />{action.label}
                        </Button>
                      ));
                    })()}
                  </div>
                  <Badge variant="secondary" className={`mt-2 ${APPOINTMENT_STATUS_COLORS[form.status]}`}>
                    {APPOINTMENT_STATUS_LABELS[form.status]}
                  </Badge>
                </div>
              </>
            )}

            <div>
              <Label>Observações clínicas</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Procedimentos realizados, recomendações, observações..." className="min-h-[100px]" />
            </div>
          </div>
          <DialogFooter className="flex justify-between">
            {editing && (
              <Button variant="destructive" onClick={async () => { await deleteApt.mutateAsync(editing); toast({ title: 'Consulta removida' }); setOpen(false); }}>Excluir</Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
