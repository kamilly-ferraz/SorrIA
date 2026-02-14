import { MainLayout } from '@/components/layout/MainLayout';
import { mockStock } from '@/data/mockData';
import { Package, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Estoque = () => {
  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Estoque</h1>

        <div className="card-shadow overflow-hidden rounded-2xl bg-card">
          <div className="grid grid-cols-4 gap-4 border-b border-border px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Item</span>
            <span className="text-center">Quantidade</span>
            <span className="text-center">Nível Alerta</span>
            <span className="text-center">Status</span>
          </div>
          {mockStock.map((item, i) => {
            const isLow = item.quantidade <= item.nivel_alerta;
            return (
              <div
                key={item.id}
                className="grid grid-cols-4 items-center gap-4 border-b border-border/50 px-6 py-4 transition-colors hover:bg-secondary/50 animate-fade-in"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-card-foreground">{item.item}</span>
                </div>
                <span className={cn('text-center text-sm font-semibold', isLow ? 'text-destructive' : 'text-foreground')}>
                  {item.quantidade}
                </span>
                <span className="text-center text-sm text-muted-foreground">{item.nivel_alerta}</span>
                <div className="flex justify-center">
                  {isLow ? (
                    <span className="flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                      <AlertTriangle className="h-3 w-3" />
                      Baixo
                    </span>
                  ) : (
                    <span className="rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                      Normal
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </MainLayout>
  );
};

export default Estoque;
