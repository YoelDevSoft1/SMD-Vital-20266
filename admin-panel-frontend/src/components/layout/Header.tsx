import { Bell, LogOut, Menu, Sparkles, User, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/theme';
import PwaStatusIndicator from '@/components/PwaStatusIndicator';
import type { UserRole } from '@/types';

type HeaderProps = {
  onToggleSidebar: () => void;
};

const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN: 'Administrador',
  DOCTOR: 'Medico',
  NURSE: 'Enfermeria',
  PATIENT: 'Paciente',
};

const HEADER_COPY: Record<UserRole, { badge: string; subtitle: string }> = {
  SUPER_ADMIN: {
    badge: 'Panel Operativo',
    subtitle: 'Controla la operacion medica con insights en tiempo real',
  },
  ADMIN: {
    badge: 'Panel Operativo',
    subtitle: 'Controla la operacion medica con insights en tiempo real',
  },
  DOCTOR: {
    badge: 'Panel Clinico',
    subtitle: 'Organiza tu agenda y registra atenciones clinicas',
  },
  NURSE: {
    badge: 'Panel Clinico',
    subtitle: 'Registra signos vitales y soporte clinico',
  },
  PATIENT: {
    badge: 'Mi salud',
    subtitle: 'Revisa tus citas y documentos clinicos',
  },
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const roleLabel =
    (user?.role && ROLE_LABELS[user.role]) ?? user?.role ?? 'Usuario';
  const headerCopy = user?.role ? HEADER_COPY[user.role] : HEADER_COPY.ADMIN;

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center justify-between overflow-hidden border-b border-slate-200/70 bg-white/85 px-3 backdrop-blur-2xl sm:h-20 sm:px-6 lg:px-8 dark:border-white/5 dark:bg-slate-900/70">
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-24 top-[-140%] h-72 w-72 rounded-full bg-cyan-400/25 blur-[140px] dark:bg-cyan-500/15" />
        <div className="glass-blob glass-blob--reverse absolute right-[-32%] bottom-[-150%] h-80 w-80 rounded-full bg-blue-500/20 blur-[170px] dark:bg-blue-500/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/85 via-cyan-50/70 to-blue-50/70 dark:from-white/10 dark:via-white/5 dark:to-white/8" />
      </div>

      <div className="relative flex min-w-0 items-center gap-2 sm:gap-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white/80 text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-white lg:hidden dark:border-white/20 dark:bg-slate-900/60 dark:text-white dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-200 dark:focus:ring-offset-slate-900"
          aria-label="Mostrar u ocultar menú lateral"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex min-w-0 flex-col">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-cyan-600 dark:text-cyan-200">
            <Sparkles className="hidden h-3.5 w-3.5 sm:block" />
            {headerCopy.badge}
          </span>
          <h2 className="truncate text-sm font-semibold text-slate-900 sm:text-lg dark:text-white">
            Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="hidden text-xs text-slate-500 sm:block dark:text-slate-300">
            {headerCopy.subtitle}
          </p>
        </div>
      </div>

      <div className="relative flex shrink-0 items-center gap-2 sm:gap-4">
        <PwaStatusIndicator className="hidden sm:inline-flex" />
        <button
          type="button"
          className="hidden rounded-xl border border-slate-200 bg-white/80 p-3 text-slate-600 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-white sm:relative sm:block dark:border-white/20 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-300 dark:focus:ring-offset-slate-900"
          aria-label="Notificaciones"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-[10px] font-semibold text-white">
            3
          </span>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="inline-flex rounded-xl border border-slate-200 bg-white/80 p-2.5 text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-300/60 focus:ring-offset-2 focus:ring-offset-white sm:p-3 dark:border-white/20 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-300 dark:focus:ring-offset-slate-900"
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-1.5 py-1.5 shadow-sm dark:border-white/20 dark:bg-slate-900/60">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-500 text-white shadow-inner transition group-hover:brightness-110 sm:h-10 sm:w-10 sm:rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl border border-red-200/80 bg-red-50/80 p-2 text-red-500 transition hover:border-red-300 hover:bg-red-100 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300/70 focus:ring-offset-2 focus:ring-offset-white dark:border-red-400/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:border-red-400/60 dark:hover:bg-red-500/20 dark:hover:text-red-200"
            title="Cerrar sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
