import type { Patient, Appointment, FinanceRecord, StockItem, AIInsight, User } from '@/types/sorria';

export const currentUser: User = {
  id: '1',
  nome: 'Dra. Carolina Mendes',
  email: 'carolina@sorria.com',
  papel: 'dentista',
  avatar_url: '',
};

export const mockPatients: Patient[] = [
  { id: '1', nome: 'Maria Silva', telefone: '(11) 99123-4567', data_nascimento: '1985-03-15', historico_clinico: 'Paciente com histórico de cáries recorrentes. Última limpeza há 8 meses.', radiografias: [], ativo: true, created_at: '2024-01-10', avatar_url: '' },
  { id: '2', nome: 'João Oliveira', telefone: '(11) 98765-4321', data_nascimento: '1978-07-22', historico_clinico: 'Tratamento de canal realizado em 2023. Acompanhamento periodontal.', radiografias: [], ativo: true, created_at: '2024-02-05', avatar_url: '' },
  { id: '3', nome: 'Ana Costa', telefone: '(11) 91234-5678', data_nascimento: '1992-11-08', historico_clinico: 'Uso de aparelho ortodôntico. Consultas mensais.', radiografias: [], ativo: true, created_at: '2024-03-12', avatar_url: '' },
  { id: '4', nome: 'Carlos Santos', telefone: '(11) 97654-3210', data_nascimento: '1965-01-30', historico_clinico: 'Prótese parcial superior. Acompanhamento semestral.', radiografias: [], ativo: true, created_at: '2024-04-01', avatar_url: '' },
  { id: '5', nome: 'Beatriz Lima', telefone: '(11) 93456-7890', data_nascimento: '2000-06-14', historico_clinico: 'Clareamento dental realizado recentemente.', radiografias: [], ativo: true, created_at: '2024-05-20', avatar_url: '' },
];

export const mockAppointments: Appointment[] = [
  { id: '1', paciente_id: '1', paciente_nome: 'Maria Silva', data: '2026-02-14', horario: '09:00', procedimento: 'Limpeza + Avaliação', status: 'aguardando', cadeira: 1 },
  { id: '2', paciente_id: '2', paciente_nome: 'João Oliveira', data: '2026-02-14', horario: '10:00', procedimento: 'Restauração Classe II', status: 'agendado', cadeira: 2 },
  { id: '3', paciente_id: '3', paciente_nome: 'Ana Costa', data: '2026-02-14', horario: '11:00', procedimento: 'Manutenção Ortodôntica', status: 'agendado', cadeira: 1 },
  { id: '4', paciente_id: '4', paciente_nome: 'Carlos Santos', data: '2026-02-14', horario: '14:00', procedimento: 'Ajuste de Prótese', status: 'agendado', cadeira: 3 },
  { id: '5', paciente_id: '5', paciente_nome: 'Beatriz Lima', data: '2026-02-14', horario: '15:30', procedimento: 'Avaliação Clareamento', status: 'agendado', cadeira: 2 },
];

export const mockFinance: FinanceRecord[] = [
  { id: '1', tipo: 'entrada', valor: 450, descricao: 'Limpeza - Maria Silva', data: '2026-02-14' },
  { id: '2', tipo: 'entrada', valor: 1200, descricao: 'Restauração - Pedro Almeida', data: '2026-02-14' },
  { id: '3', tipo: 'saida', valor: 320, descricao: 'Material de consumo', data: '2026-02-14' },
  { id: '4', tipo: 'entrada', valor: 800, descricao: 'Ortodontia - Ana Costa', data: '2026-02-13' },
  { id: '5', tipo: 'entrada', valor: 350, descricao: 'Consulta - Carlos Santos', data: '2026-02-13' },
];

export const mockStock: StockItem[] = [
  { id: '1', item: 'Resina Composta A2', quantidade: 12, nivel_alerta: 5 },
  { id: '2', item: 'Anestésico Lidocaína', quantidade: 3, nivel_alerta: 10 },
  { id: '3', item: 'Luvas Procedimento M', quantidade: 45, nivel_alerta: 20 },
  { id: '4', item: 'Fio de Sutura 4-0', quantidade: 8, nivel_alerta: 5 },
  { id: '5', item: 'Broca Diamantada 1012', quantidade: 2, nivel_alerta: 5 },
];

export const mockInsights: AIInsight[] = [
  {
    id: '1',
    paciente_id: '1',
    insight_texto: 'Padrão de cáries recorrentes identificado na região posterior. Recomenda-se abordagem preventiva intensiva.',
    sugestao_tratamento: 'Aplicação de selante nos pré-molares + programa de fluoretação quinzenal por 3 meses',
    justificativa: 'Histórico de 4 restaurações nos últimos 2 anos na mesma região. Dieta rica em carboidratos refinados relatada.',
    probabilidade: 87,
    created_at: '2026-02-14',
  },
  {
    id: '2',
    paciente_id: '2',
    insight_texto: 'Risco periodontal moderado detectado. Perda óssea inicial observada em radiografia panorâmica.',
    sugestao_tratamento: 'Raspagem subgengival + acompanhamento trimestral com sondagem periodontal',
    justificativa: 'Bolsas periodontais de 4-5mm nos dentes 16, 26 e 36. Sangramento à sondagem presente.',
    probabilidade: 74,
    created_at: '2026-02-13',
  },
];

export function getTodayRevenue(): number {
  return mockFinance
    .filter(f => f.data === '2026-02-14' && f.tipo === 'entrada')
    .reduce((sum, f) => sum + f.valor, 0);
}

export function getStockAlerts(): number {
  return mockStock.filter(s => s.quantidade <= s.nivel_alerta).length;
}

export function getTodayPatientCount(): number {
  return mockAppointments.filter(a => a.data === '2026-02-14').length;
}
