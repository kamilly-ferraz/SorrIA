import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Download, Trash2, FileText, Plus, BarChart3, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useToast } from '@/hooks/use-toast';
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from '@/lib/constants';
import Odontogram from '@/components/Odontogram';
import PageHeader from '@/components/PageHeader';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid
} from 'recharts';

const CHART_COLORS = ['hsl(221, 83%, 53%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(217, 91%, 60%)', 'hsl(280, 65%, 60%)'];

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

export default function PatientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const tenantId = profile?.tenant_id;

  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dentalRecords, setDentalRecords] = useState<any[]>([]);
  const [clinicalRecords, setClinicalRecords] = useState<any[]>([]);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dashPeriod, setDashPeriod] = useState('365');
  const [lgpdAcknowledged, setLgpdAcknowledged] = useState(false);

  const [crOpen, setCrOpen] = useState(false);
  const [crForm, setCrForm] = useState({ chief_complaint: '', clinical_history: '', observations: '', diagnosis: '', treatment: '' });

  const fetchAll = async () => {
    if (!id || !tenantId) return;
    setLoading(true);
    const [patientRes, aptsRes, drRes, crRes, filesRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', id).single(),
      supabase.from('appointments')
        .select('*, procedure_types(name, color), offices(name)')
        .eq('patient_id', id)
        .eq('tenant_id', tenantId)
        .order('appointment_date', { ascending: false }),
      supabase.from('dental_records').select('*').eq('patient_id', id).eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('clinical_records').select('*').eq('patient_id', id).eq('tenant_id', tenantId).order('created_at', { ascending: false }),
      supabase.from('patient_files').select('*').eq('patient_id', id).eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    ]);
    setPatient(patientRes.data);
    setAppointments(aptsRes.data || []);
    setDentalRecords(drRes.data || []);
    setClinicalRecords(crRes.data || []);
    setFiles(filesRes.data || []);
    setLoading(false);
    logAction('view', 'patients', id);
  };

  useEffect(() => { fetchAll(); }, [id, tenantId]);

  const dashData = useMemo(() => {
    const days = Number(dashPeriod);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const filtered = appointments.filter(a => new Date(a.appointment_date) >= cutoff);
    const completed = filtered.filter(a => a.status === 'completed');

    const procMap: Record<string, number> = {};
    filtered.forEach(a => {
      const name = a.procedure_types?.name || 'Outros';
      procMap[name] = (procMap[name] || 0) + 1;
    });
    const byProcedure = Object.entries(procMap).map(([name, value], i) => ({
      name, value, fill: CHART_COLORS[i % CHART_COLORS.length]
    }));

    const last = appointments[0];

    return {
      totalAppts: filtered.length,
      completedAppts: completed.length,
      lastAppt: last ? `${last.appointment_date} — ${last.procedure_types?.name}` : '—',
      byProcedure,
    };
  }, [appointments, dashPeriod]);

  const handleSaveDental = async (data: { tooth_number: number; diagnosis: string; notes: string }) => {
    if (!id || !tenantId) return;
    const existing = dentalRecords.find((r) => r.tooth_number === data.tooth_number);
    if (existing) {
      await supabase.from('dental_records').update({ diagnosis: data.diagnosis, notes: data.notes }).eq('id', existing.id);
      logAction('update', 'dental_records', existing.id, { tooth_number: data.tooth_number });
    } else {
      await supabase.from('dental_records').insert({ ...data, patient_id: id, tenant_id: tenantId, dentist_id: user?.id });
      logAction('create', 'dental_records', undefined, { tooth_number: data.tooth_number, patient_id: id });
    }
    toast({ title: `Dente ${data.tooth_number} atualizado` });
    fetchAll();
  };

  const handleSaveClinical = async () => {
    if (!id || !tenantId) return;
    const { data } = await supabase.from('clinical_records').insert({
      ...crForm,
      patient_id: id,
      tenant_id: tenantId,
      dentist_id: user?.id,
    }).select().single();
    logAction('create', 'clinical_records', data?.id, { patient_id: id });
    toast({ title: 'Registro clínico salvo' });
    setCrOpen(false);
    setCrForm({ chief_complaint: '', clinical_history: '', observations: '', diagnosis: '', treatment: '' });
    fetchAll();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id || !tenantId) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast({ title: 'Tipo de arquivo não permitido', description: 'Apenas PDF, JPG e PNG.', variant: 'destructive' });
      return;
    }
    const path = `${tenantId}/${id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from('patient-files').upload(path, file);
    if (uploadErr) {
      toast({ title: 'Erro no upload', description: uploadErr.message, variant: 'destructive' });
      return;
    }
    const { data: fileData } = await supabase.from('patient_files').insert({
      patient_id: id,
      tenant_id: tenantId,
      file_name: file.name,
      file_path: path,
      file_type: file.type,
      uploaded_by: user?.id,
    }).select().single();
    logAction('upload', 'patient_files', fileData?.id, { file_name: file.name, patient_id: id });
    toast({ title: 'Arquivo enviado' });
    fetchAll();
  };

  const handleFileDownload = async (filePath: string, fileName: string, fileId: string) => {
    const { data: signedData, error: signedErr } = await supabase.storage
      .from('patient-files')
      .createSignedUrl(filePath, 300);

    if (signedErr || !signedData?.signedUrl) {
      const { data } = await supabase.storage.from('patient-files').download(filePath);
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } else {
      const a = document.createElement('a');
      a.href = signedData.signedUrl;
      a.download = fileName;
      a.target = '_blank';
      a.click();
    }
    logAction('download', 'patient_files', fileId, { file_name: fileName });
  };

  const handleFileDelete = async (fileId: string, filePath: string) => {
    await supabase.storage.from('patient-files').remove([filePath]);
    await supabase.from('patient_files').delete().eq('id', fileId);
    logAction('delete', 'patient_files', fileId);
    toast({ title: 'Arquivo removido' });
    fetchAll();
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;
  if (!patient) return <div className="p-8 text-center text-muted-foreground">Paciente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/pacientes')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <PageHeader title={patient.name} description={`Telefone: ${patient.phone || '—'} • CPF: ${patient.cpf || '—'} • Nascimento: ${patient.birth_date || '—'}`} />
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1 h-auto p-1 w-full max-w-4xl bg-muted/50">
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm">Dashboard</TabsTrigger>
          <TabsTrigger value="dados" className="text-xs sm:text-sm">Dados</TabsTrigger>
          <TabsTrigger value="agenda" className="text-xs sm:text-sm">Agenda</TabsTrigger>
          <TabsTrigger value="prontuario" className="text-xs sm:text-sm">Prontuário</TabsTrigger>
          <TabsTrigger value="odontograma" className="text-xs sm:text-sm">Odontograma</TabsTrigger>
          <TabsTrigger value="anexos" className="text-xs sm:text-sm">Anexos</TabsTrigger>
          <TabsTrigger value="historico" className="text-xs sm:text-sm">Histórico</TabsTrigger>
        </TabsList>

        {/* Dashboard */}
        <TabsContent value="dashboard">
          <div className="flex justify-end mb-4">
            <Select value={dashPeriod} onValueChange={setDashPeriod}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 dias</SelectItem>
                <SelectItem value="180">6 meses</SelectItem>
                <SelectItem value="365">1 ano</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3 mb-6">
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Consultas</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2"><Calendar className="h-4 w-4 text-primary" /></div>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-foreground">{dashData.totalAppts}</div></CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Procedimentos Realizados</CardTitle>
                <div className="rounded-lg bg-green-100 p-2"><Activity className="h-4 w-4 text-green-600" /></div>
              </CardHeader>
              <CardContent><div className="text-3xl font-bold text-foreground">{dashData.completedAppts}</div></CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Última Consulta</CardTitle>
                <div className="rounded-lg bg-blue-100 p-2"><BarChart3 className="h-4 w-4 text-blue-600" /></div>
              </CardHeader>
              <CardContent><div className="text-sm font-medium text-foreground truncate">{dashData.lastAppt}</div></CardContent>
            </Card>
          </div>

          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-base font-semibold">Consultas por Procedimento</CardTitle></CardHeader>
              <CardContent className="pt-0">
                {dashData.byProcedure.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={dashData.byProcedure} margin={{ top: 8, right: 12, left: 0, bottom: 24 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        angle={-20}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        width={35}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                        {dashData.byProcedure.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-16">Nenhum dado no período.</p>}
              </CardContent>
            </Card>
            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-base font-semibold">Distribuição</CardTitle></CardHeader>
              <CardContent className="pt-0">
                {dashData.byProcedure.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={dashData.byProcedure}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="42%"
                        outerRadius={80}
                        innerRadius={35}
                        paddingAngle={3}
                        label={({ percent }) => percent >= 0.05 ? `${(percent * 100).toFixed(0)}%` : null}
                        labelLine={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                      >
                        {dashData.byProcedure.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        verticalAlign="bottom"
                        height={48}
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ paddingTop: '12px' }}
                        formatter={(value: string) => <span className="text-xs text-muted-foreground ml-1">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-center text-muted-foreground py-16">Nenhum dado no período.</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Dados */}
        <TabsContent value="dados">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-6 grid gap-4 md:grid-cols-2">
              <div><Label className="text-muted-foreground text-xs">Nome</Label><p className="font-medium text-foreground">{patient.name}</p></div>
              <div><Label className="text-muted-foreground text-xs">Telefone</Label><p className="font-medium text-foreground">{patient.phone || '—'}</p></div>
              <div><Label className="text-muted-foreground text-xs">CPF</Label><p className="font-medium text-foreground">{patient.cpf || '—'}</p></div>
              <div><Label className="text-muted-foreground text-xs">Data de Nascimento</Label><p className="font-medium text-foreground">{patient.birth_date || '—'}</p></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agenda */}
        <TabsContent value="agenda">
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Hora</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Procedimento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Consultório</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Nenhuma consulta encontrada.</td></tr>
                  ) : appointments.map((a) => (
                    <tr key={a.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 text-foreground">{a.appointment_date}</td>
                      <td className="px-6 py-4 text-foreground">{a.appointment_time?.slice(0, 5)}</td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: a.procedure_types?.color }} />
                          {a.procedure_types?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">{a.offices?.name}</td>
                      <td className="px-6 py-4">
                        <Badge variant="secondary" className={APPOINTMENT_STATUS_COLORS[a.status]}>
                          {APPOINTMENT_STATUS_LABELS[a.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prontuário */}
        <TabsContent value="prontuario">
          {!lgpdAcknowledged ? (
            <Alert className="border-amber-300 bg-amber-50 mb-4">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex items-center justify-between flex-wrap gap-3">
                <span className="text-sm text-foreground">
                  Este prontuário contém dados sensíveis protegidos pela LGPD. O acesso é registrado para auditoria.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => {
                    setLgpdAcknowledged(true);
                    logAction('view', 'clinical_records', undefined, { patient_id: id });
                  }}
                >
                  Entendi, prosseguir
                </Button>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <div className="flex justify-end mb-4">
                <Button onClick={() => setCrOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" /> Novo Registro Clínico
                </Button>
              </div>
              <div className="space-y-4">
                {clinicalRecords.length === 0 ? (
                  <Card className="border-border/50"><CardContent className="p-8 text-center text-muted-foreground">Nenhum registro clínico.</CardContent></Card>
                ) : clinicalRecords.map((cr) => (
                  <Card key={cr.id} className="border-border/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-muted-foreground">
                        {new Date(cr.created_at).toLocaleDateString('pt-BR')} — {new Date(cr.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                      {cr.chief_complaint && <div><Label className="text-xs text-muted-foreground">Queixa Principal</Label><p className="text-sm text-foreground">{cr.chief_complaint}</p></div>}
                      {cr.clinical_history && <div><Label className="text-xs text-muted-foreground">Histórico Clínico</Label><p className="text-sm text-foreground">{cr.clinical_history}</p></div>}
                      {cr.diagnosis && <div><Label className="text-xs text-muted-foreground">Diagnóstico</Label><p className="text-sm text-foreground">{cr.diagnosis}</p></div>}
                      {cr.treatment && <div><Label className="text-xs text-muted-foreground">Conduta/Tratamento</Label><p className="text-sm text-foreground">{cr.treatment}</p></div>}
                      {cr.observations && <div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Observações</Label><p className="text-sm text-foreground">{cr.observations}</p></div>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Odontograma */}
        <TabsContent value="odontograma">
          <Card className="border-border/50 shadow-sm">
            <CardHeader><CardTitle className="text-lg">Odontograma — Numeração FDI</CardTitle></CardHeader>
            <CardContent>
              <Odontogram records={dentalRecords} onSave={handleSaveDental} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Anexos */}
        <TabsContent value="anexos">
          <div className="flex justify-end mb-4">
            <label>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
              <Button asChild><span><Upload className="h-4 w-4 mr-2" /> Upload Arquivo</span></Button>
            </label>
          </div>
          <Card className="border-border/50 shadow-sm">
            <CardContent className="p-0">
              {files.length === 0 ? (
                <p className="p-8 text-center text-muted-foreground">Nenhum arquivo anexado.</p>
              ) : (
                <div className="divide-y divide-border/30">
                  {files.map((f) => (
                    <div key={f.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/20 transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{f.file_name}</p>
                          <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleFileDownload(f.file_path, f.file_name, f.id)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleFileDelete(f.id, f.file_path)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          <div className="space-y-4">
            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Histórico de Consultas</CardTitle></CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Procedimento</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <tr key={a.id} className="border-b border-border/30">
                        <td className="px-6 py-4 text-foreground">{a.appointment_date}</td>
                        <td className="px-6 py-4 text-foreground">{a.procedure_types?.name}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={APPOINTMENT_STATUS_COLORS[a.status]}>
                            {APPOINTMENT_STATUS_LABELS[a.status]}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader><CardTitle className="text-lg">Histórico Odontológico</CardTitle></CardHeader>
              <CardContent>
                {dentalRecords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">Nenhum registro odontológico.</p>
                ) : (
                  <div className="space-y-2">
                    {dentalRecords.map((dr) => (
                      <div key={dr.id} className="flex items-center gap-4 px-4 py-3 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors">
                        <span className="font-bold text-foreground">Dente {dr.tooth_number}</span>
                        <span className="text-sm text-muted-foreground">{dr.diagnosis}</span>
                        {dr.notes && <span className="text-sm text-muted-foreground">— {dr.notes}</span>}
                        <span className="ml-auto text-xs text-muted-foreground">{new Date(dr.created_at).toLocaleDateString('pt-BR')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Clinical Record Dialog */}
      <Dialog open={crOpen} onOpenChange={setCrOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Novo Registro Clínico</DialogTitle>
            <DialogDescription>Preencha os dados do registro clínico abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Queixa Principal</Label>
              <Textarea value={crForm.chief_complaint} onChange={(e) => setCrForm({ ...crForm, chief_complaint: e.target.value })} />
            </div>
            <div>
              <Label>Histórico Clínico</Label>
              <Textarea value={crForm.clinical_history} onChange={(e) => setCrForm({ ...crForm, clinical_history: e.target.value })} />
            </div>
            <div>
              <Label>Diagnóstico</Label>
              <Textarea value={crForm.diagnosis} onChange={(e) => setCrForm({ ...crForm, diagnosis: e.target.value })} />
            </div>
            <div>
              <Label>Conduta/Tratamento</Label>
              <Textarea value={crForm.treatment} onChange={(e) => setCrForm({ ...crForm, treatment: e.target.value })} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={crForm.observations} onChange={(e) => setCrForm({ ...crForm, observations: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCrOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveClinical}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
