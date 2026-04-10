import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient, useTenantProfiles } from '@/hooks/useTenantData';
import { useToast } from '@/hooks/use-toast';
import { useAuditLog } from '@/hooks/useAuditLog';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';

interface PatientForm {
  name: string;
  phone: string;
  cpf: string;
  birth_date: string;
  lgpd_consent: boolean;
  dentist_id: string;
}

const emptyForm: PatientForm = { name: '', phone: '', cpf: '', birth_date: '', lgpd_consent: false, dentist_id: '' };

export default function Patients() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<PatientForm>(emptyForm);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { logAction } = useAuditLog();
  const { role, user } = useAuth();
  const isAdmin = role === 'admin';

  const { data: patients, isLoading } = usePatients(search);
  const { data: profiles } = useTenantProfiles();
  const createPatient = useCreatePatient();
  const updatePatient = useUpdatePatient();
  const deletePatient = useDeletePatient();

  // Filtra perfis de dentistas apenas (exclui super_admin)
  const dentistProfiles = profiles?.filter((p: any) => p.user_id !== user?.id) || [];

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    if (!editing && !form.lgpd_consent) {
      toast({ title: 'Consentimento LGPD obrigatório', description: 'O paciente deve autorizar o armazenamento de dados.', variant: 'destructive' });
      return;
    }
    try {
      if (editing) {
        await updatePatient.mutateAsync({ id: editing, name: form.name, phone: form.phone, cpf: form.cpf, birth_date: form.birth_date, dentist_id: form.dentist_id || undefined });
        await logAction('update', 'patients', editing, { name: form.name }, `Paciente ${form.name} atualizado`);
        toast({ title: 'Paciente atualizado' });
      } else {
        const result = await createPatient.mutateAsync({
          name: form.name,
          phone: form.phone,
          cpf: form.cpf,
          birth_date: form.birth_date,
          lgpd_consent: true,
          lgpd_consent_date: new Date().toISOString(),
          dentist_id: form.dentist_id || undefined,
        });
        await logAction('create', 'patients', (result as any)?.id, { name: form.name }, `Paciente ${form.name} criado`);
        toast({ title: 'Paciente criado' });
      }
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const handleEdit = (patient: any) => {
    setForm({ name: patient.name, phone: patient.phone || '', cpf: patient.cpf || '', birth_date: patient.birth_date || '', lgpd_consent: true, dentist_id: patient.dentist_id || '' });
    setEditing(patient.id);
    setOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const patient = patients?.find((p: any) => p.id === id);
      await deletePatient.mutateAsync(id);
      await logAction('delete', 'patients', id, { name: patient?.name }, `Paciente ${patient?.name || ''} excluído`);
      toast({ title: 'Paciente removido' });
    } catch {
      toast({ title: 'Erro ao remover', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Pacientes"
        description="Gerencie os pacientes da clínica"
        action={
          <Button onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Paciente
          </Button>
        }
      />

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 max-w-md"
        />
      </div>

      <Card className="border-border/50">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Telefone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">CPF</th>
                  {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dentista</th>}
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nascimento</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                ) : !patients?.length ? (
                  <tr><td colSpan={isAdmin ? 6 : 5} className="px-6 py-12 text-center text-muted-foreground">Nenhum paciente encontrado.</td></tr>
                ) : (
                  patients.map((p: any) => (
                    <tr key={p.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{p.name}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.phone || '—'}</td>
                      <td className="px-6 py-4 text-muted-foreground">{p.cpf || '—'}</td>
                      {isAdmin && (
                        <td className="px-6 py-4 text-muted-foreground text-sm">
                          {p.dentist_name ? `Dr(a). ${p.dentist_name}` : '—'}
                        </td>
                      )}
                      <td className="px-6 py-4 text-muted-foreground">{p.birth_date || '—'}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/pacientes/${p.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(p)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Paciente' : 'Novo Paciente'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>CPF</Label>
              <Input value={form.cpf} onChange={(e) => setForm({ ...form, cpf: e.target.value })} />
            </div>
            <div>
              <Label>Data de Nascimento</Label>
              <Input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} />
            </div>
            {isAdmin && (
              <div>
                <Label>Dentista Responsável</Label>
                <Select value={form.dentist_id} onValueChange={(v) => setForm({ ...form, dentist_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o dentista" /></SelectTrigger>
                  <SelectContent>
                    {profiles?.map((p: any) => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.full_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editing && (
              <div className="flex items-start space-x-3 rounded-lg border border-border/50 p-4 bg-muted/30">
                <Checkbox
                  id="lgpd"
                  checked={form.lgpd_consent}
                  onCheckedChange={(checked) => setForm({ ...form, lgpd_consent: !!checked })}
                />
                <label htmlFor="lgpd" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  O paciente autoriza o armazenamento e uso de seus dados pessoais e clínicos para fins de atendimento odontológico, conforme a LGPD (Lei nº 13.709/2018).
                </label>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={createPatient.isPending || updatePatient.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
