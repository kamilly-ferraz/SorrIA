import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, Shield, UserPlus, CheckCircle2, XCircle, Mail, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  patientCount?: number;
  appointmentCount?: number;
}

interface AccessRequest {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'vwbjkwztvmdxomltjmso';
const FUNCTIONS_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9.5 2 7 4 7 7c0 2-1.5 4-2 6-.5 2.5 0 5 1.5 6.5S9.5 22 12 22s3.5-1 5-2.5S19 16.5 19 13c-.5-2-2-4-2-6 0-3-2.5-5-5-5z" />
    </svg>
  );
}

export default function Settings() {
  const { profile, role, session, user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', full_name: '' });
  const [editForm, setEditForm] = useState({ full_name: '' });
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!profile?.tenant_id) return;
    setLoading(true);

    // Busca perfis, cargos, contagem de pacientes e consultas em paralelo
    const [profilesRes, patientsRes, appointmentsRes] = await Promise.all([
      supabase.from('profiles').select('id, user_id, full_name').eq('tenant_id', profile.tenant_id),
      supabase.from('patients').select('id, dentist_id').eq('tenant_id', profile.tenant_id),
      supabase.from('appointments').select('id, dentist_id').eq('tenant_id', profile.tenant_id),
    ]);

    const profiles = profilesRes.data || [];
    const allPatients = patientsRes.data || [];
    const allAppointments = appointmentsRes.data || [];

    if (profiles.length > 0) {
      // Busca todos os cargos em lote
      const userIds = profiles.map((p: any) => p.user_id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const roleMap: Record<string, string> = {};
      rolesData?.forEach((r: any) => { roleMap[r.user_id] = r.role; });

      const userRows: UserRow[] = profiles.map((p: any) => ({
        ...p,
        role: roleMap[p.user_id] || 'dentist',
        patientCount: allPatients.filter((pt: any) => pt.dentist_id === p.user_id).length,
        appointmentCount: allAppointments.filter((a: any) => a.dentist_id === p.user_id).length,
      }));
      setUsers(userRows);
    }
    setLoading(false);
  };

  const fetchRequests = async () => {
    if (!profile?.tenant_id) return;
    const { data, error } = await supabase
      .from('access_requests' as any)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) console.error('Error fetching access_requests:', error);
    setRequests((data || []) as unknown as AccessRequest[]);
  };

  useEffect(() => { fetchUsers(); fetchRequests(); }, [profile?.tenant_id]);

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.full_name) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (form.password.length < 6) {
      toast({ title: 'Senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }

    setCreating(true);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/admin-create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          full_name: form.full_name,
          role: 'dentist',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário');
      
      toast({ title: 'Usuário criado com sucesso!', description: `${form.full_name} pode fazer login imediatamente.` });
      setOpen(false);
      setForm({ email: '', password: '', confirmPassword: '', full_name: '' });
      setTimeout(fetchUsers, 1000);
    } catch (err: any) {
      console.error('Error creating user:', err);
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleEditUser = (u: UserRow) => {
    setEditingUser(u);
    setEditForm({ full_name: u.full_name });
    setEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    try {
      await supabase.from('profiles').update({ full_name: editForm.full_name } as any).eq('user_id', editingUser.user_id);
      toast({ title: 'Usuário atualizado' });
      setEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao atualizar', description: err.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (u: UserRow) => {
    if (u.user_id === user?.id) {
      toast({ title: 'Você não pode excluir a si mesmo', variant: 'destructive' });
      return;
    }
    try {
      const res = await fetch(`${FUNCTIONS_URL}/admin-create-user`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_id: u.user_id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao excluir');
      }
      toast({ title: 'Usuário excluído' });
      fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir usuário', description: err.message, variant: 'destructive' });
    }
  };

  const handleApproveRequest = async (req: AccessRequest) => {
    setApprovingId(req.id);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/admin-create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: req.email,
          password: Math.random().toString(36).slice(-10) + 'A1!',
          full_name: req.name,
          role: 'dentist',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar usuário');

      await supabase.from('access_requests' as any).update({ 
        status: 'approved', 
        reviewed_by: user?.id, 
        reviewed_at: new Date().toISOString(),
        tenant_id: profile?.tenant_id,
      }).eq('id', req.id);

      toast({ 
        title: 'Solicitação aprovada!', 
        description: `${req.name} foi cadastrado como dentista. Uma senha temporária foi gerada — peça ao usuário para redefinir a senha.` 
      });
      fetchRequests();
      setTimeout(fetchUsers, 1000);
    } catch (err: any) {
      console.error('Error approving request:', err);
      toast({ title: 'Erro ao aprovar solicitação', description: err.message, variant: 'destructive' });
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectRequest = async (req: AccessRequest) => {
    await supabase.from('access_requests' as any).update({ 
      status: 'rejected', 
      reviewed_by: user?.id, 
      reviewed_at: new Date().toISOString() 
    }).eq('id', req.id);
    toast({ title: 'Solicitação rejeitada' });
    fetchRequests();
  };

  if (role !== 'admin') {
    return (
      <div className="p-8 text-center">
        <p className="text-muted-foreground">Acesso restrito a administradores.</p>
      </div>
    );
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const dentists = users.filter(u => u.role === 'dentist');
  const admins = users.filter(u => u.role === 'admin');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Gerencie usuários, equipe e solicitações de acesso"
        action={
          <Button onClick={() => { setForm({ email: '', password: '', confirmPassword: '', full_name: '' }); setOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Dentista
          </Button>
        }
      />

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team" className="gap-2">
            <ToothIcon className="h-4 w-4" /> Equipe
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> Todos os Usuários
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-2">
            <UserPlus className="h-4 w-4" /> Solicitações
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                {pendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Team Tab - Dentists with stats */}
        <TabsContent value="team">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <ToothIcon className="h-5 w-5 text-emerald-600" /> Equipe de Dentistas ({dentists.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dentista</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Pacientes</th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-muted-foreground uppercase">Consultas</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                    ) : dentists.length === 0 ? (
                      <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">Nenhum dentista cadastrado.</td></tr>
                    ) : dentists.map((u) => (
                      <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                              <ToothIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="font-medium text-foreground">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Users className="h-3.5 w-3.5" /> {u.patientCount ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" /> {u.appointmentCount ?? 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)} title="Editar">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {u.user_id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Excluir">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir dentista</AlertDialogTitle>
                                    <AlertDialogDescription>Tem certeza que deseja excluir {u.full_name}? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="users">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Todos os Usuários ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Perfil</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Nenhum usuário cadastrado.</td></tr>
                    ) : users.map((u) => (
                      <tr key={u.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              {u.role === 'admin' ? <Shield className="h-4 w-4 text-primary" /> : <ToothIcon className="h-4 w-4 text-emerald-600" />}
                            </div>
                            <span className="font-medium text-foreground">{u.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-emerald-50 text-emerald-700'}>
                            {u.role === 'admin' ? 'Administrador' : 'Dentista'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEditUser(u)} title="Editar">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            {u.user_id !== user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="sm" title="Excluir">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir usuário</AlertDialogTitle>
                                    <AlertDialogDescription>Tem certeza que deseja excluir {u.full_name}? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteUser(u)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" /> Solicitações de Acesso
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">E-mail</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">Nenhuma solicitação.</td></tr>
                    ) : requests.map((req) => (
                      <tr key={req.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{req.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">
                          <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {req.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={
                            req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {req.status === 'pending' ? 'Pendente' : req.status === 'approved' ? 'Aprovada' : 'Rejeitada'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {new Date(req.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {req.status === 'pending' && (
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-1 text-green-600" 
                                onClick={() => handleApproveRequest(req)}
                                disabled={approvingId === req.id}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> {approvingId === req.id ? 'Criando...' : 'Aprovar'}
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={() => handleRejectRequest(req)}>
                                <XCircle className="h-3.5 w-3.5" /> Rejeitar
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Dentista</DialogTitle>
            <DialogDescription>Preencha os dados para criar um novo dentista.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="joao@clinica.com" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Senha *</Label>
                <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar *</Label>
                <Input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">O usuário será criado com perfil de <strong>Dentista</strong>.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? 'Criando...' : 'Criar Dentista'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Altere os dados do profissional.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo</Label>
              <Input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
