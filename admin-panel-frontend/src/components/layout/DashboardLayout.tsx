import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      setIsSidebarOpen(desktop);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen((previous) => !previous);
  };

  const closeSidebar = () => {
    if (!isDesktop) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-blue-50/50 dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <Sidebar isOpen={isSidebarOpen} isDesktop={isDesktop} onClose={closeSidebar} />

      {isSidebarOpen && !isDesktop && (
        <button
          type="button"
          onClick={closeSidebar}
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-sm transition-opacity lg:hidden dark:bg-slate-950/70"
          aria-label="Cerrar menú lateral"
        />
      )}

      <div className="flex flex-1 flex-col lg:pl-0">
        <Header onToggleSidebar={toggleSidebar} />
        <main className="relative z-10 flex-1 overflow-y-auto bg-gradient-to-br from-slate-50/80 via-slate-100/50 to-blue-50/30 px-3 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-5 sm:px-6 sm:py-8 lg:px-10 lg:pb-8 dark:bg-gradient-to-br dark:from-slate-950/50 dark:via-slate-900/30 dark:to-slate-950/50">
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
