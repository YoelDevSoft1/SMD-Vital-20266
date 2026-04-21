import { NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import { getSidebarConfig } from './Sidebar';

const priorityPaths = new Set([
  '/',
  '/appointments',
  '/doctors',
  '/users',
  '/services',
  '/doctor',
  '/doctor/appointments',
  '/patient',
  '/patient/history',
]);

const rootPaths = new Set(['/', '/doctor', '/patient']);

export default function MobileBottomNav() {
  const { user } = useAuthStore();
  const { navItems } = getSidebarConfig(user?.role);
  const items = navItems.filter((item) => priorityPaths.has(item.to)).slice(0, 5);

  if (!items.length) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/80 bg-white/95 px-2 pb-[calc(env(safe-area-inset-bottom)+0.45rem)] pt-2 shadow-[0_-18px_50px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl [transform:translateZ(0)] lg:hidden dark:border-slate-700/80 dark:bg-slate-950/95"
      aria-label="Navegacion movil"
    >
      <div
        className="mx-auto grid w-full max-w-[min(28rem,calc(100vw-1rem))] gap-1"
        style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
      >
        {items.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={rootPaths.has(to)}
            className={({ isActive }) =>
              [
                'flex min-h-[56px] flex-col items-center justify-center gap-1 rounded-lg px-1 text-[11px] font-medium transition',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-cyan-500/15 dark:text-cyan-200'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
              ].join(' ')
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="max-w-full truncate leading-none">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
