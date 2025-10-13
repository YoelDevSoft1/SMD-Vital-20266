# 🚀 Guía de Implementación Completa - Admin Panel Frontend

## 📋 Estado Actual

✅ **Archivos Creados:**
1. Configuración del proyecto (package.json, vite.config.ts, tsconfig.json)
2. Configuración de Tailwind CSS
3. Tipos TypeScript completos
4. Estructura base
5. Documentación README

## 📁 Archivos Que Faltan (Para Completar)

### 1. Servicios API

#### `src/services/api.ts` - Cliente Axios Base
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
  timeout: 30000,
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Refresh token logic
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

#### `src/services/admin.service.ts` - Servicio Admin
```typescript
import api from './api';
import type {
  DashboardStats,
  User,
  Doctor,
  Appointment,
  UserFilters,
  PaginatedResponse
} from '@/types';

export const adminService = {
  // Dashboard
  getDashboard: () =>
    api.get<{ data: DashboardStats }>('/admin-panel/dashboard'),

  // Users
  getUsers: (filters: UserFilters) =>
    api.get<{ data: PaginatedResponse<User> }>('/admin-panel/users', { params: filters }),

  getUserDetails: (id: string) =>
    api.get<{ data: User }>(`/admin-panel/users/${id}`),

  updateUserStatus: (id: string, isActive: boolean) =>
    api.patch(`/admin-panel/users/${id}/status`, { isActive }),

  verifyUser: (id: string) =>
    api.patch(`/admin-panel/users/${id}/verify`),

  deleteUser: (id: string) =>
    api.delete(`/admin-panel/users/${id}`),

  // Doctors
  getDoctors: (filters: any) =>
    api.get<{ data: PaginatedResponse<Doctor> }>('/admin-panel/doctors', { params: filters }),

  updateDoctorAvailability: (id: string, isAvailable: boolean) =>
    api.patch(`/admin-panel/doctors/${id}/availability`, { isAvailable }),

  // Appointments
  getAppointments: (filters: any) =>
    api.get<{ data: PaginatedResponse<Appointment> }>('/admin-panel/appointments', { params: filters }),

  updateAppointmentStatus: (id: string, status: string) =>
    api.patch(`/admin-panel/appointments/${id}/status`, { status }),

  // Analytics
  getAnalytics: (params: any) =>
    api.get('/admin-panel/analytics', { params }),

  getRevenueReport: (startDate: string, endDate: string) =>
    api.get('/admin-panel/revenue', { params: { startDate, endDate } }),

  // System
  getSystemHealth: () =>
    api.get('/admin-panel/system/health'),

  getSystemLogs: (filters: any) =>
    api.get('/admin-panel/system/logs', { params: filters }),

  // Export
  exportData: (type: string, format: string, filters: any) =>
    api.post('/admin-panel/export', { type, format, filters }),
};
```

#### `src/services/auth.service.ts` - Servicio de Autenticación
```typescript
import api from './api';
import type { LoginCredentials, AuthResponse } from '@/types';

export const authService = {
  login: (credentials: LoginCredentials) =>
    api.post<{ data: AuthResponse }>('/auth/login', credentials),

  logout: () =>
    api.post('/auth/logout'),

  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),

  getProfile: () =>
    api.get('/auth/me'),
};
```

### 2. Store de Autenticación

#### `src/store/auth.store.ts` - Zustand Store
```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
```

### 3. Componentes de Layout

#### `src/components/layout/DashboardLayout.tsx`
```typescript
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
```

#### `src/components/layout/Sidebar.tsx`
```typescript
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
    <aside className="w-64 bg-white border-r">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">SMD Vital</h1>
        <p className="text-sm text-gray-500">Admin Panel</p>
      </div>
      <nav className="space-y-1 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600'
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
```

#### `src/components/layout/Header.tsx`
```typescript
import { Bell, User, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-6">
      <div className="flex-1" />
      <div className="flex items-center gap-4">
        <button className="p-2 hover:bg-gray-100 rounded-lg">
          <Bell className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-xs text-gray-500">{user?.role}</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <User className="w-5 h-5" />
          </button>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-50 text-red-600 rounded-lg"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
```

### 4. Componentes UI Reutilizables

#### `src/components/ui/Card.tsx`
```typescript
import { cn } from '@/utils/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn('bg-white rounded-lg border shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pb-4', className)} {...props} />;
}

export function CardTitle({ className, ...props }: CardProps) {
  return (
    <h3 className={cn('text-lg font-semibold', className)} {...props} />
  );
}

export function CardContent({ className, ...props }: CardProps) {
  return <div className={cn('p-6 pt-0', className)} {...props} />;
}
```

#### `src/components/ui/Button.tsx`
```typescript
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        {
          'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500': variant === 'primary',
          'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500': variant === 'secondary',
          'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
          'bg-transparent hover:bg-gray-100': variant === 'ghost',
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}
```

#### `src/components/ui/Input.tsx`
```typescript
import { cn } from '@/utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        className={cn(
          'w-full px-3 py-2 border rounded-lg',
          'focus:outline-none focus:ring-2 focus:ring-blue-500',
          'disabled:bg-gray-100 disabled:cursor-not-allowed',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
```

### 5. Páginas Principales

#### `src/App.tsx` - Routing Principal
```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth.store';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import Appointments from './pages/Appointments';
import Payments from './pages/Payments';
import Services from './pages/Services';
import Reviews from './pages/Reviews';
import Analytics from './pages/Analytics';
import SystemHealth from './pages/SystemHealth';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="users" element={<Users />} />
        <Route path="doctors" element={<Doctors />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="payments" element={<Payments />} />
        <Route path="services" element={<Services />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="system" element={<SystemHealth />} />
      </Route>
    </Routes>
  );
}
```

#### `src/pages/Login.tsx`
```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      toast.success('Login exitoso');
      navigate('/');
    },
    onError: () => {
      toast.error('Credenciales inválidas');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="text-3xl font-bold text-center text-gray-900">
            SMD Vital
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Panel de Administración
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Button
            type="submit"
            className="w-full"
            isLoading={loginMutation.isPending}
          >
            Iniciar Sesión
          </Button>
        </form>
      </div>
    </div>
  );
}
```

#### `src/pages/Dashboard.tsx`
```typescript
import { useQuery } from '@tanstack/react-query';
import { adminService } from '@/services/admin.service';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Users, Stethoscope, Calendar, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard(),
  });

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  const stats = data?.data.data;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Usuarios"
          value={stats?.overview.totalUsers || 0}
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Doctores"
          value={stats?.overview.totalDoctors || 0}
          icon={Stethoscope}
          color="green"
        />
        <StatCard
          title="Citas"
          value={stats?.overview.totalAppointments || 0}
          icon={Calendar}
          color="purple"
        />
        <StatCard
          title="Ingresos"
          value={`$${(stats?.overview.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="yellow"
        />
      </div>

      {/* Charts and more... */}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
          </div>
          <div className={`p-3 rounded-lg ${colors[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 6. Utilidades

#### `src/utils/cn.ts` - Utility para clases CSS
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

#### `src/utils/format.ts` - Formateo de datos
```typescript
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDateTime(date: string): string {
  return new Date(date).toLocaleString('es-CO');
}
```

## 🚀 Pasos para Completar la Implementación

### 1. Instalar Dependencias
```bash
cd admin-panel-frontend
npm install
```

### 2. Crear los Archivos Faltantes
Copia el código de arriba para crear:
- Servicios API (api.ts, admin.service.ts, auth.service.ts)
- Store (auth.store.ts)
- Componentes de layout (DashboardLayout, Sidebar, Header)
- Componentes UI (Card, Button, Input, etc.)
- App.tsx con routing
- Páginas (Login, Dashboard, Users, etc.)
- Utilidades (cn.ts, format.ts)

### 3. Crear .env
```bash
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Iniciar Desarrollo
```bash
npm run dev
```

### 5. Abrir en Navegador
```
http://localhost:5173
```

## 📝 Checklist de Implementación

- [x] Estructura del proyecto
- [x] Configuración de build tools
- [x] Tipos TypeScript
- [ ] Servicios API
- [ ] Store de autenticación
- [ ] Componentes de layout
- [ ] Componentes UI
- [ ] Páginas principales
- [ ] Routing
- [ ] Utilidades

## 🎨 Personalizaciones Recomendadas

1. **Logo**: Agregar logo en `public/logo.svg`
2. **Favicon**: Agregar favicon en `public/`
3. **Colores**: Ajustar paleta en `tailwind.config.js`
4. **Fuentes**: Importar Google Fonts si es necesario
5. **Dark Mode**: Agregar toggle de tema

## 📚 Recursos Adicionales

- **React Query**: https://tanstack.com/query/latest
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev/icons
- **Recharts**: https://recharts.org/en-US

---

**¡El proyecto está listo para ser desarrollado! 🎉**

Sigue esta guía paso a paso para completar la implementación del panel de administración frontend.
