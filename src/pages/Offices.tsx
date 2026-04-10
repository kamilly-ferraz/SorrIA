import { useState } from 'react';
import { Plus, Pencil, Trash2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useOffices, useCreateOffice, useUpdateOffice, useDeleteOffice } from '@/hooks/useTenantData';
import { useToast } from '@/hooks/use-toast';
import PageHeader from '@/components/PageHeader';

interface OfficeForm {
  name: string;
  active: boolean;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
}

const emptyForm: OfficeForm = { name: '', active: true, street: '', number: '', neighborhood: '', city: '', state: '', zip_code: '' };

export default function Offices() {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState<OfficeForm>(emptyForm);
  const { toast } = useToast();

  const { data: offices, isLoading } = useOffices();
  const createOffice = useCreateOffice();
  const updateOffice = useUpdateOffice();
  const deleteOffice = useDeleteOffice();

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Nome é obrigatório', variant: 'destructive' }); return; }
    try {
      if (editing) {
        await updateOffice.mutateAsync({ id: editing, ...form });
      } else {
        await createOffice.mutateAsync(form);
      }
      toast({ title: editing ? 'Consultório atualizado' : 'Consultório criado' });
      setOpen(false);
    } catch {
      toast({ title: 'Erro ao salvar', variant: 'destructive' });
    }
  };

  const openEdit = (o: any) => {
    setForm({
      name: o.name,
      active: o.active,
      street: o.street || '',
      number: o.number || '',
      neighborhood: o.neighborhood || '',
      city: o.city || '',
      state: o.state || '',
      zip_code: o.zip_code || '',
    });
    setEditing(o.id);
    setOpen(true);
  };

  const formatAddress = (o: any) => {
    const parts = [o.street, o.number, o.neighborhood, o.city, o.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultórios"
        description="Gerencie os consultórios da clínica"
        action={
          <Button onClick={() => { setForm(emptyForm); setEditing(null); setOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Novo Consultório
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <p className="text-muted-foreground col-span-full text-center py-12">Carregando...</p>
        ) : !offices?.length ? (
          <p className="text-muted-foreground col-span-full text-center py-12">Nenhum consultório cadastrado.</p>
        ) : (
          offices.map((o: any) => (
            <Card key={o.id} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground text-lg">{o.name}</p>
                    <Badge variant="secondary" className={o.active ? 'bg-green-100 text-green-700 mt-1' : 'bg-muted text-muted-foreground mt-1'}>
                      {o.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(o)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={async () => { await deleteOffice.mutateAsync(o.id); toast({ title: 'Removido' }); }}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {formatAddress(o) && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-primary" />
                    <span>{formatAddress(o)}{o.zip_code ? ` — CEP ${o.zip_code}` : ''}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Consultório' : 'Novo Consultório'}</DialogTitle>
            <DialogDescription>Preencha os dados do consultório abaixo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Nome *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Consultório 1" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              <Label>Ativo</Label>
            </div>

            <div className="border-t border-border/50 pt-4">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" /> Endereço
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-xs">Rua</Label>
                  <Input value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} placeholder="Rua..." />
                </div>
                <div>
                  <Label className="text-xs">Número</Label>
                  <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} placeholder="Nº" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label className="text-xs">Bairro</Label>
                  <Input value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} placeholder="Bairro" />
                </div>
                <div>
                  <Label className="text-xs">Cidade</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Cidade" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <Label className="text-xs">Estado</Label>
                  <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="UF" maxLength={2} />
                </div>
                <div>
                  <Label className="text-xs">CEP</Label>
                  <Input value={form.zip_code} onChange={(e) => setForm({ ...form, zip_code: e.target.value })} placeholder="00000-000" />
                </div>
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
