import { MainLayout } from '@/components/layout/MainLayout';
import { mockPatients } from '@/data/mockData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Plus, Phone, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

const Pacientes = () => {
  const [search, setSearch] = useState('');
  const filtered = mockPatients.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.telefone.includes(search)
  );

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pacientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">{mockPatients.length} pacientes cadastrados</p>
          </div>
          <Button className="gap-2 rounded-xl font-semibold">
            <Plus className="h-4 w-4" />
            Novo Paciente
          </Button>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou telefone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="rounded-xl bg-card pl-10"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((patient, i) => (
            <div
              key={patient.id}
              className="card-shadow rounded-2xl bg-card p-5 transition-all hover:card-shadow-hover cursor-pointer animate-fade-in"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 font-bold text-primary">
                    {patient.nome.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-card-foreground">{patient.nome}</p>
                  <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {patient.telefone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(patient.data_nascimento).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </div>
              <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{patient.historico_clinico}</p>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
};

export default Pacientes;
