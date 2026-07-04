import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import PwaStatusIndicator from '@/components/PwaStatusIndicator';
import InstallBanner from '@/components/pwa/InstallBanner';
import UpdatePrompt from '@/components/pwa/UpdatePrompt';
import ConnectivityIndicator from '@/components/pwa/ConnectivityIndicator';
import { cn } from '@/utils/cn';

const CONSULTA_ESCRITORIO = '(min-width: 1024px)';

export default function DashboardLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [isDesktop, setEsEscritorio] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(CONSULTA_ESCRITORIO);
    const actualizar = () => {
      const escritorio = mql.matches;
      setEsEscritorio(escritorio);
      // En escritorio abrimos por defecto; en móvil empezamos cerrado
      setSidebarAbierto(escritorio);
    };
    actualizar();
    mql.addEventListener('change', actualizar);
    return () => mql.removeEventListener('change', actualizar);
  }, []);

  const onToggleSidebar = () => setSidebarAbierto((p) => !p);
  const onCloseSidebar = () => {
    if (!isDesktop) setSidebarAbierto(false);
  };

  return (
    <div
      className={cn(
        'relative flex h-dvh min-h-dvh overflow-hidden',
        'bg-gradient-to-br from-background via-muted/40 to-brand-50/30',
        'dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
      )}
    >
      <Sidebar open={sidebarAbierto} isDesktop={isDesktop} onClose={onCloseSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={onToggleSidebar} />

        <div className="border-b border-border bg-card/80 px-3 py-2 backdrop-blur sm:hidden">
          <PwaStatusIndicator className="w-full justify-center" />
        </div>

        <main
          className={cn(
            'relative z-10 min-h-0 flex-1 overflow-y-auto',
            'bg-gradient-to-br from-background/80 via-muted/40 to-brand-50/20',
            'px-3 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-5',
            'sm:px-6 sm:py-8 lg:px-10 lg:pb-10',
            'dark:bg-gradient-to-br dark:from-slate-950/50 dark:via-slate-900/30 dark:to-slate-950/50',
          )}
        >
          <Outlet />
        </main>

        <MobileBottomNav />

        {/* PWA: install banner, update prompt, connectivity indicator */}
        <ConnectivityIndicator />
        <InstallBanner />
        <UpdatePrompt />
      </div>
    </div>
  );
}