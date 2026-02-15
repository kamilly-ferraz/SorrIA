import { MainLayout } from '@/components/layout/MainLayout';
import { mockFinance } from '@/data/mockData';
import { ArrowDownLeft, ArrowUpRight, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const monthlyData = [
  { mes: 'Set', entradas: 18500, saidas: 4200 },
  { mes: 'Out', entradas: 22300, saidas: 5100 },
  { mes: 'Nov', entradas: 19800, saidas: 3800 },
  { mes: 'Dez', entradas: 25100, saidas: 6200 },
  { mes: 'Jan', entradas: 21400, saidas: 4500 },
  { mes: 'Fev', entradas: 16500, saidas: 3200 },
];

const RelatorioFinanceiro = () => {
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'entrada' | 'saida'>('todos');

  const filtered = tipoFiltro === 'todos'
    ? mockFinance
    : mockFinance.filter(f => f.tipo === tipoFiltro);

  const totalEntradas = mockFinance.filter(f => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0);
  const totalSaidas = mockFinance.filter(f => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatório Financeiro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Análise detalhada de entradas e saídas</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Entradas</p>
            <p className="mt-1 text-2xl font-bold text-success">R$ {totalEntradas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Total Saídas</p>
            <p className="mt-1 text-2xl font-bold text-destructive">R$ {totalSaidas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Lucro Líquido</p>
            <p className="mt-1 text-2xl font-bold text-foreground">R$ {(totalEntradas - totalSaidas).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        {/* Chart */}
        <div className="card-shadow rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Faturamento Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 92%)" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
              <Bar dataKey="entradas" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saidas" fill="hsl(0 72% 51%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* List */}
        <div className="card-shadow rounded-2xl bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Movimentações</h3>
            <div className="flex gap-2">
              {(['todos', 'entrada', 'saida'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoFiltro(t)}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
                    tipoFiltro === t ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground hover:bg-accent'
                  )}
                >
                  {t === 'todos' ? 'Todos' : t === 'entrada' ? 'Entradas' : 'Saídas'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filtered.map((item, i) => (
              <div key={item.id} className="flex items-center gap-4 rounded-xl bg-secondary/50 px-4 py-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', item.tipo === 'entrada' ? 'bg-success/15 text-success' : 'bg-destructive/15 text-destructive')}>
                  {item.tipo === 'entrada' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{item.descricao}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.data).toLocaleDateString('pt-BR')}</p>
                </div>
                <span className={cn('font-semibold', item.tipo === 'entrada' ? 'text-success' : 'text-destructive')}>
                  {item.tipo === 'entrada' ? '+' : '-'} R$ {item.valor.toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RelatorioFinanceiro;
