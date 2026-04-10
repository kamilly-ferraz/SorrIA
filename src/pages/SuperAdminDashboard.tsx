import { useState, useEffect } from 'react';
import { Building2, Users, Shield, UserCheck, Edit2, Trash2, Power, PowerOff, Plus, Mail, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

interface Tenant {
  id: string;
  name: string;
  active: boolean;
  created_at: string;
  userCount?: number;
  adminCount?: number;
  dentistCount?: number;
}

interface UserRow {
  user_id: string;
  full_name: string;
  tenant_id: string;
  tenant_name?: string;
  role: string;
}

const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'vwbjkwztvmdxomltjmso';
const FUNCTIONS_URL = `https://${PROJECT_ID}.supabase.co/functions/v1`;
const SYSTEM_TENANT = '00000000-0000-0000-0000-000000000000';

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9.5 2 7 4 7 7c0 2-1.5 4-2 6-.5 2.5 0 5 1.5 6.5S9.5 22 12 22s3.5-1 5-2.5S19 16.5 19 13c-.5-2-2-4-2-6 0-3-2.5-5-5-5z" />
    </svg>
  );
}

export default function SuperAdminDashboard() {
  const { role, session, user } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [allUsers, setAllUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editTenant, setEditTenant] = useState<Tenant | null>(null);
  const [editName, setEditName] = useState('');

  // Dialog de criar admin
  const [createAdminOpen, setCreateAdminOpen] = useState(false);
  const [adminForm, setAdminForm] = useState({ email: '', password: '', confirmPassword: '', full_name: '', tenant_id: '' });
  const [creatingAdmin, setCreatingAdmin] = useState(false);

  // Dialog de criar clínica
  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [tenantsRes, profilesRes, rolesRes] = await Promise.all([
      supabase.from('tenants').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('*'),
      supabase.from('user_roles').select('*'),
    ]);

    const t = (tenantsRes.data || []).filter((te: any) => te.id !== SYSTEM_TENANT);
    const p = profilesRes.data || [];
    const r = rolesRes.data || [];

    // Enriquece clínicas com contagens
    const enriched = t.map((tenant: any) => {
      const tenantUsers = p.filter((pr: any) => pr.tenant_id === tenant.id);
      const tenantUserIds = tenantUsers.map((u: any) => u.user_id);
      const tenantRoles = r.filter((ro: any) => tenantUserIds.includes(ro.user_id));
      return {
        ...tenant,
        userCount: tenantUsers.length,
        adminCount: tenantRoles.filter((ro: any) => ro.role === 'admin').length,
        dentistCount: tenantRoles.filter((ro: any) => ro.role === 'dentist').length,
      };
    });
    setTenants(enriched);

    // Constrói lista de todos os usuários (excluindo tenant do sistema e super_admins)
    const users: UserRow[] = [];
    for (const prof of p) {
      if ((prof as any).tenant_id === SYSTEM_TENANT) continue;
      const userRole = r.find((ro: any) => ro.user_id === (prof as any).user_id);
      if (userRole && (userRole as any).role === 'super_admin') continue;
      const tenant = t.find((te: any) => te.id === (prof as any).tenant_id);
      users.push({
        user_id: (prof as any).user_id,
        full_name: (prof as any).full_name,
        tenant_id: (prof as any).tenant_id,
        tenant_name: tenant?.name || 'Desconhecido',
        role: (userRole as any)?.role || 'dentist',
      });
    }
    setAllUsers(users);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toggleTenantActive = async (tenant: Tenant) => {
    await supabase.from('tenants').update({ active: !tenant.active } as any).eq('id', tenant.id);
    toast({ title: tenant.active ? 'Clínica desativada' : 'Clínica ativada' });
    fetchData();
  };

  const handleEditTenant = async () => {
    if (!editTenant || !editName.trim()) return;
    await supabase.from('tenants').update({ name: editName } as any).eq('id', editTenant.id);
    toast({ title: 'Clínica atualizada' });
    setEditTenant(null);
    fetchData();
  };

  const handleCreateTenant = async () => {
    if (!newTenantName.trim()) return;
    const { error } = await supabase.from('tenants').insert({ name: newTenantName } as any);
    if (error) {
      toast({ title: 'Erro ao criar clínica', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Clínica criada com sucesso!' });
    setCreateTenantOpen(false);
    setNewTenantName('');
    fetchData();
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (tenant.userCount && tenant.userCount > 0) {
      toast({ title: 'Não é possível excluir', description: 'Remova todos os usuários antes de excluir a clínica.', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('tenants').delete().eq('id', tenant.id);
    if (error) {
      toast({ title: 'Erro ao excluir', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Clínica excluída' });
    fetchData();
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.email || !adminForm.password || !adminForm.full_name || !adminForm.tenant_id) {
      toast({ title: 'Preencha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }
    if (adminForm.password.length < 6) {
      toast({ title: 'Senha deve ter pelo menos 6 caracteres', variant: 'destructive' });
      return;
    }
    if (adminForm.password !== adminForm.confirmPassword) {
      toast({ title: 'Senhas não conferem', variant: 'destructive' });
      return;
    }

    setCreatingAdmin(true);
    try {
      const res = await fetch(`${FUNCTIONS_URL}/admin-create-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_admin',
          email: adminForm.email,
          password: adminForm.password,
          full_name: adminForm.full_name,
          target_tenant_id: adminForm.tenant_id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao criar administrador');

      toast({ title: 'Administrador criado com sucesso!', description: `${adminForm.full_name} pode fazer login imediatamente.` });
      setCreateAdminOpen(false);
      setAdminForm({ email: '', password: '', confirmPassword: '', full_name: '', tenant_id: '' });
      setTimeout(fetchData, 1000);
    } catch (err: any) {
      toast({ title: 'Erro ao criar administrador', description: err.message, variant: 'destructive' });
    } finally {
      setCreatingAdmin(false);
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
      fetchData();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir usuário', description: err.message, variant: 'destructive' });
    }
  };

  if (role !== 'super_admin') {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito ao Super Admin.</div>;
  }

  const totalUsers = allUsers.length;
  const totalAdmins = allUsers.filter(u => u.role === 'admin').length;
  const totalDentists = allUsers.filter(u => u.role === 'dentist').length;
  const admins = allUsers.filter(u => u.role === 'admin');
  const dentists = allUsers.filter(u => u.role === 'dentist');

  return (
    <div className="space-y-6">
      <PageHeader title="Super Admin" description="Gestão da plataforma SorrIA" />

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {[
          { title: 'Clínicas', value: tenants.length, icon: Building2, color: 'text-primary' },
          { title: 'Usuários', value: totalUsers, icon: Users, color: 'text-green-500' },
          { title: 'Administradores', value: totalAdmins, icon: Shield, color: 'text-blue-400' },
          { title: 'Dentistas', value: totalDentists, icon: UserCheck, color: 'text-emerald-500' },
        ].map((c) => (
          <Card key={c.title} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{c.title}</CardTitle>
              <div className="rounded-lg bg-primary/10 p-2"><c.icon className={`h-4 w-4 ${c.color}`} /></div>
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-foreground">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="clinics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="clinics" className="gap-2"><Building2 className="h-4 w-4" /> Clínicas</TabsTrigger>
          <TabsTrigger value="admins" className="gap-2"><Shield className="h-4 w-4" /> Administradores ({totalAdmins})</TabsTrigger>
          <TabsTrigger value="dentists" className="gap-2"><ToothIcon className="h-4 w-4" /> Dentistas ({totalDentists})</TabsTrigger>
        </TabsList>

        {/* Clinics Tab */}
        <TabsContent value="clinics">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Building2 className="h-5 w-5 text-primary" /> Clínicas ({tenants.length})</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => { setNewTenantName(''); setCreateTenantOpen(true); }}>
                <Plus className="h-4 w-4" /> Nova Clínica
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuários</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">ADMs</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Dentistas</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Criada em</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                    ) : tenants.length === 0 ? (
                      <tr><td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">Nenhuma clínica cadastrada.</td></tr>
                    ) : tenants.map((t) => (
                      <tr key={t.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-foreground">{t.name}</td>
                        <td className="px-6 py-4 text-muted-foreground">{t.userCount}</td>
                        <td className="px-6 py-4 text-muted-foreground">{t.adminCount}</td>
                        <td className="px-6 py-4 text-muted-foreground">{t.dentistCount}</td>
                        <td className="px-6 py-4">
                          <Badge variant="secondary" className={t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                            {t.active ? 'Ativa' : 'Inativa'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{new Date(t.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setEditTenant(t); setEditName(t.name); }} title="Editar">
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => toggleTenantActive(t)} title={t.active ? 'Desativar' : 'Ativar'}>
                              {t.active ? <PowerOff className="h-4 w-4 text-destructive" /> : <Power className="h-4 w-4 text-green-600" />}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" title="Excluir" disabled={!!t.userCount && t.userCount > 0}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Excluir clínica</AlertDialogTitle>
                                  <AlertDialogDescription>Tem certeza que deseja excluir {t.name}? Esta ação não pode ser desfeita.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteTenant(t)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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

        {/* Admins Tab */}
        <TabsContent value="admins">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Administradores ({admins.length})</CardTitle>
              <Button size="sm" className="gap-2" onClick={() => { setAdminForm({ email: '', password: '', confirmPassword: '', full_name: '', tenant_id: '' }); setCreateAdminOpen(true); }}>
                <UserPlus className="h-4 w-4" /> Novo Admin
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clínica</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admins.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Nenhum administrador.</td></tr>
                    ) : admins.map((a) => (
                      <tr key={a.user_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{a.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{a.tenant_name}</td>
                        <td className="px-6 py-4 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir administrador</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir {a.full_name}? O acesso será revogado permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(a)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dentists Tab */}
        <TabsContent value="dentists">
          <Card className="border-border/50 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><ToothIcon className="h-5 w-5 text-emerald-600" /> Dentistas ({dentists.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Clínica</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dentists.length === 0 ? (
                      <tr><td colSpan={3} className="px-6 py-12 text-center text-muted-foreground">Nenhum dentista.</td></tr>
                    ) : dentists.map((d) => (
                      <tr key={d.user_id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50">
                              <ToothIcon className="h-4 w-4 text-emerald-600" />
                            </div>
                            <span className="font-medium text-foreground">{d.full_name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">{d.tenant_name}</td>
                        <td className="px-6 py-4 text-right">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm" title="Excluir">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir dentista</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir {d.full_name}? O acesso será revogado permanentemente.</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteUser(d)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Edit Tenant Dialog */}
      <Dialog open={!!editTenant} onOpenChange={(o) => !o && setEditTenant(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar Clínica</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Clínica</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTenant(null)}>Cancelar</Button>
            <Button onClick={handleEditTenant}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Tenant Dialog */}
      <Dialog open={createTenantOpen} onOpenChange={setCreateTenantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Clínica</DialogTitle>
            <DialogDescription>Cadastre uma nova clínica na plataforma.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome da Clínica *</Label>
              <Input value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} placeholder="Clínica Exemplo" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateTenantOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateTenant} disabled={!newTenantName.trim()}>Criar Clínica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Admin Dialog */}
      <Dialog open={createAdminOpen} onOpenChange={setCreateAdminOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Administrador</DialogTitle>
            <DialogDescription>Crie um administrador e vincule a uma clínica.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Nome completo *</Label>
              <Input value={adminForm.full_name} onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })} placeholder="Dr. João Silva" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail *</Label>
              <Input type="email" value={adminForm.email} onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })} placeholder="admin@clinica.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Clínica *</Label>
              <Select value={adminForm.tenant_id} onValueChange={(v) => setAdminForm({ ...adminForm, tenant_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione a clínica" /></SelectTrigger>
                <SelectContent>
                  {tenants.filter(t => t.active).map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Senha *</Label>
                <Input type="password" value={adminForm.password} onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })} placeholder="••••••" />
              </div>
              <div className="space-y-1.5">
                <Label>Confirmar *</Label>
                <Input type="password" value={adminForm.confirmPassword} onChange={(e) => setAdminForm({ ...adminForm, confirmPassword: e.target.value })} placeholder="••••••" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAdminOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateAdmin} disabled={creatingAdmin}>
              {creatingAdmin ? 'Criando...' : 'Criar Administrador'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
