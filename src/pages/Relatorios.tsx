import { MainLayout } from '@/components/layout/MainLayout';
import { BarChart3 } from 'lucide-react';

const Relatorios = () => (
  <MainLayout>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Relatórios</h1>
      <div className="card-shadow flex flex-col items-center justify-center rounded-2xl bg-card p-16 text-center">
        <BarChart3 className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">Em breve</p>
        <p className="mt-1 text-sm text-muted-foreground">Relatórios avançados com BI integrado</p>
      </div>
    </div>
  </MainLayout>
);

export default Relatorios;
