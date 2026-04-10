import { useState, useMemo, useRef } from 'react';
import { BarChart3, PieChart as PieIcon, TrendingUp, Users, Calendar, XCircle, UserX, Download, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { APPOINTMENT_STATUS_LABELS } from '@/lib/constants';
import PageHeader from '@/components/PageHeader';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid, LineChart, Line,
} from 'recharts';

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'hsl(221, 83%, 53%)',
  confirmed: 'hsl(210, 80%, 50%)',
  checked_in: 'hsl(280, 70%, 55%)',
  waiting: 'hsl(38, 92%, 50%)',
  in_progress: 'hsl(199, 89%, 48%)',
  completed: 'hsl(142, 71%, 45%)',
  cancelled: 'hsl(0, 84%, 60%)',
  no_show: 'hsl(25, 95%, 53%)',
};

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} className="text-sm text-muted-foreground flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.color || entry.fill }} />
          {entry.name || ''}: {entry.value}
        </p>
      ))}
    </div>
  );
};

type PeriodPreset = '7' | '30' | '180' | '365' | 'custom';

export default function Reports() {
  const { profile, role } = useAuth();
  const [preset, setPreset] = useState<PeriodPreset>('30');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const dateRange = useMemo(() => {
    if (preset === 'custom' && customStart && customEnd) {
      return { start: customStart, end: customEnd };
    }
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - Number(preset === 'custom' ? 30 : preset));
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  }, [preset, customStart, customEnd]);

  const tenantId = profile?.tenant_id;

  const { data } = useQuery({
    queryKey: ['reports', tenantId, dateRange],
    queryFn: async () => {
      if (!tenantId) return null;
      const [aptsRes, procsRes, patientsRes, profilesRes] = await Promise.all([
        supabase.from('appointments')
          .select('id, status, appointment_date, appointment_time, procedure_type_id, patient_id, dentist_id, check_in_at, check_out_at, procedure_types(name, color)')
          .eq('tenant_id', tenantId)
          .gte('appointment_date', dateRange.start)
          .lte('appointment_date', dateRange.end),
        supabase.from('procedure_types').select('id, name, color').eq('tenant_id', tenantId),
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
        supabase.from('profiles').select('user_id, full_name').eq('tenant_id', tenantId),
      ]);

      const apts = aptsRes.data || [];
      const profiles = profilesRes.data || [];
      const totalPatients = patientsRes.count || 0;
      const totalAppointments = apts.length;
      const completed = apts.filter((a: any) => a.status === 'completed').length;
      const cancelled = apts.filter((a: any) => a.status === 'cancelled').length;
      const noShow = apts.filter((a: any) => a.status === 'no_show').length;
      const uniquePatients = new Set(apts.map((a: any) => a.patient_id)).size;
      const noShowRate = totalAppointments > 0 ? ((noShow / totalAppointments) * 100).toFixed(1) : '0';

      // Tempo médio
      const withTime = apts.filter((a: any) => a.check_in_at && a.check_out_at);
      let avgMinutes = 0;
      if (withTime.length > 0) {
        const total = withTime.reduce((sum: number, a: any) => {
          return sum + (new Date(a.check_out_at).getTime() - new Date(a.check_in_at).getTime()) / 60000;
        }, 0);
        avgMinutes = Math.round(total / withTime.length);
      }

      // Por status
      const statusCounts: Record<string, number> = {};
      apts.forEach((a: any) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
      const byStatus = Object.entries(statusCounts).map(([name, value]) => ({
        name: APPOINTMENT_STATUS_LABELS[name] || name, value, key: name,
      }));

      // Por procedimento
      const procCounts: Record<string, { count: number; color: string }> = {};
      apts.forEach((a: any) => {
        const name = (a.procedure_types as any)?.name || 'Outros';
        if (!procCounts[name]) procCounts[name] = { count: 0, color: (a.procedure_types as any)?.color || '#3B82F6' };
        procCounts[name].count++;
      });
      const byProcedure = Object.entries(procCounts)
        .map(([name, { count, color }]) => ({ name, value: count, fill: color }))
        .sort((a, b) => b.value - a.value);

      // Por dia
      const byDay: Record<string, number> = {};
      apts.forEach((a: any) => { byDay[a.appointment_date] = (byDay[a.appointment_date] || 0) + 1; });
      const byDayArr = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date: date.slice(5), count }));

      // Por dentista
      const dentistCounts: Record<string, number> = {};
      apts.forEach((a: any) => {
        if (a.dentist_id) {
          dentistCounts[a.dentist_id] = (dentistCounts[a.dentist_id] || 0) + 1;
        }
      });
      const byDentist = Object.entries(dentistCounts).map(([id, count]) => {
        const p = profiles.find((pr: any) => pr.user_id === id);
        return { name: p?.full_name || 'Desconhecido', value: count };
      }).sort((a, b) => b.value - a.value);

      return { totalPatients, totalAppointments, completed, cancelled, noShow, noShowRate, uniquePatients, avgMinutes, byStatus, byProcedure, byDayArr, byDentist, rawApts: apts, profiles };
    },
    enabled: !!tenantId,
  });

  const exportCSV = () => {
    if (!data?.rawApts) return;
    const headers = ['Data', 'Hora', 'Paciente', 'Procedimento', 'Status', 'Dentista'];
    const rows = data.rawApts.map((a: any) => {
      const dentist = data.profiles?.find((p: any) => p.user_id === a.dentist_id);
      return [
        a.appointment_date,
        a.appointment_time,
        a.patient_id,
        (a.procedure_types as any)?.name || '',
        APPOINTMENT_STATUS_LABELS[a.status] || a.status,
        dentist?.full_name || '',
      ].join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${dateRange.start}-${dateRange.end}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== 'admin') {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito a administradores.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Relatórios"
        description="Dados consolidados da clínica"
        action={
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground">Período</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as PeriodPreset)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="180">Últimos 6 meses</SelectItem>
              <SelectItem value="365">Último ano</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {preset === 'custom' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground">De</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Até</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-40" />
            </div>
          </>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        {[
          { title: 'Total Consultas', value: data?.totalAppointments ?? 0, icon: Calendar, color: 'text-primary' },
          { title: 'Pacientes Atendidos', value: data?.uniquePatients ?? 0, icon: Users, color: 'text-green-500' },
          { title: 'Concluídas', value: data?.completed ?? 0, icon: TrendingUp, color: 'text-emerald-500' },
          { title: 'Canceladas', value: data?.cancelled ?? 0, icon: XCircle, color: 'text-destructive' },
          { title: 'Taxa de Faltas', value: `${data?.noShowRate ?? 0}%`, icon: UserX, color: 'text-orange-500' },
          { title: 'Tempo Médio', value: data?.avgMinutes ? `${data.avgMinutes}min` : '—', icon: FileText, color: 'text-blue-400' },
        ].map((c) => (
          <Card key={c.title} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-xl font-bold text-foreground">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" /> Consultas por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byStatus?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byStatus} margin={{ top: 8, right: 12, left: 0, bottom: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} interval={0} angle={-25} textAnchor="end" height={65} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {data.byStatus.map((entry: any, i: number) => (
                      <Cell key={i} fill={STATUS_COLORS[entry.key] || COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">Nenhum dado.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieIcon className="h-5 w-5 text-primary" /> Procedimentos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byProcedure?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={data.byProcedure} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} innerRadius={35} paddingAngle={3}
                    label={({ percent }: any) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : null}
                    labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}>
                    {data.byProcedure.map((e: any, i: number) => <Cell key={i} fill={e.fill} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={40} iconType="circle" iconSize={8}
                    formatter={(v: string) => <span className="text-xs text-muted-foreground ml-1">{v}</span>} />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">Nenhum dado.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Consultas por Dia
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byDayArr?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={data.byDayArr} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} width={35} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Consultas" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">Nenhum dado.</p>}
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Consultas por Dentista
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.byDentist?.length ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={data.byDentist} margin={{ top: 8, right: 12, left: 0, bottom: 32 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} maxBarSize={32} name="Consultas" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center text-muted-foreground py-16">Nenhum dado.</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
