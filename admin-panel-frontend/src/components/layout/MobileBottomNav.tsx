import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { obtenerConfiguracionSidebar } from './Sidebar';
import { cn } from '@/utils/cn';

/** Paths considered "priority" for the mobile bottom nav (max 5 items). */
const priorityPaths = new Set([
  '/',
  '/appointments',
  '/doctors',
  '/users',
  '/billing',
  '/services',
  '/doctor',
  '/doctor/appointments',
  '/doctor/earnings',
  '/patient',
  '/patient/history',
  '/agent',
  '/agent/earnings',
]);

const rootPaths = new Set(['/', '/doctor', '/patient', '/agent']);

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { elementos } = obtenerConfiguracionSidebar(user?.role);
  const items = elementos.filter((item) => priorityPaths.has(item.ruta)).slice(0, 5);

  if (!items.length) return null;

  return (
    <nav
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 lg:hidden',
        'border-t border-border bg-card/95 backdrop-blur-xl',
        'px-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-2',
        'shadow-[0_-18px_50px_-32px_rgba(15,23,42,0.18)]',
      )}
      aria-label="Navegación móvil"
    >
      <div
        className="mx-auto grid w-full max-w-[min(28rem,calc(100vw-1rem))] gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ ruta, icon: Icono, etiqueta }) => (
          <NavLink
            key={ruta}
            to={ruta}
            end={rootPaths.has(ruta)}
            className={({ isActive }) =>
              cn(
                'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium',
                'motion-safe:transition-colors motion-safe:duration-150',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                isActive
                  ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-300'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icono
                  aria-hidden="true"
                  className={cn(
                    'h-5 w-5 shrink-0 transition-transform',
                    isActive && 'scale-110',
                  )}
                />
                <span className="max-w-full truncate leading-none">{etiqueta}</span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="absolute -top-0.5 h-0.5 w-6 rounded-full bg-brand-500"
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
