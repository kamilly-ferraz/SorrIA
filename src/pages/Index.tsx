import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/hooks/usePatients';
import { useAppointments } from '@/hooks/useAppointments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, TrendingUp, Stethoscope, AlertTriangle, Activity, Bell } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { profile, tenantId } = useAuth();
  const nome = profile?.nome?.split(' ')[0] || 'Usuário';
  
  const { patients, loading: loadingPatients } = usePatients();
  const { appointments, getTodayAppointments, isLoading: loadingAppointments, refetchAppointments } = useAppointments();
  
  const loading = loadingPatients || loadingAppointments;
  const patientsCount = patients.length;
  const todayAppointments = [...getTodayAppointments()].sort((a, b) => a.horario.localeCompare(b.horario));
  const now = new Date();
  
  const getNextAppointment = () => {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    const upcoming = todayAppointments
      .filter(a => a.status !== 'cancelado')
      .sort((a, b) => {
        const aParts = a.horario.split(':');
        const bParts = b.horario.split(':');
        const aHour = parseInt(aParts[0] || '0', 10);
        const aMin = parseInt(aParts[1] || '0', 10);
        const bHour = parseInt(bParts[0] || '0', 10);
        const bMin = parseInt(bParts[1] || '0', 10);
        const aTime = aHour * 60 + aMin;
        const bTime = bHour * 60 + bMin;
        const currentTime = currentHour * 60 + currentMinute;
        
        if (aTime >= currentTime && bTime >= currentTime) return aTime - bTime;
        if (aTime >= currentTime) return -1;
        return 1;
      });
    
    return upcoming[0] || null;
  };
  
  const nextAppointment = getNextAppointment();

  // Garante sincronização ao entrar no dashboard após mudanças na agenda
  useEffect(() => {
    void refetchAppointments();
  }, [refetchAppointments]);

  const completedToday = todayAppointments.filter(a => 
    a.status === 'concluido'
  ).length;
  const cancelledToday = todayAppointments.filter(a =>
    a.status === 'cancelado'
  ).length;
  const activeToday = todayAppointments.filter(a =>
    a.status !== 'cancelado' && a.status !== 'concluido'
  ).length;
  const lateToday = todayAppointments.filter((a) => {
    if (a.status === 'concluido' || a.status === 'cancelado') return false;
    const dt = new Date(`${a.data}T${a.horario}`);
    return dt.getTime() + 30 * 60 * 1000 < now.getTime();
  }).length;

  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const upcomingWeek = appointments
    .filter((a) => {
      if (a.status === 'cancelado') return false;
      const dt = new Date(`${a.data}T${a.horario}`);
      return dt >= now && dt <= weekEnd;
    })
    .sort((a, b) => `${a.data}T${a.horario}`.localeCompare(`${b.data}T${b.horario}`));

  const statusMeta: Record<string, { label: string; className: string }> = {
    agendado: { label: 'Agendado', className: 'bg-blue-100 text-blue-700 border-blue-200' },
    aguardando: { label: 'Aguardando', className: 'bg-amber-100 text-amber-700 border-amber-200' },
    em_atendimento: { label: 'Em atendimento', className: 'bg-green-100 text-green-700 border-green-200' },
    concluido: { label: 'Concluído', className: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
    cancelado: { label: 'Cancelado', className: 'bg-red-100 text-red-700 border-red-200' },
  };

  const completionRate = todayAppointments.length > 0
    ? Math.round((completedToday / todayAppointments.length) * 100)
    : 0;

  return (
    <MainLayout>
      <div className="space-y-6">
        <Card className="overflow-hidden border-0 rounded-2xl shadow-md">
          <CardContent className="p-0">
            <div
              className="p-6 text-white"
              style={{
                background: 'linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 50%, hsl(var(--sidebar-background)) 100%)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm/5 text-blue-100">Painel Operacional</p>
                  <h1 className="text-3xl font-semibold tracking-tight">
                    Olá, {nome}
                  </h1>
                  <p className="mt-1 text-sm text-blue-100">
                    {new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
                <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-blue-100">Resumo agora</p>
                  <p className="mt-1 text-lg font-medium">{todayAppointments.length} consultas hoje</p>
                  <p className="text-sm text-blue-100">{lateToday} atrasadas</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {!tenantId && (
          <Card className="rounded-xl border-amber-200 bg-amber-50">
            <CardContent className="pt-6">
              <p className="text-sm text-amber-800">
                Sessão sem `tenant_id`. Sem tenant não é possível carregar dados do dashboard.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="rounded-xl border-l-4 border-l-sky-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total de Pacientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : patientsCount}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Pacientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Consultas Hoje
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {loading ? '...' : todayAppointments.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activeToday} ativas | {completedToday} concluídas
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Próxima Consulta
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold">...</div>
              ) : nextAppointment ? (
                <>
                  <div className="text-2xl font-bold">{nextAppointment.horario}</div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {nextAppointment.paciente_nome}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {nextAppointment.procedimento}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Nenhuma consulta
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Eficiência do Dia
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-2xl font-bold">...</div>
              ) : todayAppointments.length > 0 ? (
                <>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    {lateToday} atrasadas | {cancelledToday} canceladas
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl font-bold">-</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Sem consultas hoje
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="rounded-xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" />
                Agenda de Hoje
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : todayAppointments.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma consulta agendada para hoje.</p>
              ) : (
                todayAppointments.slice(0, 5).map(appointment => (
                  <div key={appointment.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium">{appointment.paciente_nome}</p>
                      <p className="text-sm text-muted-foreground">{appointment.procedimento}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{appointment.horario}</p>
                      <Badge className={statusMeta[appointment.status]?.className || 'bg-muted text-muted-foreground'}>
                        {statusMeta[appointment.status]?.label || appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
              <Link to="/agenda" className="block mt-4">
                <span className="text-sm text-primary hover:underline">Ver agenda completa →</span>
              </Link>
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Próximos 7 Dias
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <p className="text-muted-foreground">Carregando...</p>
              ) : upcomingWeek.length === 0 ? (
                <p className="text-muted-foreground">Nenhum agendamento futuro para os próximos 7 dias.</p>
              ) : (
                upcomingWeek.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{appointment.paciente_nome}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(`${appointment.data}T00:00:00`).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{appointment.procedimento}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-medium">{appointment.horario}</span>
                      <Badge className={statusMeta[appointment.status]?.className || 'bg-muted text-muted-foreground'}>
                        {statusMeta[appointment.status]?.label || appointment.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                Operação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/pacientes" className="block">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Gerenciar Pacientes</p>
                      <p className="text-sm text-muted-foreground">Cadastrar, editar ou buscar pacientes</p>
                    </div>
                  </div>
                </div>
              </Link>
              <Link to="/agenda" className="block">
                <div className="p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Agenda de Consultas</p>
                      <p className="text-sm text-muted-foreground">Visualizar ou criar agendamentos</p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="p-4 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Indicadores Rápidos</p>
                    <p className="text-sm text-muted-foreground">
                      {todayAppointments.length} hoje, {upcomingWeek.length} nos próximos 7 dias
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Taxa de conclusão: {completionRate}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
