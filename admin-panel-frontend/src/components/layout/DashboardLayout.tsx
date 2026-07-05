import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import InstallBanner from '@/components/pwa/InstallBanner';
import UpdatePrompt from '@/components/pwa/UpdatePrompt';
import ConnectivityIndicator from '@/components/pwa/ConnectivityIndicator';
import { cn } from '@/utils/cn';

const CONSULTA_ESCRITORIO = '(min-width: 1024px)';
const LLAVE_COLAPSO_SIDEBAR = 'smd-vital:sidebar-colapsado';

/** Lee una preferencia persistida con fallback defensivo. */
function leerColapsoSidebar(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(LLAVE_COLAPSO_SIDEBAR) === '1';
  } catch {
    return false;
  }
}

export default function DashboardLayout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [isDesktop, setEsEscritorio] = useState(false);
  // Inicialización perezosa — leer localStorage solo en el cliente
  const [sidebarColapsado, setSidebarColapsado] = useState<boolean>(() => leerColapsoSidebar());

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

  // Persistir preferencia de colapso
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(LLAVE_COLAPSO_SIDEBAR, sidebarColapsado ? '1' : '0');
    } catch {
      // Ignorar errores de cuota o storage bloqueado
    }
  }, [sidebarColapsado]);

  const onToggleSidebar = () => setSidebarAbierto((p) => !p);
  const onCloseSidebar = () => {
    if (!isDesktop) setSidebarAbierto(false);
  };
  const onToggleColapsado = () => setSidebarColapsado((p) => !p);

  return (
    <div
      className={cn(
        'relative flex h-dvh min-h-dvh overflow-hidden',
        'bg-gradient-to-br from-background via-muted/40 to-brand-50/30',
        'dark:bg-gradient-to-br dark:from-slate-950 dark:via-slate-900 dark:to-slate-950',
      )}
    >
      {/* Skip-to-content — accesibilidad teclado */}
      <a
        href="#contenido-principal"
        className={cn(
          'sr-only focus:not-sr-only',
          'fixed left-3 top-3 z-[100] rounded-md',
          'bg-brand-600 px-3 py-2 text-sm font-semibold text-white shadow-soft-md',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        Saltar al contenido principal
      </a>

      <Sidebar
        open={sidebarAbierto}
        isDesktop={isDesktop}
        onClose={onCloseSidebar}
        collapsed={sidebarColapsado}
        onToggleCollapsed={onToggleColapsado}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onToggleSidebar={onToggleSidebar} />

        <main
          id="contenido-principal"
          tabIndex={-1}
          className={cn(
            'relative z-10 min-h-0 flex-1 overflow-y-auto outline-none',
            'scroll-pt-20',
            'bg-gradient-to-br from-background/80 via-muted/40 to-brand-50/20',
            // Móvil: padding-bottom extra para que el bottom nav no tape contenido
            'px-3 pb-[calc(env(safe-area-inset-bottom)+7rem)] pt-5',
            // Tablet+: padding normal sin bottom nav visible
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
