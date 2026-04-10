import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useProcedureTypes, useCreateProcedureType, useUpdateProcedureType, useDeleteProcedureType } from '@/hooks/useTenantData';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

interface ProcForm {
  name: string;
  duration: number;
  price: number;
  color: string;
  active: boolean;
}

const emptyForm: ProcForm = { name: '', duration: 30, price: 0, color: '#3B82F6', active: true };

export default function ProcedureTypes() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<ProcForm>(emptyForm);
  const { toast } = useToast();

  const { data: types, isLoading } = useProcedureTypes();
  const create = useCreateProcedureType();
  const update = useUpdateProcedureType();
  const remove = useDeleteProcedureType();

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
    try {
      if (editing) {
        await update.mutateAsync({ id: editing, ...form });
      } else {
        await create.mutateAsync(form);
      }
      toast({ title: editing ? 'Procedimento atualizado' : 'Procedimento criado' });
      setOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  return (
    <div>
      <PageHeader
        title="Tipos de Procedimentos"
        description="Gerencie os procedimentos oferecidos"
        action={
          <Button onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Procedimento
          </Button>
        }
      />

      <Card className="border-border/50">
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Cor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Duração</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Carregando...</td></tr>
              ) : !types?.length ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">Nenhum procedimento cadastrado.</td></tr>
              ) : (
                types.map((t: any) => (
                  <tr key={t.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="h-4 w-4 rounded-full" style={{ backgroundColor: t.color }} />
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">{t.name}</td>
                    <td className="px-6 py-4 text-muted-foreground">{t.duration} min</td>
                    <td className="px-6 py-4 text-muted-foreground">R$ {Number(t.price).toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={t.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}>
                        {t.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" onClick={() => { setForm({ name: t.name, duration: t.duration, price: Number(t.price), color: t.color, active: t.active }); setEditing(t.id); setOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={async () => { await remove.mutateAsync(t.id); toast({ title: 'Removido' }); }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Procedimento' : 'Novo Procedimento'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Duração (min)</Label>
                <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
              </div>
              <div>
                <Label>Preço (R$)</Label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Cor</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10 w-10 rounded border-0 cursor-pointer" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div className="flex items-end gap-3 pb-1">
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                <Label>Ativo</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
