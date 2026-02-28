import { useState, useEffect, useRef } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { usePatientUseCases, useAppointmentUseCases, useConsultationUseCases } from '@/application/ApplicationContext';
import { createUseCaseContext, UserRole } from '@/application/useCases/UseCaseContext';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Phone, 
  Plus, 
  ClipboardList,
  FileText,
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Appointment } from '@/domain/entities/Appointment';
import { Consultation } from '@/domain/entities/Consultation';
import { Patient } from '@/domain/entities/Patient';
import { supabase } from '@/services/api/SupabaseClient';

interface PatientUI {
  id: string;
  tenantId: string;
  nome: string;
  telefone: string;
  data_nascimento?: string;
  cpf?: string;
  email?: string;
  observacoes?: string;
  historico_clinico?: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ConsultationUI {
  id: string;
  tenantId: string;
  pacienteId: string;
  data_atendimento: string;
  tipo: string;
  description?: string;
  diagnosis?: string;
  treatment?: string;
  observations?: string;
  // Aliases em português para compatibilidade com o template
  queixa_principal?: string;
  historico_br?: string;
  observacoes_clinicas?: string;
  conduta?: string;
}

interface AppointmentUI {
  id: string;
  tenantId: string;
  pacienteId: string;
  date: string;
  time: string;
  procedure: string;
  status: string;
  chair?: string;
}

interface AttachmentUI {
  name: string;
  path: string;
  size: number;
  mimeType: string;
  createdAt?: string;
}

const PATIENT_FILES_BUCKET = 'patient-files';
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

const statusLabels: Record<string, string> = {
  aguardando: 'Aguardando',
  agendado: 'Agendado',
  agendada: 'Agendada',
  em_atendimento: 'Em atendimento',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
  cancelada: 'Cancelada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  aguardando: 'outline',
  agendado: 'secondary',
  agendada: 'secondary',
  em_atendimento: 'default',
  concluido: 'secondary',
  cancelado: 'destructive',
  cancelada: 'destructive',
};

interface ConsultationFormData {
  paciente_id: string;
  agendamento_id: string | null;
  queixa_principal: string;
  historico_br: string;
  observacoes_clinicas: string;
  conduta: string;
}

const initialConsultationForm: ConsultationFormData = {
  paciente_id: '',
  agendamento_id: null,
  queixa_principal: '',
  historico_br: '',
  observacoes_clinicas: '',
  conduta: '',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function patientToUIFormat(patient: any): PatientUI {
  return {
    id: patient.id,
    tenantId: patient.tenantId,
    nome: patient.name || '',
    telefone: patient.phone || '',
    data_nascimento: patient.birthDate ? new Date(patient.birthDate).toISOString().split('T')[0] : undefined,
    cpf: patient.cpf,
    email: patient.email,
    observacoes: patient.observations,
    historico_clinico: patient.medicalHistory,
    ativo: patient.active ?? true,
    createdAt: patient.createdAt?.toISOString?.() || new Date().toISOString(),
    updatedAt: patient.updatedAt?.toISOString?.() || new Date().toISOString(),
  };
}

const Prontuario = () => {
  const { pacienteId = '' } = useParams();
  const { tenantId, user } = useAuth();
  
  const { getPatientUseCase, updatePatientUseCase } = usePatientUseCases();
  const { listAppointmentsUseCase, completeConsultationUseCase } = useAppointmentUseCases();
  const { createConsultationUseCase, listConsultationsUseCase } = useConsultationUseCases();
  
  const [loading, setLoading] = useState(true);
  const [paciente, setPaciente] = useState<PatientUI | null>(null);
  const [appointments, setAppointments] = useState<AppointmentUI[]>([]);
  const [consultations, setConsultations] = useState<ConsultationUI[]>([]);
  
  const [pacienteEditando, setPacienteEditando] = useState({
    nome: '',
    telefone: '',
    data_nascimento: '',
    cpf: '',
    email: '',
    observacoes: '',
    historico_clinico: '',
  });
  const [isEditPacienteOpen, setIsEditPacienteOpen] = useState(false);
  
  const [isNewConsultationOpen, setIsNewConsultationOpen] = useState(false);
  const [consultationForm, setConsultationForm] = useState<ConsultationFormData>(initialConsultationForm);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>('');
  const [attachments, setAttachments] = useState<AttachmentUI[]>([]);
  const [loadingAttachments, setLoadingAttachments] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState<string | null>(null);

  const getAttachmentFolder = () => `${tenantId}/${pacienteId}`;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  };

  const isImageMime = (mimeType: string) => mimeType.startsWith('image/');

  const fetchAttachments = async () => {
    if (!tenantId || !pacienteId) return;
    setLoadingAttachments(true);
    try {
      const { data, error: listError } = await supabase.storage
        .from(PATIENT_FILES_BUCKET)
        .list(getAttachmentFolder(), {
          limit: 100,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (listError) {
        throw listError;
      }

      const mapped: AttachmentUI[] = (data || []).map((file) => ({
        name: file.name,
        path: `${getAttachmentFolder()}/${file.name}`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        size: Number((file as any).metadata?.size || 0),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mimeType: String((file as any).metadata?.mimetype || ''),
        createdAt: file.created_at,
      }));

      setAttachments(mapped);
    } catch (err) {
      console.error('Erro ao carregar anexos do paciente:', err);
      setAttachments([]);
    } finally {
      setLoadingAttachments(false);
    }
  };

  const handleUploadAttachments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!tenantId || !pacienteId) return;
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const invalidFile = files.find((file) => !ALLOWED_FILE_TYPES.includes(file.type));
    if (invalidFile) {
      toast.error(`Arquivo inválido: ${invalidFile.name}. Envie apenas PDF ou imagem.`);
      event.target.value = '';
      return;
    }

    const oversizedFile = files.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (oversizedFile) {
      toast.error(`Arquivo muito grande: ${oversizedFile.name}. Limite de 10MB.`);
      event.target.value = '';
      return;
    }

    setUploadingAttachment(true);
    try {
      const folder = getAttachmentFolder();
      for (const file of files) {
        const safeFileName = file.name.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9._-]/g, '');
        const uniquePath = `${folder}/${Date.now()}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage
          .from(PATIENT_FILES_BUCKET)
          .upload(uniquePath, file, {
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) {
          throw uploadError;
        }
      }

      toast.success('Arquivo(s) enviado(s) com sucesso');
      await fetchAttachments();
    } catch (err) {
      console.error('Erro ao enviar anexo:', err);
      toast.error('Erro ao enviar anexo. Verifique se o bucket "patient-files" existe no Supabase.');
    } finally {
      setUploadingAttachment(false);
      event.target.value = '';
    }
  };

  const handleOpenAttachment = async (path: string) => {
    try {
      const { data, error: signedUrlError } = await supabase.storage
        .from(PATIENT_FILES_BUCKET)
        .createSignedUrl(path, 60 * 15);

      if (signedUrlError || !data?.signedUrl) {
        throw signedUrlError || new Error('Não foi possível gerar link do arquivo');
      }

      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Erro ao abrir anexo:', err);
      toast.error('Não foi possível abrir o anexo.');
    }
  };

  const handleDeleteAttachment = async (path: string) => {
    const confirmed = window.confirm('Deseja remover este arquivo do prontuário?');
    if (!confirmed) return;

    try {
      const { error: deleteError } = await supabase.storage
        .from(PATIENT_FILES_BUCKET)
        .remove([path]);

      if (deleteError) {
        throw deleteError;
      }

      setAttachments((current) => current.filter((item) => item.path !== path));
      toast.success('Arquivo removido com sucesso');
    } catch (err) {
      console.error('Erro ao remover anexo:', err);
      toast.error('Não foi possível remover o anexo.');
    }
  };

  useEffect(() => {
    if (pacienteId) {
      // Aguardar um tick para garantir que tenantId está disponível
      const timer = setTimeout(() => {
        if (tenantId) {
          fetchData();
        } else {
          // Se tenantId ainda não está disponível, define erro
          setLoading(false);
          setError('Informações de sessão não carregadas. Faça login novamente.');
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pacienteId, tenantId]);

  const fetchData = async () => {
    if (!tenantId) {
      setLoading(false);
      setError('Sessão não encontrada. Faça login novamente.');
      return;
    }
    
    const context = createUseCaseContext({
      tenantId,
      userId: user?.id || '',
      roles: [UserRole.ADMIN],
      correlationId: crypto.randomUUID(),
    });
    
    try {
      setLoading(true);
      setError(null);
      
      const patientResult = await getPatientUseCase.execute({ patientId: pacienteId }, context);
      if (patientResult.isErr()) {
        setError(patientResult.unwrapErr().message);
        setLoading(false);
        return;
      }
      const patientData = patientResult.unwrap();
      const patientUI = patientToUIFormat(patientData);
      setPaciente(patientUI);
      
      setPacienteEditando({
        nome: patientUI.nome,
        telefone: patientUI.telefone || '',
        data_nascimento: patientUI.data_nascimento || '',
        cpf: patientUI.cpf || '',
        email: patientUI.email || '',
        observacoes: patientUI.observacoes || '',
        historico_clinico: patientUI.historico_clinico || '',
      });

      const appointmentsResult = await listAppointmentsUseCase.execute({ 
        filter: { tenantId, patientId: pacienteId },
        pagination: { page: 1, pageSize: 100 }
      }, context);
      
      if (appointmentsResult.isOk()) {
        setAppointments(appointmentsResult.unwrap().data.map((appt: Appointment) => ({
          id: appt.id,
          tenantId: appt.tenantId,
          pacienteId: appt.patientId,
          date: appt.date,
          time: appt.time,
          procedure: appt.procedure,
          status: appt.status,
          chair: appt.chair?.toString(),
        })));
      }

      const consultationsResult = await listConsultationsUseCase.executeByPatient(
        pacienteId, 
        tenantId, 
        { page: 1, pageSize: 100 },
        context
      );
      
      if (consultationsResult.isOk()) {
        const consultationsData = consultationsResult.unwrap().data;
        setConsultations(consultationsData.map((cons: Consultation) => ({
          id: cons.id,
          tenantId: cons.tenantId,
          pacienteId: cons.patientId,
          data_atendimento: cons.date + 'T' + cons.time,
          tipo: cons.type,
          description: cons.description,
          diagnosis: cons.diagnosis,
          treatment: cons.treatment,
          observations: cons.observations,
        })));
      }
      await fetchAttachments();
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      toast.error('Erro ao carregar dados do paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePaciente = async () => {
    if (!tenantId) return;
    
    const context = createUseCaseContext({
      tenantId,
      userId: user?.id || '',
      roles: [UserRole.ADMIN],
      correlationId: crypto.randomUUID(),
    });
    
    try {
      const updateResult = await updatePatientUseCase.execute({
        patientId: pacienteId,
        name: pacienteEditando.nome,
        phone: pacienteEditando.telefone,
        birthDate: pacienteEditando.data_nascimento || undefined,
        cpf: pacienteEditando.cpf || undefined,
        email: pacienteEditando.email || undefined,
        observations: pacienteEditando.observacoes || undefined,
        medicalHistory: pacienteEditando.historico_clinico || undefined,
      }, context);
      
      if (updateResult.isErr()) {
        throw new Error(updateResult.unwrapErr().message);
      }
      
      setPaciente(prev => prev ? {
        ...prev,
        nome: pacienteEditando.nome,
        telefone: pacienteEditando.telefone,
        data_nascimento: pacienteEditando.data_nascimento,
        cpf: pacienteEditando.cpf,
        email: pacienteEditando.email,
        observacoes: pacienteEditando.observacoes,
        historico_clinico: pacienteEditando.historico_clinico,
      } : null);
      
      setIsEditPacienteOpen(false);
      toast.success('Dados atualizados com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      toast.error('Erro ao atualizar dados');
    }
  };

  const handleSaveConsultation = async () => {
    if (!consultationForm.queixa_principal.trim() || !tenantId) {
      toast.error('Queixa principal é obrigatória');
      return;
    }

    try {
      const professionalId = user?.id || '';
      
      const newConsultation = await createConsultationUseCase.execute(
        {
          patientId: pacienteId,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
          type: 'consulta',
          description: consultationForm.queixa_principal,
          diagnosis: consultationForm.historico_br,
          treatment: consultationForm.observacoes_clinicas,
          observations: consultationForm.conduta,
          appointmentId: selectedAppointmentId || undefined,
        },
        tenantId,
        professionalId
      );
      
      setConsultations(prev => [{
        id: newConsultation.id,
        tenantId: newConsultation.tenantId,
        pacienteId: newConsultation.patientId,
        data_atendimento: newConsultation.date + 'T' + newConsultation.time,
        tipo: newConsultation.type,
        description: newConsultation.description,
        diagnosis: newConsultation.diagnosis,
        treatment: newConsultation.treatment,
        observations: newConsultation.observations,
        // Aliases em português
        queixa_principal: newConsultation.description,
        historico_br: newConsultation.diagnosis,
        observacoes_clinicas: newConsultation.treatment,
        conduta: newConsultation.observations,
      }, ...prev]);
      
      if (selectedAppointmentId && tenantId) {
        await completeConsultationUseCase.execute(selectedAppointmentId, tenantId);
        setAppointments(prev => prev.map(appt => 
          appt.id === selectedAppointmentId ? { ...appt, status: 'concluido' } : appt
        ));
      }
      
      toast.success('Atendimento registrado com sucesso');
      setIsNewConsultationOpen(false);
      setConsultationForm(initialConsultationForm);
      setSelectedAppointmentId('');
    } catch (error) {
      console.error('Erro ao salvar atendimento:', error);
      toast.error('Erro ao registrar atendimento');
    }
  };

  const completedAppointments = appointments.filter(a => 
    a.status === 'concluido' || a.status === 'realizada'
  );

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Erro ao carregar prontuário</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Link to="/pacientes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para pacientes
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (!paciente) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Prontuário não encontrado</h1>
          <p className="text-sm text-muted-foreground">O paciente informado não foi encontrado ou foi removido.</p>
          <Link to="/pacientes">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar para pacientes
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Prontuário do Paciente</h1>
            <p className="text-sm text-muted-foreground">ID: {paciente.id}</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isNewConsultationOpen} onOpenChange={setIsNewConsultationOpen}>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Registro de Atendimento (Anamnese)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="grid gap-2">
                    <Label htmlFor="agendamento">Vincular a consulta (opcional)</Label>
                    <Select 
                      value={selectedAppointmentId} 
                      onValueChange={setSelectedAppointmentId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma consulta" />
                      </SelectTrigger>
                      <SelectContent>
                        {completedAppointments.map(appt => (
                          <SelectItem key={appt.id} value={appt.id}>
                            {new Date(appt.date).toLocaleDateString('pt-BR')} - {appt.procedure}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="queixa_principal">Queixa Principal *</Label>
                    <Textarea
                      id="queixa_principal"
                      value={consultationForm.queixa_principal}
                      onChange={(e) => setConsultationForm({...consultationForm, queixa_principal: e.target.value})}
                      placeholder="Descreva a principal queixa do paciente..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="historico_br">Histórico Breve</Label>
                    <Textarea
                      id="historico_br"
                      value={consultationForm.historico_br}
                      onChange={(e) => setConsultationForm({...consultationForm, historico_br: e.target.value})}
                      placeholder="Histórico relevante do paciente..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="observacoes_clinicas">Observações Clínicas</Label>
                    <Textarea
                      id="observacoes_clinicas"
                      value={consultationForm.observacoes_clinicas}
                      onChange={(e) => setConsultationForm({...consultationForm, observacoes_clinicas: e.target.value})}
                      placeholder="Achados clínicos, exames, diagnósticos..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="conduta">Conduta</Label>
                    <Textarea
                      id="conduta"
                      value={consultationForm.conduta}
                      onChange={(e) => setConsultationForm({...consultationForm, conduta: e.target.value})}
                      placeholder="Tratamento realizado, orientações, retornos..."
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewConsultationOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSaveConsultation}>
                    Salvar Atendimento
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Link to="/pacientes">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </Link>
          </div>
        </div>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Dados do paciente</CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-2"
              onClick={() => setIsEditPacienteOpen(true)}
            >
              Editar
            </Button>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 font-bold text-primary">
                {paciente.nome.split(' ').filter(n => n).map((n) => n[0] || '').slice(0, 2).join('') || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-semibold text-card-foreground">{paciente.nome}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {paciente.telefone || 'Não informado'}
                </span>
                {paciente.cpf && (
                  <span>CPF: {paciente.cpf}</span>
                )}
                {paciente.email && (
                  <span>Email: {paciente.email}</span>
                )}
              </div>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Nascimento: {paciente.data_nascimento ? new Date(paciente.data_nascimento).toLocaleDateString('pt-BR') : 'Não informado'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Dialog open={isEditPacienteOpen} onOpenChange={setIsEditPacienteOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Dados do Paciente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nome">Nome</Label>
                <Input 
                  id="edit-nome" 
                  value={pacienteEditando.nome}
                  onChange={(e) => setPacienteEditando({...pacienteEditando, nome: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cpf">CPF</Label>
                  <Input 
                    id="edit-cpf" 
                    value={pacienteEditando.cpf}
                    onChange={(e) => setPacienteEditando({...pacienteEditando, cpf: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-telefone">Telefone</Label>
                  <Input 
                    id="edit-telefone" 
                    value={pacienteEditando.telefone}
                    onChange={(e) => setPacienteEditando({...pacienteEditando, telefone: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">E-mail</Label>
                <Input 
                  id="edit-email" 
                  type="email"
                  value={pacienteEditando.email}
                  onChange={(e) => setPacienteEditando({...pacienteEditando, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nascimento">Data de Nascimento</Label>
                <Input 
                  id="edit-nascimento" 
                  type="date"
                  value={pacienteEditando.data_nascimento}
                  onChange={(e) => setPacienteEditando({...pacienteEditando, data_nascimento: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-observacoes">Observações</Label>
                <Textarea 
                  id="edit-observacoes" 
                  value={pacienteEditando.observacoes}
                  onChange={(e) => setPacienteEditando({...pacienteEditando, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-historico">Histórico Clínico</Label>
                <Textarea 
                  id="edit-historico" 
                  value={pacienteEditando.historico_clinico}
                  onChange={(e) => setPacienteEditando({...pacienteEditando, historico_clinico: e.target.value})}
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditPacienteOpen(false)}>Cancelar</Button>
                <Button onClick={handleSavePaciente}>Salvar</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Atendimentos Registrados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {consultations.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum atendimento registrado.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsNewConsultationOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar primeiro atendimento
                </Button>
              </div>
            ) : (
              consultations.map((consultation) => (
                <div key={consultation.id} className="rounded-xl bg-secondary/50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(consultation.data_atendimento).toLocaleDateString('pt-BR')}
                      <Clock className="h-4 w-4 ml-2" />
                      {new Date(consultation.data_atendimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  
                  {consultation.queixa_principal && (
                    <div>
                      <p className="font-medium text-foreground">Queixa Principal</p>
                      <p className="text-sm text-muted-foreground mt-1">{consultation.queixa_principal}</p>
                    </div>
                  )}
                  
                  {consultation.historico_br && (
                    <div>
                      <p className="font-medium text-foreground text-sm">Histórico</p>
                      <p className="text-sm text-muted-foreground mt-1">{consultation.historico_br}</p>
                    </div>
                  )}
                  
                  {consultation.observacoes_clinicas && (
                    <div>
                      <p className="font-medium text-foreground text-sm">Observações Clínicas</p>
                      <p className="text-sm text-muted-foreground mt-1">{consultation.observacoes_clinicas}</p>
                    </div>
                  )}
                  
                  {consultation.conduta && (
                    <div>
                      <p className="font-medium text-foreground text-sm">Conduta</p>
                      <p className="text-sm text-muted-foreground mt-1">{consultation.conduta}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Anexos do Paciente</CardTitle>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                multiple
                onChange={handleUploadAttachments}
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={uploadingAttachment}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {uploadingAttachment ? 'Enviando...' : 'Adicionar PDF/Imagem'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {loadingAttachments ? (
              <p className="text-sm text-muted-foreground">Carregando anexos...</p>
            ) : attachments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum anexo enviado para este paciente.</p>
            ) : (
              attachments.map((attachment) => (
                <div
                  key={attachment.path}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {isImageMime(attachment.mimeType) ? (
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      )}
                      <p className="truncate text-sm font-medium text-foreground">{attachment.name}</p>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                      {attachment.createdAt ? ` • ${new Date(attachment.createdAt).toLocaleString('pt-BR')}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleOpenAttachment(attachment.path)}
                    >
                      <ExternalLink className="h-4 w-4" />
                      Abrir
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDeleteAttachment(attachment.path)}
                      aria-label={`Excluir anexo ${attachment.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle>Consultas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {appointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sem consultas agendadas.</p>
            ) : (
              appointments.slice(0, 10).map((consulta) => (
                <div key={consulta.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{consulta.procedure}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(`${consulta.date}T00:00:00`).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {consulta.time}
                      </span>
                    </div>
                  </div>
                  <Badge variant={statusVariants[consulta.status] ?? 'outline'}>
                    {statusLabels[consulta.status] ?? consulta.status}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Prontuario;
