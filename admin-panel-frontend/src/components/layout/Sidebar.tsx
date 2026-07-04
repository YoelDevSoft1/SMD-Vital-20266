import { NavLink } from 'react-router-dom';
import {
  Activity,
  BarChart3,
  Briefcase,
  Calendar,
  CreditCard,
  DollarSign,
  FileJson,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  ShieldCheck,
  Star,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

type ElementoNavegacion = {
  ruta: string;
  icon: typeof LayoutDashboard;
  etiqueta: string;
  description: string;
};

const navegacionAdmin: ElementoNavegacion[] = [
  { ruta: '/',               icon: LayoutDashboard, etiqueta: 'Inicio',       description: 'Resumen general y métricas clave' },
  { ruta: '/users',          icon: Users,           etiqueta: 'Usuarios',     description: 'Gestión de pacientes y administradores' },
  { ruta: '/doctors',        icon: Stethoscope,     etiqueta: 'Doctores',     description: 'Control de profesionales activos' },
  { ruta: '/appointments',   icon: Calendar,        etiqueta: 'Citas',        description: 'Agenda y coordinación operativa' },
  { ruta: '/payments',       icon: CreditCard,      etiqueta: 'Pagos',        description: 'Transacciones y conciliaciones' },
  { ruta: '/billing',        icon: DollarSign,      etiqueta: 'Liquidación',  description: 'Cierre financiero con profesionales' },
  { ruta: '/services',       icon: Briefcase,       etiqueta: 'Servicios',    description: 'Portafolio de ofertas clínicas' },
  { ruta: '/reviews',        icon: Star,            etiqueta: 'Reseñas',      description: 'Opiniones y satisfacción del paciente' },
  { ruta: '/analytics',      icon: BarChart3,       etiqueta: 'Analíticas',   description: 'Indicadores y tendencias' },
  { ruta: '/audit',          icon: ShieldCheck,     etiqueta: 'Auditoría',    description: 'Bitácora de actions sensibles' },
  { ruta: '/rips',           icon: FileJson,        etiqueta: 'RIPS',         description: 'Borradores y export interno' },
  { ruta: '/system',         icon: Activity,        etiqueta: 'Sistema',      description: 'Salud de la plataforma' },
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
  elementos: ElementoNavegacion[];
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
    elementos: navegacionAdmin,
  };
}

type PropiedadesSidebar = {
  open: boolean;
  isDesktop: boolean;
  onClose: () => void;
};

const RUTAS_RAIZ = new Set(['/', '/doctor', '/patient', '/agent']);

export default function Sidebar({ open, isDesktop, onClose }: PropiedadesSidebar) {
  const { user } = useAuthStore();
  const { title, subtitle, elementos } = obtenerConfiguracionSidebar(user?.role);

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
          // Layout responsive
          'fixed inset-y-0 left-0 z-40 w-72',
          'lg:static lg:inset-auto lg:h-dvh lg:w-72 lg:flex-shrink-0',
          // Animación de entrada/salida móvil
          'motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out',
          open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
        aria-label="Navegación principal"
      >
        {/* Encabezado — branding + título del panel */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-5 lg:px-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* Logo mark */}
              <div
                aria-hidden="true"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-info text-white shadow-soft-sm"
              >
                <span className="text-sm font-bold">SV</span>
              </div>
              <span className="text-sm font-semibold text-foreground">SMD Vital</span>
            </div>
            <h1 className="mt-3 text-lg font-semibold leading-tight text-foreground">
              {title}
            </h1>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {!isDesktop ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú lateral"
              className={cn(
                'inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md',
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
        <nav className="flex-1 overflow-y-auto px-3 py-4 lg:px-4" aria-label="Secciones">
          <ul className="space-y-1">
            {elementos.map(({ ruta, icon: Icono, etiqueta, description }) => (
              <li key={ruta}>
                <NavLink
                  to={ruta}
                  end={RUTAS_RAIZ.has(ruta)}
                  onClick={() => {
                    if (!isDesktop) onClose();
                  }}
                  className={({ isActive: estaActivo }) =>
                    cn(
                      // Base
                      'group relative flex items-start gap-3 rounded-lg px-3 py-2.5',
                      'motion-safe:transition-colors motion-safe:duration-150',
                      'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card',
                      // Inactivo — texto neutral
                      !estaActivo && 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      // Activo — fondo brand sutil + texto brand + indicador lateral
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
                          estaActivo ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      <Icono
                        aria-hidden="true"
                        className={cn(
                          'mt-0.5 h-4 w-4 flex-shrink-0',
                          estaActivo ? 'text-brand-600 dark:text-brand-300' : 'text-muted-foreground group-hover:text-foreground',
                        )}
                      />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'truncate text-sm font-medium',
                            estaActivo ? 'text-brand-700 dark:text-brand-200' : 'text-foreground',
                          )}
                        >
                          {etiqueta}
                        </p>
                        <p
                          className={cn(
                            'truncate text-xs',
                            estaActivo
                              ? 'text-brand-600/80 dark:text-brand-300/80'
                              : 'text-muted-foreground',
                          )}
                        >
                          {description}
                        </p>
                      </div>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Pie — soporte */}
        <div className="border-t border-border px-3 py-3 lg:px-4">
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
                Soporte prioritario
              </p>
              <p className="truncate text-xs text-muted-foreground">soporte@smdvital.com</p>
            </div>
          </a>
        </div>
      </aside>
    </>
  );
}
