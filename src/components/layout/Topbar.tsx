import { Search, Bell, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { currentUser } from '@/data/mockData';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function Topbar() {
  const initials = currentUser.nome
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('');

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur-sm">
      {/* Search */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar pacientes, prontuários..."
          className="h-10 rounded-xl border-border bg-secondary pl-10 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
        />
      </div>

      <div className="flex items-center gap-3">
        {/* New Appointment */}
        <Button size="sm" className="gap-2 rounded-xl font-semibold shadow-sm">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Novo Agendamento</span>
        </Button>

        {/* Notifications */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-destructive" />
        </button>

        {/* User */}
        <div className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-secondary cursor-pointer">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block">
            <p className="text-sm font-medium leading-none text-foreground">{currentUser.nome}</p>
            <p className="text-xs text-muted-foreground capitalize">{currentUser.papel}</p>
          </div>
          <ChevronDown className="hidden h-3 w-3 text-muted-foreground md:block" />
        </div>
      </div>
    </header>
  );
}
