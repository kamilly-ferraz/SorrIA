export interface Patient {
  id: string;
  nome: string;
  telefone: string;
  data_nascimento: string;
  historico_clinico: string;
  radiografias: string[];
  ativo: boolean;
  created_at: string;
  avatar_url?: string;
}

export interface Appointment {
  id: string;
  paciente_id: string;
  paciente_nome: string;
  data: string;
  horario: string;
  procedimento: string;
  status: 'agendado' | 'aguardando' | 'em_atendimento' | 'concluido' | 'cancelado';
  cadeira?: number;
}

export interface FinanceRecord {
  id: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao: string;
  data: string;
}

export interface StockItem {
  id: string;
  item: string;
  quantidade: number;
  nivel_alerta: number;
}

export type UserRole = 'admin' | 'dentista';

export interface User {
  id: string;
  nome: string;
  email: string;
  papel: UserRole;
  avatar_url?: string;
}
