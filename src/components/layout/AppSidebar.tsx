import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  Package,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  SmilePlus,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

type AppRole = 'admin' | 'dentista';

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  roles: AppRole[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/', roles: ['admin', 'dentista'] },
  { label: 'Pacientes', icon: Users, path: '/pacientes', roles: ['admin', 'dentista'] },
  { label: 'Agenda', icon: Calendar, path: '/agenda', roles: ['admin', 'dentista'] },
  { label: 'Financeiro', icon: DollarSign, path: '/financeiro', roles: ['admin'] },
  { label: 'Estoque', icon: Package, path: '/estoque', roles: ['admin'] },
  { label: 'Relatórios', icon: BarChart3, path: '/relatorios', roles: ['admin'] },
  { label: 'Configurações', icon: Settings, path: '/configuracoes', roles: ['admin', 'dentista'] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  const filteredItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <SmilePlus className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-sidebar-primary-foreground">
            SorrIA
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                collapsed && 'justify-center px-2'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-muted transition-colors hover:text-sidebar-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
