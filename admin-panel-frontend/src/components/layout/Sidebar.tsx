import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileJson,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { obtenerMetaRol } from '@/utils/roles';
import type { UserRole } from '@/types';

type ElementoNavegacion = {
  ruta: string;
  icon: typeof LayoutDashboard;
  etiqueta: string;
  description: string;
  badge?: number;
};

/** Grupos temáticos del sidebar admin — mejora escaneo visual. */
type GrupoSeccion = {
  titulo: string;
  elementos: ElementoNavegacion[];
};

const navegacionAdmin: GrupoSeccion[] = [
  {
    titulo: 'Operación',
    elementos: [
      { ruta: '/',             icon: LayoutDashboard, etiqueta: 'Inicio',       description: 'Resumen general y métricas clave' },
      { ruta: '/appointments', icon: Calendar,        etiqueta: 'Citas',        description: 'Agenda y coordinación operativa' },
      { ruta: '/users',        icon: Users,           etiqueta: 'Usuarios',     description: 'Gestión de pacientes y administradores' },
    ],
  },
  {
    titulo: 'Clínica',
    elementos: [
      { ruta: '/doctors',  icon: Stethoscope,  etiqueta: 'Doctores', description: 'Control de profesionales activos' },
      { ruta: '/services', icon: Briefcase,    etiqueta: 'Servicios', description: 'Portafolio de ofertas clínicas' },
      { ruta: '/reviews',  icon: Star,         etiqueta: 'Reseñas',  description: 'Opiniones y satisfacción del paciente' },
    ],
  },
  {
    titulo: 'Finanzas',
    elementos: [
      { ruta: '/payments',  icon: CreditCard, etiqueta: 'Pagos',       description: 'Transacciones y conciliaciones' },
      { ruta: '/billing',   icon: DollarSign, etiqueta: 'Liquidación', description: 'Cierre financiero con profesionales' },
      { ruta: '/analytics', icon: BarChart3,  etiqueta: 'Analíticas',  description: 'Indicadores y tendencias' },
    ],
  },
  {
    titulo: 'Configuración',
    elementos: [
      { ruta: '/audit',   icon: ShieldCheck, etiqueta: 'Auditoría', description: 'Bitácora de acciones sensibles' },
      { ruta: '/rips',    icon: FileJson,    etiqueta: 'RIPS',      description: 'Borradores y export interno' },
      { ruta: '/system',  icon: Activity,    etiqueta: 'Sistema',   description: 'Salud de la plataforma', badge: 2 },
    ],
  },
];

const navegacionDoctor: ElementoNavegacion[] = [
  { ruta: '/doctor',                  icon: LayoutDashboard, etiqueta: 'Panel clínico',   description: 'Resumen de tu jornada' },
  { ruta: '/doctor/appointments',     icon: Calendar,        etiqueta: 'Mis citas',       description: 'Agenda y atenciones activas' },
  { ruta: '/doctor/earnings',         icon: DollarSign,      etiqueta: 'Mis ingresos',    description: 'Pagos y comisiones' },
];

const navegacionPaciente: ElementoNavegacion[] = [
  { ruta: '/patient',          icon: LayoutDashboard, etiqueta: 'Mi resumen',   description: 'Citas y recordatorios' },
  { ruta: '/patient/history',  icon: FileText,        etiqueta: 'Mi historial', description: 'Documentos y recetas' },
];

const navegacionAsesor: ElementoNavegacion[] = [
  { ruta: '/agent',           icon: LayoutDashboard, etiqueta: 'Mi actividad', description: 'Resumen de tus comisiones' },
  { ruta: '/agent/earnings',  icon: DollarSign,      etiqueta: 'Comisiones',   description: 'Detalle de pagos pendientes' },
];

type ConfiguracionSidebar = {
  title: string;
  subtitle: string;
  /** Cuando devuelve grupos (admin), se renderizan con encabezado; cuando es flat, sin él. */
  grupos?: GrupoSeccion[];
  elementos?: ElementoNavegacion[];
};

export function obtenerConfiguracionSidebar(rol?: UserRole | null): ConfiguracionSidebar {
  if (rol === 'DOCTOR' || rol === 'NURSE') {
    return {
      title: 'Panel Clínico',
      subtitle: 'Gestiona tus atenciones y registros clínicos',
      elementos: navegacionDoctor,
    };
  }
  if (rol === 'PATIENT') {
    return {
      title: 'Portal del Paciente',
      subtitle: 'Consulta tus citas y documentos clínicos',
      elementos: navegacionPaciente,
    };
  }
  if (rol === 'AGENT') {
    return {
      title: 'Panel de Asesoría',
      subtitle: 'Gestiona tus comisiones y servicios',
      elementos: navegacionAsesor,
    };
  }
  return {
    title: 'Panel Médico',
    subtitle: 'Controla la operación clínica en tiempo real',
    grupos: navegacionAdmin,
  };
}

type PropiedadesSidebar = {
  open: boolean;
  isDesktop: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
};

const RUTAS_RAIZ = new Set(['/', '/doctor', '/patient', '/agent']);
const LLAVE_COLAPSO = 'smd-vital:sidebar-colapsado';

export default function Sidebar({ open, isDesktop, onClose, collapsed, onToggleCollapsed }: PropiedadesSidebar) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { title, subtitle, grupos, elementos } = obtenerConfiguracionSidebar(user?.role);
  const metaRol = obtenerMetaRol(user?.role);
  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Usuario';
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}` || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ancho dinámico: colapsado → 5rem, expandido → 18rem (72)
  const anchoExpandido = 'w-72';
  const anchoColapsado = 'w-20';

  const renderItem = (item: ElementoNavegacion) => {
    const Icono = item.icon;
    return (
      <li key={item.ruta}>
        <NavLink
          to={item.ruta}
          end={RUTAS_RAIZ.has(item.ruta)}
          onClick={() => {
            if (!isDesktop) onClose();
          }}
          title={collapsed ? item.etiqueta : undefined}
          aria-label={item.etiqueta}
          className={({ isActive: estaActivo }) =>
            cn(
              'group relative flex items-start gap-3 rounded-lg px-3 py-2.5',
              collapsed && 'justify-center px-2',
              'motion-safe:transition-colors motion-safe:duration-150',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              !estaActivo && 'text-muted-foreground hover:bg-muted hover:text-foreground',
              estaActivo &&
                'bg-brand-50 text-brand-700 ring-1 ring-brand-200/60 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-500/30',
            )
          }
        >
          {({ isActive: estaActivo }) => (
            <>
              {/* Indicador lateral (solo activo) — barra vertical brand */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand-500',
                  'motion-safe:transition-opacity motion-safe:duration-150',
                  collapsed && 'h-6',
                  estaActivo ? 'opacity-100' : 'opacity-0',
                )}
              />
              <span className="relative mt-0.5 flex flex-shrink-0 items-center">
                <Icono
                  aria-hidden="true"
                  className={cn(
                    'h-4 w-4',
                    estaActivo ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground group-hover:text-foreground',
                  )}
                />
                {item.badge && item.badge > 0 ? (
                  <span
                    aria-hidden="true"
                    className="absolute -right-2 -top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white ring-2 ring-card"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                ) : null}
              </span>
              <div className={cn('min-w-0 flex-1', collapsed && 'hidden')}>
                <div className="flex items-center justify-between gap-2">
                  <p
                    className={cn(
                      'truncate text-sm font-medium',
                      estaActivo ? 'text-brand-700 dark:text-brand-200' : 'text-foreground',
                    )}
                  >
                    {item.etiqueta}
                  </p>
                  {item.badge && item.badge > 0 && !estaActivo ? (
                    <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger-muted px-1.5 text-[10px] font-bold text-danger">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <p
                  className={cn(
                    'truncate text-xs',
                    estaActivo
                      ? 'text-brand-600/80 dark:text-brand-300/80'
                      : 'text-muted-foreground',
                  )}
                >
                  {item.description}
                </p>
              </div>
            </>
          )}
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Overlay móvil — solo cuando está open en pantallas pequeñas */}
      {!isDesktop && open ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar menú lateral"
          className={cn(
            'fixed inset-0 z-30 bg-foreground/50 backdrop-blur-sm',
            'motion-safe:animate-fade-in lg:hidden',
          )}
        />
      ) : null}

      <aside
        className={cn(
          // Base — limpio, blanco/card, sin glassmorphism
          'flex flex-col border-r border-border bg-card',
          // Layout responsive con colapso desktop
          'fixed inset-y-0 left-0 z-40',
          isDesktop
            ? cn(
                'sticky top-0 h-dvh flex-shrink-0',
                collapsed ? anchoColapsado : anchoExpandido,
                'motion-safe:transition-[width] motion-safe:duration-200 motion-safe:ease-out',
              )
            : cn(
                anchoExpandido,
                'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
                open ? 'translate-x-0' : '-translate-x-full',
              ),
        )}
        aria-label="Navegación principal"
        data-collapsed={collapsed || undefined}
      >
        {/* Encabezado — branding + título del panel */}
        <div
          className={cn(
            'flex items-start justify-between gap-3 border-b border-border px-5 py-5',
            collapsed && 'px-3',
          )}
        >
          <div className={cn('min-w-0 flex-1', collapsed && 'flex justify-center')}>
            <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
              {/* Logo mark */}
              <div
                aria-hidden="true"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-info text-white shadow-soft-sm"
              >
                <span className="text-sm font-bold">SV</span>
              </div>
              {!collapsed ? (
                <span className="text-sm font-semibold text-foreground">SMD Vital</span>
              ) : null}
            </div>
            {!collapsed ? (
              <>
                <h1 className="mt-3 text-lg font-semibold leading-tight text-foreground">
                  {title}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
              </>
            ) : null}
          </div>
          {!isDesktop ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              className={cn(
                'inline-flex h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-md',
                'text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              )}
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {/* Navegación */}
        <nav
          className={cn(
            'flex-1 overflow-y-auto px-3 py-4',
            collapsed && 'px-2 py-3',
          )}
          aria-label="Secciones"
        >
          {grupos
            ? // Admin: render agrupado con encabezado por sección
              grupos.map((grupo) => (
                <div key={grupo.titulo} className="mb-4 last:mb-0">
                  {!collapsed ? (
                    <h2
                      className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
                    >
                      {grupo.titulo}
                    </h2>
                  ) : (
                    <div className="my-2 h-px bg-border" aria-hidden="true" />
                  )}
                  <ul className="space-y-1">{(grupo.elementos ?? []).map(renderItem)}</ul>
                </div>
              ))
            : // Otros roles: lista plana
              <ul className="space-y-1">{elementos?.map(renderItem)}</ul>
          }
        </nav>

        {/* Footer — soporte + colapso (escritorio) */}
        <div className="border-t border-border px-3 py-3">
          {!collapsed ? (
            <a
              href="mailto:soporte@smdvital.com"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5',
                'text-muted-foreground transition-colors',
                'hover:bg-muted hover:text-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              )}
            >
              <LifeBuoy className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                  Soporte
                </p>
                <p className="truncate text-xs text-muted-foreground">soporte@smdvital.com</p>
              </div>
            </a>
          ) : (
            <a
              href="mailto:soporte@smdvital.com"
              aria-label="Soporte"
              title="Soporte"
              className="flex items-center justify-center rounded-lg p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <LifeBuoy className="h-4 w-4" aria-hidden="true" />
            </a>
          )}

          {/* Usuario actual + logout */}
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-border bg-card p-2">
            <div
              aria-hidden="true"
              className="flex h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-brand-500 to-info text-sm font-bold text-white"
            >
              {initials}
            </div>
            {!collapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-foreground">{fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{metaRol.etiquetaCorta}</p>
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className={cn(
                'inline-flex h-11 w-11 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-md',
                'text-muted-foreground transition-colors',
                'hover:bg-danger/10 hover:text-danger',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-danger focus-visible:ring-offset-2 focus-visible:ring-offset-card',
              )}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Toggle colapsado (solo escritorio) */}
          {isDesktop ? (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label={collapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
              aria-pressed={collapsed}
              className={cn(
                'mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2',
                'text-xs font-medium text-muted-foreground',
                'hover:bg-muted hover:text-foreground',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                collapsed && 'justify-center px-2',
              )}
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              ) : (
                <>
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Colapsar menú</span>
                  <Settings className="ml-auto h-3.5 w-3.5 opacity-50" aria-hidden="true" />
                </>
              )}
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
