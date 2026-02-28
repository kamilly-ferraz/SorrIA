import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import logo from '@/assets/images/sorria-logo.png';

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
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { role } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setCollapsed(JSON.parse(stored));
    }
  }, []);

  const handleCollapse = () => {
    const newState = !collapsed;
    setCollapsed(newState);
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newState));
    window.dispatchEvent(new Event('sidebar-collapse'));
  };

  const filteredItems = navItems.filter(item => !role || item.roles.includes(role));

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-300',
        collapsed ? 'w-[72px]' : 'w-[260px]'
      )}
      style={{ backgroundColor: 'hsl(var(--sidebar-background))' }}
    >
      {/* Logo */}
      <div 
        className="flex h-16 items-center gap-3 border-b px-5"
        style={{ borderColor: 'hsl(var(--sidebar-border))' }}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl overflow-hidden bg-white shadow-sm">
          <img src={logo} alt="SorrIA" className="h-full w-full object-cover" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-white">
            Sorr<span style={{ color: '#40A9FF' }}>IA</span>
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
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'bg-white/20 text-white' 
                  : 'text-white/70 hover:bg-white/10 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.7)' }}
            >
              <item.icon className="h-5 w-5 shrink-0" style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.7)' }} />
              {!collapsed && <span style={{ color: isActive ? 'white' : 'rgba(255,255,255,0.7)' }}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={handleCollapse}
        className="flex h-12 items-center justify-center border-t transition-colors hover:bg-white/10"
        style={{ borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {collapsed ? <ChevronRight className="h-4 w-4 text-white/70" /> : <ChevronLeft className="h-4 w-4 text-white/70" />}
      </button>
    </aside>
  );
}
