import { MainLayout } from '@/components/layout/MainLayout';
import { Settings } from 'lucide-react';

const Configuracoes = () => (
  <MainLayout>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Configurações</h1>
      <div className="card-shadow flex flex-col items-center justify-center rounded-2xl bg-card p-16 text-center">
        <Settings className="mb-4 h-12 w-12 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">Em breve</p>
        <p className="mt-1 text-sm text-muted-foreground">Configurações da clínica, usuários e permissões</p>
      </div>
    </div>
  </MainLayout>
);

export default Configuracoes;
