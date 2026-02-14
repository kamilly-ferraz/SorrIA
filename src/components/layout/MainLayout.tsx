import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { Topbar } from './Topbar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      {/* Content area offset by sidebar width */}
      <div className="flex flex-1 flex-col pl-[72px] transition-all duration-300 lg:pl-[260px]">
        <Topbar />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
