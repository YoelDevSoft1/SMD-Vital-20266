import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  CreditCard,
  LayoutDashboard,
  LifeBuoy,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Resumen general y métricas clave' },
  { to: '/users', icon: Users, label: 'Usuarios', description: 'Gestión de pacientes y administradores' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctores', description: 'Control de profesionales activos' },
  { to: '/appointments', icon: Calendar, label: 'Citas', description: 'Agenda y coordinación operativa' },
  { to: '/payments', icon: CreditCard, label: 'Pagos', description: 'Transacciones y conciliaciones' },
  { to: '/services', icon: Briefcase, label: 'Servicios', description: 'Portafolio de ofertas clínicas' },
  { to: '/reviews', icon: Star, label: 'Reseñas', description: 'Opiniones y satisfacción del paciente' },
  { to: '/analytics', icon: BarChart3, label: 'Analíticas', description: 'Indicadores y tendencias' },
  { to: '/system', icon: Activity, label: 'Sistema', description: 'Salud de la plataforma' },
];

type SidebarProps = {
  isOpen: boolean;
  isDesktop: boolean;
  onClose: () => void;
};

export default function Sidebar({ isOpen, isDesktop, onClose }: SidebarProps) {
  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 w-72 transform overflow-hidden rounded-r-3xl bg-white/10 px-4 py-6 shadow-[0_40px_120px_-60px_rgba(56,189,248,0.45)] backdrop-blur-2xl transition-transform duration-300 ease-out dark:bg-slate-900/70 dark:shadow-[0_45px_140px_-65px_rgba(8,47,73,0.55)] lg:static lg:inset-auto lg:h-screen lg:w-80 lg:translate-x-0 lg:rounded-3xl lg:bg-white/12 lg:px-8 lg:py-10 lg:shadow-[0_50px_160px_-80px_rgba(59,130,246,0.35)] dark:lg:bg-slate-900/75 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
      aria-label="Navegación principal"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="glass-blob absolute -left-16 top-[-22%] h-72 w-72 rounded-full bg-cyan-400/25 blur-[130px] dark:bg-cyan-500/15" />
        <div className="glass-blob glass-blob--reverse absolute right-[-30%] bottom-[-18%] h-80 w-80 rounded-full bg-blue-500/25 blur-[150px] dark:bg-blue-500/15" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-white/10 dark:from-white/10 dark:via-white/5 dark:to-white/8" />
      </div>

      <div className="relative flex h-full flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-100 lg:text-blue-500 dark:text-cyan-200">
              SMD Vital
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-white lg:text-slate-900 dark:text-white">Panel Médico</h1>
            <p className="mt-1 text-sm text-white/70 lg:text-slate-600 dark:text-slate-300">
              Controla la operación clínica en tiempo real
            </p>
          </div>
          {!isDesktop && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/15 bg-white/15 p-2 text-white/70 transition hover:border-white/25 hover:bg-white/25 hover:text-white lg:hidden dark:border-white/10 dark:bg-slate-900/50 dark:hover:border-white/20 dark:hover:bg-slate-900/70"
              aria-label="Cerrar menú lateral"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="space-y-2">
          {navItems.map(({ to, icon: Icon, label, description }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => {
                if (!isDesktop) {
                  onClose();
                }
              }}
              className={({ isActive }) =>
                [
                  'group relative block overflow-hidden rounded-2xl px-4 py-3 transition-all backdrop-blur-sm',
                  isActive
                    ? 'bg-white/20 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-200/30 lg:bg-blue-50/90 lg:text-blue-700 dark:bg-cyan-500/15 dark:text-cyan-50 dark:ring-cyan-400/30 dark:shadow-cyan-500/20'
                    : 'bg-white/8 text-white/70 hover:bg-white/12 hover:text-white lg:bg-white/70 lg:text-slate-500 lg:hover:bg-blue-50/90 lg:hover:text-blue-700 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white',
                ].join(' ')
              }
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-cyan-200 transition group-hover:bg-cyan-500/15 group-hover:text-cyan-100 lg:bg-blue-100/70 lg:text-blue-600 lg:group-hover:bg-blue-500/20 dark:bg-white/10 dark:text-cyan-200 dark:group-hover:bg-cyan-500/20 dark:group-hover:text-cyan-100">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold tracking-tight text-white lg:text-slate-700 dark:text-white">
                    {label}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/55 transition group-hover:text-white/85 lg:text-slate-400 lg:group-hover:text-slate-600 dark:text-slate-300 dark:group-hover:text-slate-100">
                    {description}
                  </p>
                </div>
                <span className="absolute right-4 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-gradient-to-br from-cyan-300 to-blue-500 opacity-0 transition group-hover:opacity-100 lg:bg-blue-500/80 dark:from-cyan-400 dark:to-blue-400" />
              </div>
            </NavLink>
          ))}
        </nav>

        <div className="relative mt-auto overflow-hidden rounded-2xl border border-white/15 bg-white/12 p-5 text-xs text-white/80 backdrop-blur-xl shadow-[0_25px_80px_-50px_rgba(56,189,248,0.4)] lg:border-white/20 lg:bg-white/65 lg:text-slate-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
          <div className="pointer-events-none absolute inset-0">
            <div className="glass-blob absolute -left-12 top-[-40%] h-40 w-40 rounded-full bg-cyan-300/20 blur-[120px] dark:bg-cyan-500/15" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-white/10 dark:from-white/10 dark:via-transparent dark:to-white/12" />
          </div>
          <div className="relative space-y-2">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200 lg:text-blue-600 dark:text-cyan-300">
              <LifeBuoy className="h-4 w-4" />
              Soporte prioritario
            </p>
            <p className="text-[13px] leading-relaxed text-white/80 dark:text-slate-200">
              ¿Necesitas ayuda inmediata? Nuestro equipo médico está disponible 24/7 en{' '}
              <span className="font-semibold text-white lg:text-blue-700 dark:text-cyan-200">soporte@smdvital.com</span>
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
