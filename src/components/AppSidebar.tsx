import { Link, useLocation } from 'react-router-dom';
import { Calendar, Users, Building2, Scissors, LayoutDashboard, Settings, BarChart3, Shield, Activity } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import SorrIABrand from '@/components/SorrIABrand';
import logo from '@/assets/sorria-logo.png';

const allNavItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'dentist'] },
  { to: '/super-admin', icon: Shield, label: 'Super Admin', roles: ['super_admin'] },
  { to: '/agenda', icon: Calendar, label: 'Agenda', roles: ['admin', 'dentist'] },
  { to: '/pacientes', icon: Users, label: 'Pacientes', roles: ['admin', 'dentist'] },
  { to: '/consultorios', icon: Building2, label: 'Consultórios', roles: ['admin'] },
  { to: '/procedimentos', icon: Scissors, label: 'Procedimentos', roles: ['admin', 'dentist'] },
  { to: '/relatorios', icon: BarChart3, label: 'Relatórios', roles: ['admin'] },
  { to: '/auditoria', icon: Activity, label: 'Auditoria', roles: ['admin'] },
  { to: '/configuracoes', icon: Settings, label: 'Configurações', roles: ['admin'] },
];

export default function AppSidebar() {
  const location = useLocation();
  const { role, profile } = useAuth();

  const navItems = allNavItems.filter((item) => item.roles.includes(role || 'dentist'));

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

  const avatarUrl = profile?.avatar_url
    ? supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl
    : null;

  const roleLabel = role === 'super_admin' ? 'Super Admin' : role === 'admin' ? 'Administrador' : 'Dentista';

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-sidebar-border">
        <img src={logo} alt="SorrIA" className="h-10 w-10 rounded-lg" />
        <div>
          <SorrIABrand size="lg" invertContrast />
          <p className="text-xs text-sidebar-foreground/60">ERP Odontológico</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Avatar className="h-8 w-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt={profile?.full_name} />}
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">{initials}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="text-sm text-sidebar-foreground/80 truncate block">{profile?.full_name || 'Carregando...'}</span>
            <span className="text-xs text-sidebar-foreground/50">{roleLabel}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
