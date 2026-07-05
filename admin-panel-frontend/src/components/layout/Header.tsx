import { useEffect, useRef } from 'react';
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sparkles,
  Sun,
  User as UserIcon,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '@/context/theme';
import PwaStatusIndicator from '@/components/PwaStatusIndicator';
import { obtenerMetaRol } from '@/utils/roles';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

type HeaderProps = {
  onToggleSidebar: () => void;
};

const HEADER_COPY: Record<UserRole, { badge: string; subtitle: string }> = {
  SUPER_ADMIN: {
    badge: 'Panel Operativo',
    subtitle: 'Controla la operación médica con insights en tiempo real',
  },
  ADMIN: {
    badge: 'Panel Operativo',
    subtitle: 'Controla la operación médica con insights en tiempo real',
  },
  DOCTOR: {
    badge: 'Panel Clínico',
    subtitle: 'Organiza tu agenda y registra atenciones clínicas',
  },
  NURSE: {
    badge: 'Panel Clínico',
    subtitle: 'Registra signos vitales y soporte clínico',
  },
  PATIENT: {
    badge: 'Mi salud',
    subtitle: 'Revisa tus citas y documentos clínicos',
  },
  AGENT: {
    badge: 'Panel de Asesoría',
    subtitle: 'Agenda servicios y gestiona tus comisiones',
  },
};

const HEADER_BUTTON =
  'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border bg-card/80 text-muted-foreground shadow-soft-sm transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:h-10 sm:w-10 dark:bg-card/60 dark:hover:bg-muted dark:hover:text-foreground';

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const metaRol = obtenerMetaRol(user?.role);
  const roleLabel = metaRol.etiqueta;
  const headerCopy = user?.role ? HEADER_COPY[user.role] : HEADER_COPY.ADMIN;
  const initials = (user?.firstName?.[0] ?? '') + (user?.lastName?.[0] ?? '');
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Usuario';

  // Cierra el menú al hacer click fuera o presionar Escape
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!detailsRef.current) return;
      if (!detailsRef.current.open) return;
      if (event.target instanceof Node && detailsRef.current.contains(event.target)) {
        return;
      }
      detailsRef.current.removeAttribute('open');
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && detailsRef.current?.open) {
        detailsRef.current.removeAttribute('open');
      }
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between pt-[env(safe-area-inset-top)]',
        'border-b border-border/70 bg-card/90 backdrop-blur-xl',
        'px-3 sm:h-16 sm:px-6 sm:pt-0 lg:px-8',
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-24 top-[-140%] h-72 w-72 rounded-full bg-info/20 blur-[140px] dark:bg-info/15" />
        <div className="glass-blob glass-blob--reverse absolute right-[-32%] bottom-[-150%] h-80 w-80 rounded-full bg-brand-500/15 blur-[170px] dark:bg-brand-500/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/85 via-info-muted/30 to-brand-50/30 dark:from-card/10 dark:via-card/5 dark:to-card/5" />
      </div>

      <div className="relative flex min-w-0 items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(HEADER_BUTTON, 'lg:hidden')}
          aria-label="Mostrar u ocultar menú lateral"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="flex min-w-0 flex-col">
          <span className="hidden truncate text-[10px] font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300 sm:inline-flex sm:items-center sm:gap-2 sm:text-xs sm:tracking-[0.28em]">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            {headerCopy.badge}
          </span>
          {/* En móvil solo título compacto para evitar overflow */}
          <h2 className="truncate text-base font-semibold leading-tight text-foreground sm:text-lg">
            <span className="sm:hidden">{headerCopy.badge}</span>
            <span className="hidden sm:inline">
              Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
            </span>
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {headerCopy.subtitle}
          </p>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
        <PwaStatusIndicator className="hidden md:inline-flex" />

        {/* Búsqueda — placeholder desktop */}
        <div className="hidden lg:block">
          <label htmlFor="busqueda-header" className="sr-only">
            Buscar en el panel
          </label>
          <div className="relative">
            <input
              id="busqueda-header"
              type="search"
              placeholder="Buscar…"
              className={cn(
                'h-10 w-56 rounded-lg border border-border bg-card/70 pl-9 pr-3 text-sm',
                'text-foreground placeholder:text-muted-foreground/70',
                'transition-colors focus:border-brand-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                'dark:bg-card/50',
              )}
            />
            <span className="pointer-events-none absolute inset-y-0 left-0 flex w-9 items-center justify-center text-muted-foreground">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </span>
          </div>
        </div>

        {/* Notificaciones */}
        <button
          type="button"
          aria-label="Notificaciones"
          className={cn(HEADER_BUTTON, 'relative')}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-card"
          />
        </button>

        {/* Toggle de tema — visible siempre, ocupa menos espacio que el avatar dropdown */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          aria-pressed={theme === 'dark'}
          className={HEADER_BUTTON}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>

        {/* Menú de usuario — dropdown accesible mediante <details> */}
        <details
          ref={detailsRef}
          className="group relative"
        >
          <summary
            className={cn(
              'flex h-11 cursor-pointer list-none items-center gap-1.5 rounded-lg border border-border bg-card/80 pl-1.5 pr-2 text-foreground shadow-soft-sm transition-colors',
              'hover:border-brand-300 hover:bg-brand-50/60',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'sm:h-10 dark:bg-card/60 dark:hover:bg-muted',
              '[&::-webkit-details-marker]:hidden',
            )}
          >
            <div
              aria-hidden="true"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 via-info to-role-super text-sm font-semibold text-white"
            >
              {initials || <UserIcon className="h-4 w-4" />}
            </div>
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold leading-tight text-foreground">{fullName}</p>
              <p className="text-[10px] leading-tight text-muted-foreground">{roleLabel}</p>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 flex-shrink-0 text-muted-foreground motion-safe:transition-transform group-open:rotate-180 sm:block" aria-hidden="true" />
          </summary>

          <div
            role="menu"
            className={cn(
              'absolute right-0 top-full z-40 mt-2 min-w-[14rem] rounded-xl border border-border bg-card p-1 shadow-soft-lg',
              'ring-1 ring-black/5 dark:ring-white/5',
            )}
          >
            {/* Header del dropdown — solo en mobile donde el summary no muestra nombre */}
            <div className="border-b border-border px-3 py-2.5 sm:hidden">
              <p className="text-sm font-semibold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
            </div>

            <button
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground',
                'hover:bg-muted focus:bg-muted focus:outline-none',
              )}
            >
              <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Mi perfil</span>
            </button>

            <button
              type="button"
              role="menuitem"
              onClick={toggleTheme}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground',
                'hover:bg-muted focus:bg-muted focus:outline-none',
              )}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> : <Moon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>

            <button
              type="button"
              role="menuitem"
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-foreground',
                'hover:bg-muted focus:bg-muted focus:outline-none',
              )}
            >
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              <span>Preferencias</span>
            </button>

            <div className="my-1 h-px bg-border" aria-hidden="true" />

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-danger',
                'hover:bg-danger/10 focus:bg-danger/10 focus:outline-none',
              )}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </details>
      </div>
    </header>
  );
}
