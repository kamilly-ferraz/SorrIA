import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { usePatients } from '@/hooks/usePatients';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Phone, Calendar, Loader2, Mail, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationsContext';
import type { PatientFormData } from '@/types/index';
import type { PatientUI } from '@/hooks/usePatients';


const initialFormData: PatientFormData = {
  nome: '',
  telefone: '',
  data_nascimento: '',
  cpf: '',
  email: '',
  observacoes: '',
  historico_clinico: '',
};

const Pacientes = () => {
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<PatientFormData>(initialFormData);
  const navigate = useNavigate();
  const { addNotification } = useNotifications();
  
  const { 
    patients, 
    loading, 
    error, 
    fetchPatients, 
    createPatient,
    deletePatient,
    isDeleting,
  } = usePatients();

  // Initial fetch on mount
  useEffect(() => {
    fetchPatients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = patients.filter((p: PatientUI) =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    (p.telefone && p.telefone.includes(search)) ||
    (p.cpf && p.cpf.includes(search))
  );

  const validateForm = (): boolean => {
    if (!formData.nome.trim()) {
      toast.error('Nome é obrigatório');
      return false;
    }
    if (!formData.telefone.trim()) {
      toast.error('Telefone é obrigatório');
      return false;
    }
    if (formData.cpf && !validateCPF(formData.cpf)) {
      toast.error('CPF inválido');
      return false;
    }
    if (formData.email && !validateEmail(formData.email)) {
      toast.error('E-mail inválido');
      return false;
    }
    return true;
  };

  const validateCPF = (cpf: string): boolean => {
    const cleanCPF = cpf.replace(/\D/g, '');
    return cleanCPF.length === 11;
  };

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const formatCPF = (value: string): string => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 3) return clean;
    if (clean.length <= 6) return `${clean.slice(0, 3)}.${clean.slice(3)}`;
    if (clean.length <= 9) return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6)}`;
    return `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
  };

  const formatPhone = (value: string): string => {
    const clean = value.replace(/\D/g, '').slice(0, 11);
    if (clean.length <= 2) return `(${clean}`;
    if (clean.length <= 7) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  };

  const handleSave = () => {
    if (!validateForm()) return;

    createPatient(formData, {
      onSuccess: (patient: any) => {
        addNotification('patient', 'Novo paciente', `${patient.nome} foi cadastrado`);
        toast.success('Paciente adicionado com sucesso');
        setIsDialogOpen(false);
        setFormData(initialFormData);
        fetchPatients();
      },
      onError: (err: unknown) => {
        console.error('[Pacientes] Erro ao salvar paciente:', err);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error('Erro ao adicionar paciente: ' + message);
      },
    });
  };

  const handleDeletePatient = (patient: PatientUI) => {
    const confirmed = window.confirm(`Deseja realmente excluir o paciente "${patient.nome}"?`);
    if (!confirmed) return;

    deletePatient(patient.id, {
      onSuccess: () => {
        toast.success('Paciente excluído com sucesso');
      },
      onError: (err: unknown) => {
        console.error('[Pacientes] Erro ao excluir paciente:', err);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        toast.error('Erro ao excluir paciente: ' + message);
      },
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Pacientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">{patients.length} pacientes cadastrados</p>
          </div>
          <Button 
            className="gap-2 rounded-lg font-medium"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, telefone ou CPF..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-lg pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2 text-muted-foreground">Carregando pacientes...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500">{String(error)}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => fetchPatients()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum paciente cadastrado.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsDialogOpen(true)}
            >
              Adicionar primeiro paciente
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((patient: PatientUI, i: number) => (
              <div
                key={patient.id}
                className="card-shadow rounded-xl bg-card p-5 transition-all hover:card-shadow-hover cursor-pointer animate-fade-in border border-transparent hover:border-primary/20"
                style={{ animationDelay: `${i * 50}ms` }}
                onClick={() => navigate(`/pacientes/${patient.id}/prontuario`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    navigate(`/pacientes/${patient.id}/prontuario`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-11 w-11">
                    <AvatarFallback className="bg-primary/10 font-semibold text-primary text-sm">
                      {patient.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-card-foreground truncate">{patient.nome}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={isDeleting}
                        onClick={(event) => {
                          event.stopPropagation();
                          handleDeletePatient(patient);
                        }}
                        aria-label={`Excluir paciente ${patient.nome}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {patient.telefone || '-'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  {patient.data_nascimento && (() => {
                    const date = new Date(patient.data_nascimento);
                    if (isNaN(date.getTime())) return null;
                    return (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {date.toLocaleDateString('pt-BR')}
                      </span>
                    );
                  })()}
                  {patient.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {patient.email}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Novo Paciente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="nome" className="text-sm font-medium">
                Nome completo *
              </label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <label htmlFor="cpf" className="text-sm font-medium">
                  CPF
                </label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  maxLength={14}
                />
              </div>
              <div className="grid gap-2">
                <label htmlFor="telefone" className="text-sm font-medium">
                  Telefone *
                </label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: formatPhone(e.target.value) })}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                E-mail
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Ex: joao@email.com"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="data_nascimento" className="text-sm font-medium">
                Data de Nascimento
              </label>
              <Input
                id="data_nascimento"
                type="date"
                value={formData.data_nascimento}
                onChange={(e) => setFormData({ ...formData, data_nascimento: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="observacoes" className="text-sm font-medium">
                Observações
              </label>
              <textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações gerais..."
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="historico_clinico" className="text-sm font-medium">
                Histórico Clínico
              </label>
              <textarea
                id="historico_clinico"
                value={formData.historico_clinico}
                onChange={(e) => setFormData({ ...formData, historico_clinico: e.target.value })}
                placeholder="Observações clínicas..."
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default Pacientes;
