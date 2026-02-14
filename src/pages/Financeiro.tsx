import { MainLayout } from '@/components/layout/MainLayout';
import { mockFinance } from '@/data/mockData';
import { ArrowDownLeft, ArrowUpRight, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

const Financeiro = () => {
  const entradas = mockFinance.filter(f => f.tipo === 'entrada').reduce((s, f) => s + f.valor, 0);
  const saidas = mockFinance.filter(f => f.tipo === 'saida').reduce((s, f) => s + f.valor, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Financeiro</h1>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Entradas</p>
            <p className="mt-1 text-2xl font-bold text-success">R$ {entradas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Saídas</p>
            <p className="mt-1 text-2xl font-bold text-destructive">R$ {saidas.toLocaleString('pt-BR')}</p>
          </div>
          <div className="card-shadow rounded-2xl bg-card p-5">
            <p className="text-sm text-muted-foreground">Saldo</p>
            <p className="mt-1 text-2xl font-bold text-foreground">R$ {(entradas - saidas).toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="card-shadow rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Movimentações Recentes</h3>
          <div className="space-y-3">
            {mockFinance.map((item, i) => (
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

export default Financeiro;
