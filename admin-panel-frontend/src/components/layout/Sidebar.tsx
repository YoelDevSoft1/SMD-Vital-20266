import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Stethoscope,
  Calendar,
  CreditCard,
  Briefcase,
  Star,
  BarChart3,
  Activity,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/users', icon: Users, label: 'Usuarios' },
  { to: '/doctors', icon: Stethoscope, label: 'Doctores' },
  { to: '/appointments', icon: Calendar, label: 'Citas' },
  { to: '/payments', icon: CreditCard, label: 'Pagos' },
  { to: '/services', icon: Briefcase, label: 'Servicios' },
  { to: '/reviews', icon: Star, label: 'Reseñas' },
  { to: '/analytics', icon: BarChart3, label: 'Analíticas' },
  { to: '/system', icon: Activity, label: 'Sistema' },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">SMD Vital</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Panel</p>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
