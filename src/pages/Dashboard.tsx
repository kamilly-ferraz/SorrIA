import { useState } from 'react';
import { Calendar, Users, Building2, Clock, TrendingUp, PieChart as PieIcon, UserX, Timer, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDashboardStats, useAppointments, useDashboardChartData } from '@/hooks/useTenantData';
import { useAuth } from '@/contexts/AuthContext';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/lib/constants';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import PageHeader from '@/components/PageHeader';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'hsl(221, 83%, 53%)',
  confirmed: 'hsl(210, 80%, 50%)',
  waiting: 'hsl(38, 92%, 50%)',
  in_progress: 'hsl(199, 89%, 48%)',
  completed: 'hsl(142, 71%, 45%)',
  cancelled: 'hsl(0, 84%, 60%)',
  no_show: 'hsl(25, 95%, 53%)',
  checked_in: 'hsl(280, 70%, 55%)',
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          {entry.value} consulta{entry.value !== 1 ? 's' : ''}
        </p>
      ))}
    </div>
  );
};

const renderPieLabel = ({ name, percent }: any) => {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
};

export default function Dashboard() {
  const [chartDays, setChartDays] = useState(30);
  const { role, profile } = useAuth();
  const { data: stats } = useDashboardStats();
  const today = new Date().toISOString().split('T')[0];
  const { data: todayAppointments } = useAppointments(today);
  const { data: chartData } = useDashboardChartData(chartDays);

  const isDentist = role === 'dentist';
  const isAdmin = role === 'admin';

  // Logs de auditoria recentes para admin
  const { data: recentLogs } = useQuery({
    queryKey: ['recent-audit-logs', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data } = await supabase.from('audit_logs' as any)
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10);
      return data || [];
    },
    enabled: isAdmin && !!profile?.tenant_id,
    refetchInterval: 30000,
  });

  // Perfis para nomes dos logs de auditoria
  const { data: profilesList } = useQuery({
    queryKey: ['dashboard-profiles', profile?.tenant_id],
    queryFn: async () => {
      if (!profile?.tenant_id) return [];
      const { data } = await supabase.from('profiles').select('user_id, full_name').eq('tenant_id', profile.tenant_id);
      return data || [];
    },
    enabled: isAdmin && !!profile?.tenant_id,
  });

  const profileMap: Record<string, string> = {};
  profilesList?.forEach((p: any) => { profileMap[p.user_id] = p.full_name; });

  const noShowCount = todayAppointments?.filter((a: any) => a.status === 'no_show').length ?? 0;
  const completedToday = todayAppointments?.filter((a: any) => a.status === 'completed').length ?? 0;

  // Calcula tempo médio das consultas concluídas hoje com check_in e check_out
  const completedWithTime = todayAppointments?.filter((a: any) => a.check_in_at && a.check_out_at) || [];
  let avgMinutes = 0;
  if (completedWithTime.length > 0) {
    const total = completedWithTime.reduce((sum: number, a: any) => {
      const diff = (new Date(a.check_out_at).getTime() - new Date(a.check_in_at).getTime()) / 60000;
      return sum + (diff > 0 ? diff : 0); // ignora valores negativos
    }, 0);
    avgMinutes = Math.round(total / completedWithTime.length);
  }

  // Taxa de faltas de hoje
  const totalToday = todayAppointments?.length ?? 0;
  const noShowRate = totalToday > 0 ? ((noShowCount / totalToday) * 100).toFixed(0) : '0';

  const adminCards = [
    { title: 'Total de Pacientes', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-primary' },
    { title: 'Consultas Hoje', value: stats?.todayAppointments ?? 0, icon: Calendar, color: 'text-green-500' },
    { title: 'Consultórios Ativos', value: stats?.activeOffices ?? 0, icon: Building2, color: 'text-blue-400' },
    { title: 'Concluídas Hoje', value: completedToday, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Faltas Hoje', value: `${noShowCount} (${noShowRate}%)`, icon: UserX, color: 'text-orange-500' },
    { title: 'Tempo Médio', value: avgMinutes ? `${avgMinutes}min` : '—', icon: Timer, color: 'text-purple-500' },
  ];

  const dentistCards = [
    { title: 'Minhas Consultas Hoje', value: stats?.todayAppointments ?? 0, icon: Calendar, color: 'text-primary' },
    { title: 'Concluídas Hoje', value: completedToday, icon: TrendingUp, color: 'text-emerald-500' },
    { title: 'Meus Pacientes', value: stats?.totalPatients ?? 0, icon: Users, color: 'text-blue-400' },
    { title: 'Faltas Hoje', value: noShowCount, icon: UserX, color: 'text-orange-500' },
    { title: 'Tempo Médio', value: avgMinutes ? `${avgMinutes}min` : '—', icon: Timer, color: 'text-purple-500' },
  ];

  const cards = isDentist ? dentistCards : adminCards;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isDentist ? 'Meu Painel' : 'Dashboard'}
        description={isDentist ? 'Visão geral das suas consultas' : 'Visão geral da clínica'}
      />

      <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {cards.map((card) => (
          <Card key={card.title} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2">
                <card.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Consultas por Status
            </CardTitle>
            <Select value={String(chartDays)} onValueChange={(v) => setChartDays(Number(v))}>
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 dias</SelectItem>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="90">90 dias</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent className="pt-0">
            {chartData?.byStatus && chartData.byStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={chartData.byStatus.map((s) => ({ ...s, name: APPOINTMENT_STATUS_LABELS[s.name] || s.name }))}
                  margin={{ top: 8, right: 12, left: 0, bottom: 40 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={0} angle={-30} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {chartData.byStatus.map((entry, i) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.name] || 'hsl(221, 83%, 53%)'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-16">Nenhum dado disponível.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-primary" />
              Procedimentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {chartData?.byProcedure && chartData.byProcedure.length > 0 ? (
              <ResponsiveContainer width="100%" height={340}>
                <PieChart>
                  <Pie data={chartData.byProcedure} dataKey="value" nameKey="name" cx="50%" cy="48%" outerRadius={85} innerRadius={40} paddingAngle={3} label={renderPieLabel} labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                    {chartData.byProcedure.map((entry, i) => (<Cell key={i} fill={entry.fill} />))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: '8px' }} formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-16">Nenhum dado disponível.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Consultas de Hoje com nome do dentista */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="h-5 w-5 text-primary" />
            Consultas de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!todayAppointments?.length ? (
            <p className="text-sm text-muted-foreground py-8 text-center">Nenhuma consulta agendada para hoje.</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((apt: any) => (
                <div key={apt.id} className="flex items-center justify-between rounded-lg border border-border/50 p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: apt.procedure_types?.color || 'hsl(221, 83%, 53%)' }} />
                    <div>
                      <p className="font-medium text-foreground">{apt.patients?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {apt.procedure_types?.name} • {apt.offices?.name}
                        {isAdmin && apt.dentist_name && <span className="ml-2 text-xs text-primary">Dr(a). {apt.dentist_name}</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">{apt.appointment_time?.slice(0, 5)}</span>
                    <Badge variant="secondary" className={APPOINTMENT_STATUS_COLORS[apt.status]}>
                      {APPOINTMENT_STATUS_LABELS[apt.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Logs de Auditoria Recentes - Apenas Admin */}
      {isAdmin && recentLogs && recentLogs.length > 0 && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-5 w-5 text-primary" />
              Ações Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentLogs.map((log: any) => (
                <div key={log.id} className="flex items-center justify-between rounded-lg border border-border/30 p-3 text-sm">
                  <div>
                    <span className="font-medium text-foreground">{profileMap[log.user_id] || 'Sistema'}</span>
                    <span className="text-xs text-muted-foreground ml-1">({log.user_role || '—'})</span>
                    <span className="text-muted-foreground ml-2">{log.description || `${log.action} em ${log.entity || log.table_name}`}</span>
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
