import { ReactNode, useState, useEffect } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored !== null) {
      setSidebarCollapsed(JSON.parse(stored));
    }

    const handleSidebarChange = () => {
      const stored = localStorage.getItem('sidebar-collapsed');
      if (stored !== null) {
        setSidebarCollapsed(JSON.parse(stored));
      }
    };

    window.addEventListener('sidebar-collapse', handleSidebarChange);
    return () => window.removeEventListener('sidebar-collapse', handleSidebarChange);
  }, []);

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-blue-50 to-sky-100">
      <AppSidebar />
      <Topbar />
      <div 
        className="transition-all duration-300"
        style={{ 
          paddingTop: '64px',
          paddingLeft: sidebarWidth 
        }}
      >
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
