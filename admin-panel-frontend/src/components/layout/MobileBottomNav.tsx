import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { obtenerConfiguracionSidebar } from './Sidebar';
import { cn } from '@/utils/cn';

/** Hard-cap a 5 elementos (Material spec). En admin priorizamos estas rutas. */
const PRIORIDAD_ADMIN: string[] = [
  '/',             // Panel
  '/appointments', // Citas
  '/users',        // Pacientes (en este orden: Pacientes primero si están)
  '/payments',     // Pagos
  '/billing',      // Más
];

const PRIORIDAD_DOCTOR: string[] = ['/doctor', '/doctor/appointments'];
const PRIORIDAD_PACIENTE: string[] = ['/patient', '/patient/history'];
const PRIORIDAD_ASESOR: string[] = ['/agent', '/agent/earnings'];

const ROOT_PATHS = new Set(['/', '/doctor', '/patient', '/agent']);

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { elementos = [] } = obtenerConfiguracionSidebar(user?.role);

  // Mapa ruta → elemento del sidebar (para reusar iconos/etiquetas).
  // `elementos` es undefined para roles que solo definen `grupos` (e.g. ADMIN).
  const itemsByRuta = new Map(elementos.map((e) => [e.ruta, e]));

  let order: string[] = PRIORIDAD_DOCTOR;
  if (user?.role === 'PATIENT') order = PRIORIDAD_PACIENTE;
  else if (user?.role === 'AGENT') order = PRIORIDAD_ASESOR;
  else if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || !user) {
    order = PRIORIDAD_ADMIN;
  }

  // Mantener solo rutas que existan en el set de elementos del rol actual;
  // truncar a 5 items según spec Material.
  const items = order
    .map((ruta) => itemsByRuta.get(ruta))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 5);

  if (!items.length) return null;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 lg:hidden',
        'border-t border-border/80 bg-card/95 backdrop-blur-xl',
        'px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2',
        'shadow-[0_-18px_50px_-32px_rgba(15,23,42,0.18)]',
      )}
      aria-label="Navegación móvil"
    >
      <div
        className="mx-auto grid w-full max-w-[min(28rem,calc(100vw-1rem))] gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ ruta, icon: Icono, etiqueta, badge }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={ROOT_PATHS.has(ruta)}
            className={({ isActive }) =>
              cn(
                'relative flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 text-[11px] font-medium',
                // Tap feedback — escala sutil al presionar
                'motion-safe:transition-all motion-safe:duration-150 active:scale-[0.96]',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <Icono
                    aria-hidden="true"
                    className={cn(
                      'h-5 w-5 shrink-0 transition-transform',
                      isActive && 'scale-110',
                    )}
                  />
                  {badge && badge > 0 ? (
                    <span
                      aria-hidden="true"
                      className="absolute -right-2 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white ring-2 ring-card"
                    >
                      {badge > 9 ? '9+' : badge}
                    </span>
                  ) : null}
                </span>
                <span className="max-w-full truncate leading-none">{etiqueta}</span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 h-1 w-6 rounded-full bg-brand-500"
                  />
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
