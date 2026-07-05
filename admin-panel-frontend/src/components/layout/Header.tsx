import { Bell, LogOut, Menu, Sparkles, User, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
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
  'inline-flex items-center justify-center rounded-lg border border-border bg-card/80 p-3 text-muted-foreground shadow-soft-sm transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:p-2.5 dark:bg-card/60 dark:hover:bg-muted dark:hover:text-foreground';

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
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();

  return (
    <header
      className={cn(
        'relative z-20 flex h-[calc(4rem+env(safe-area-inset-top))] shrink-0 items-center justify-between pt-[env(safe-area-inset-top)]',
        'border-b border-border/70 bg-card/85 backdrop-blur-2xl',
        'px-3 sm:h-20 sm:px-6 sm:pt-0 lg:px-8',
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-24 top-[-140%] h-72 w-72 rounded-full bg-info/20 blur-[140px] dark:bg-info/15" />
        <div className="glass-blob glass-blob--reverse absolute right-[-32%] bottom-[-150%] h-80 w-80 rounded-full bg-brand-500/15 blur-[170px] dark:bg-brand-500/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-card/85 via-info-muted/30 to-brand-50/30 dark:from-card/10 dark:via-card/5 dark:to-card/5" />
      </div>

      <div className="relative flex min-w-0 items-center gap-2 sm:gap-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={cn(HEADER_BUTTON, 'lg:hidden')}
          aria-label="Mostrar u ocultar menú lateral"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300 sm:text-xs sm:tracking-[0.28em]">
            <Sparkles className="hidden h-3.5 w-3.5 sm:block" aria-hidden="true" />
            {headerCopy.badge}
          </span>
          <h2 className="truncate text-base font-semibold leading-tight text-foreground sm:text-lg">
            Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {headerCopy.subtitle}
          </p>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-2 sm:gap-3">
        <PwaStatusIndicator className="hidden sm:inline-flex" />

        {/* Notificaciones y toggle de tema: solo desktop. En móvil el header
            se llena con demasiados controles y se desborda el título "Bienvenido".
            El avatar/logout se mantiene visible siempre. */}
        <button
          type="button"
          aria-label="Notificaciones"
          className={cn(HEADER_BUTTON, 'relative hidden sm:inline-flex')}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {/* Notifications badge — empty by default. Use a store query when available. */}
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 hidden h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-info px-1 text-[10px] font-semibold text-white"
          />
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          aria-pressed={theme === 'dark'}
          className={cn(HEADER_BUTTON, 'hidden sm:inline-flex')}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
        </button>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-card/80 px-1.5 py-1.5 shadow-soft-sm dark:bg-card/60">
          <div
            aria-hidden="true"
            className="flex h-11 w-11 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 via-info to-role-super text-sm font-semibold text-white shadow-inner sm:h-10 sm:w-10 sm:rounded-lg"
          >
            {initials || <User className="h-5 w-5" />}
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-foreground">{fullName || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md p-2.5',
              'border border-danger/30 bg-danger-muted text-danger',
              'transition-colors hover:bg-danger hover:text-danger-foreground',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-background',
              'dark:bg-danger-muted dark:text-danger',
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}
