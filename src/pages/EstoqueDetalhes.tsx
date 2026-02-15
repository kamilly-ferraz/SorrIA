import { MainLayout } from '@/components/layout/MainLayout';
import { mockStock } from '@/data/mockData';
import { Package, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';

const mockMovimentacoes = [
  { id: '1', item: 'Anestésico Lidocaína', tipo: 'saida', quantidade: 2, data: '2026-02-14', motivo: 'Uso em procedimento' },
  { id: '2', item: 'Resina Composta A2', tipo: 'entrada', quantidade: 10, data: '2026-02-13', motivo: 'Reposição fornecedor' },
  { id: '3', item: 'Broca Diamantada 1012', tipo: 'saida', quantidade: 1, data: '2026-02-13', motivo: 'Desgaste natural' },
  { id: '4', item: 'Luvas Procedimento M', tipo: 'entrada', quantidade: 50, data: '2026-02-12', motivo: 'Compra mensal' },
  { id: '5', item: 'Fio de Sutura 4-0', tipo: 'saida', quantidade: 3, data: '2026-02-11', motivo: 'Uso em cirurgia' },
];

const EstoqueDetalhes = () => {
  const itensBaixos = mockStock.filter(s => s.quantidade <= s.nivel_alerta);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Detalhes do Estoque</h1>
          <p className="mt-1 text-sm text-muted-foreground">Movimentações e alertas de estoque</p>
        </div>

        {/* Alerts */}
        {itensBaixos.length > 0 && (
          <div className="card-shadow rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Itens Abaixo do Mínimo
            </h3>
            <div className="space-y-2">
              {itensBaixos.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-card px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Package className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium text-card-foreground">{item.item}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-destructive">{item.quantidade}</span>
                    <span className="text-xs text-muted-foreground"> / mín. {item.nivel_alerta}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Full stock */}
        <div className="card-shadow overflow-hidden rounded-2xl bg-card">
          <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Item</span>
            <span className="text-center">Quantidade</span>
            <span className="text-center">Nível Alerta</span>
            <span className="text-center">Status</span>
          </div>
          {mockStock.map((item) => {
            const isLow = item.quantidade <= item.nivel_alerta;
            return (
              <div key={item.id} className="grid grid-cols-4 items-center gap-4 border-b border-border/50 px-6 py-4 transition-colors hover:bg-secondary/50">
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{item.item}</span>
                </div>
                <span className={cn('text-center text-sm font-semibold', isLow ? 'text-destructive' : 'text-foreground')}>{item.quantidade}</span>
                <span className="text-center text-sm text-muted-foreground">{item.nivel_alerta}</span>
                <div className="flex justify-center">
                  {isLow ? (
                    <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" /> Baixo
                    </span>
                  ) : (
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">Normal</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Movimentações */}
        <div className="card-shadow rounded-2xl bg-card p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Histórico de Movimentações</h3>
          <div className="space-y-3">
            {mockMovimentacoes.map((mov, i) => (
              <div key={mov.id} className="flex items-center gap-4 rounded-xl bg-secondary/50 px-4 py-3 animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', mov.tipo === 'entrada' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning')}>
                  {mov.tipo === 'entrada' ? <ArrowDown className="h-4 w-4" /> : <ArrowUp className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-card-foreground">{mov.item}</p>
                  <p className="text-xs text-muted-foreground">{mov.motivo}</p>
                </div>
                <div className="text-right">
                  <p className={cn('text-sm font-semibold', mov.tipo === 'entrada' ? 'text-success' : 'text-warning')}>
                    {mov.tipo === 'entrada' ? '+' : '-'}{mov.quantidade} un
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(mov.data).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default EstoqueDetalhes;
