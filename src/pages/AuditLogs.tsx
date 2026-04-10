import { useState, useMemo } from 'react';
import { Shield, Search, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';

const ACTION_LABELS: Record<string, string> = {
  create: 'Criação',
  update: 'Atualização',
  delete: 'Exclusão',
  view: 'Visualização',
  cancel: 'Cancelamento',
  'check-in': 'Check-in',
  'check-out': 'Check-out',
  no_show: 'Falta',
  login: 'Login',
  logout: 'Logout',
  access_denied: 'Acesso Negado',
};

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-100 text-green-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-700',
  cancel: 'bg-orange-100 text-orange-700',
  'check-in': 'bg-purple-100 text-purple-700',
  'check-out': 'bg-emerald-100 text-emerald-700',
  no_show: 'bg-amber-100 text-amber-700',
};

export default function AuditLogs() {
  const { profile, role } = useAuth();
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const isSuperAdmin = role === 'super_admin';
  const tenantId = profile?.tenant_id;

  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit-logs', tenantId, isSuperAdmin],
    queryFn: async () => {
      let query = supabase.from('audit_logs' as any).select('*').order('created_at', { ascending: false }).limit(500);
      if (!isSuperAdmin && tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    enabled: role === 'admin' || role === 'super_admin',
  });

  const { data: profiles } = useQuery({
    queryKey: ['audit-profiles', tenantId, isSuperAdmin],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('user_id, full_name');
      return data || [];
    },
    enabled: role === 'admin' || role === 'super_admin',
  });

  const profileMap = useMemo(() => {
    const map: Record<string, string> = {};
    profiles?.forEach((p: any) => { map[p.user_id] = p.full_name; });
    return map;
  }, [profiles]);

  const filtered = useMemo(() => {
    if (!logs) return [];
    return logs.filter((l: any) => {
      if (actionFilter !== 'all' && l.action !== actionFilter) return false;
      if (entityFilter !== 'all' && l.entity !== entityFilter && l.table_name !== entityFilter) return false;
      if (searchTerm) {
        const name = profileMap[l.user_id] || '';
        const desc = l.description || '';
        const term = searchTerm.toLowerCase();
        if (!name.toLowerCase().includes(term) && !desc.toLowerCase().includes(term)) return false;
      }
      return true;
    });
  }, [logs, actionFilter, entityFilter, searchTerm, profileMap]);

  const uniqueActions = useMemo(() => [...new Set(logs?.map((l: any) => l.action) || [])], [logs]);
  const uniqueEntities = useMemo(() => [...new Set(logs?.map((l: any) => l.entity || l.table_name).filter(Boolean) || [])], [logs]);

  const exportCSV = () => {
    const headers = ['Data', 'Usuário', 'Perfil', 'Ação', 'Entidade', 'Descrição'];
    const rows = filtered.map((l: any) => [
      new Date(l.created_at).toLocaleString('pt-BR'),
      profileMap[l.user_id] || l.user_id,
      l.user_role || '',
      ACTION_LABELS[l.action] || l.action,
      l.entity || l.table_name || '',
      l.description || '',
    ].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditoria-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (role !== 'admin' && role !== 'super_admin') {
    return <div className="p-8 text-center text-muted-foreground">Acesso restrito.</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Registro de todas as ações no sistema (LGPD)"
        action={
          <Button variant="outline" onClick={exportCSV} className="gap-2">
            <Download className="h-4 w-4" /> Exportar CSV
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-end gap-4 flex-wrap">
        <div>
          <Label className="text-xs text-muted-foreground">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-56" placeholder="Nome ou descrição..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Ação</Label>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueActions.map((a) => <SelectItem key={a} value={a}>{ACTION_LABELS[a] || a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Entidade</Label>
          <Select value={entityFilter} onValueChange={setEntityFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {uniqueEntities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" /> Logs ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/50 bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Usuário</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Perfil</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Descrição</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Carregando...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">Nenhum registro encontrado.</td></tr>
                ) : filtered.map((log: any) => (
                  <tr key={log.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setSelectedLog(log)}>
                    <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{profileMap[log.user_id] || 'Sistema'}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="text-xs">{log.user_role || '—'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={`text-xs ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {ACTION_LABELS[log.action] || log.action}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{log.entity || log.table_name || '—'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground truncate max-w-[200px]">{log.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(o) => !o && setSelectedLog(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Detalhe do Log</DialogTitle></DialogHeader>
          {selectedLog && (
            <div className="space-y-3 text-sm">
              <div><strong>Data:</strong> {new Date(selectedLog.created_at).toLocaleString('pt-BR')}</div>
              <div><strong>Usuário:</strong> {profileMap[selectedLog.user_id] || selectedLog.user_id}</div>
              <div><strong>Perfil:</strong> {selectedLog.user_role || '—'}</div>
              <div><strong>Ação:</strong> {ACTION_LABELS[selectedLog.action] || selectedLog.action}</div>
              <div><strong>Entidade:</strong> {selectedLog.entity || selectedLog.table_name || '—'}</div>
              <div><strong>ID do Registro:</strong> {selectedLog.entity_id || selectedLog.record_id || '—'}</div>
              <div><strong>Descrição:</strong> {selectedLog.description || '—'}</div>
              {(selectedLog.metadata || selectedLog.details) && (
                <div>
                  <strong>Metadados:</strong>
                  <pre className="mt-1 rounded bg-muted p-3 text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata || selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              {selectedLog.ip_address && <div><strong>IP:</strong> {selectedLog.ip_address}</div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
