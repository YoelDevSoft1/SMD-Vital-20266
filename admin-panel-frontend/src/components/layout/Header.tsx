import { Bell, LogOut, Menu, Sparkles, User, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/theme';
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
    <header className="relative z-20 flex h-20 items-center justify-between overflow-hidden border-b border-white/10 bg-white/12 px-4 backdrop-blur-2xl sm:px-6 lg:px-8 dark:border-white/5 dark:bg-slate-900/70">
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-24 top-[-140%] h-72 w-72 rounded-full bg-cyan-400/25 blur-[140px] dark:bg-cyan-500/15" />
        <div className="glass-blob glass-blob--reverse absolute right-[-32%] bottom-[-150%] h-80 w-80 rounded-full bg-blue-500/20 blur-[170px] dark:bg-blue-500/15" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/22 via-white/10 to-white/16 dark:from-white/10 dark:via-white/5 dark:to-white/8" />
      </div>

      <div className="relative flex items-center gap-3 sm:gap-6">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/30 bg-white/25 text-white shadow-sm transition hover:border-cyan-200 hover:bg-white/35 hover:text-cyan-100 focus:outline-none focus:ring-2 focus:ring-cyan-200/60 focus:ring-offset-2 focus:ring-offset-white lg:hidden dark:border-white/20 dark:bg-slate-900/60 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-200"
          aria-label="Mostrar u ocultar menú lateral"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex sm:flex-col">
          <span className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.28em] text-white/80 lg:text-cyan-500">
            <Sparkles className="h-3.5 w-3.5" />
            {headerCopy.badge}
          </span>
          <h2 className="text-lg font-semibold text-white lg:text-slate-900 dark:text-white">
            Bienvenido{user?.firstName ? `, ${user.firstName}` : ''}
          </h2>
          <p className="text-xs text-white/70 lg:text-slate-500 dark:text-slate-300">
            {headerCopy.subtitle}
          </p>
        </div>
      </div>

      <div className="relative flex items-center gap-3 sm:gap-4">
        <div className="hidden items-center gap-2 rounded-2xl border border-white/30 bg-white/25 px-3 py-2 text-xs font-medium text-emerald-300 shadow-inner shadow-emerald-100 sm:flex lg:text-emerald-600 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-300">
          <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]" />
          Sistema estable
        </div>
        <button
          type="button"
          className="relative rounded-2xl border border-white/30 bg-white/25 p-3 text-white transition hover:border-cyan-200 hover:bg-white/35 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200/60 focus:ring-offset-2 focus:ring-offset-white lg:text-slate-600 lg:hover:text-cyan-600 dark:border-white/20 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-300"
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
          className="inline-flex rounded-2xl border border-white/30 bg-white/25 p-3 text-white transition hover:border-cyan-200 hover:bg-white/35 hover:text-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-200/60 focus:ring-offset-2 focus:ring-offset-white dark:border-white/20 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-cyan-500/40 dark:hover:bg-slate-900/70 dark:hover:text-cyan-300"
          aria-label={theme === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
          aria-pressed={theme === 'dark'}
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <div className="flex items-center gap-3 rounded-2xl border border-white/35 bg-white/20 px-2 py-2 pl-3 shadow-sm shadow-blue-100 lg:bg-white/25 dark:border-white/20 dark:bg-slate-900/60">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 via-cyan-400 to-indigo-500 text-white shadow-inner transition group-hover:brightness-110">
            <User className="h-5 w-5" />
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-white lg:text-slate-900 dark:text-white">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-white/70 lg:text-slate-500 dark:text-slate-300">{roleLabel}</p>
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
