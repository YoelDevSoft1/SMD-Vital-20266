import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Stethoscope,
  CalendarCheck2,
  DollarSign,
  Activity,
  ShieldCheck,
  Star,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { DashboardStats } from '@/types';
import { DashboardStatCard } from '@/components/dashboard/DashboardStatCard';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/utils/cn';

const statusStyles: Record<string, string> = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800',
  CANCELLED: 'bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-900/20 dark:text-rose-300 dark:border-rose-800',
  NO_SHOW: 'bg-slate-50 text-slate-600 border border-slate-100 dark:bg-slate-800/20 dark:text-slate-400 dark:border-slate-700',
  RESCHEDULED: 'bg-purple-50 text-purple-700 border border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => adminService.getDashboard(),
    staleTime: 60_000,
  });

  const stats = data?.data?.data as DashboardStats | undefined;

  // Debug logging
  console.log('=== DASHBOARD DEBUG ===');
  console.log('Raw data:', data);
  console.log('Stats:', stats);
  console.log('Total Users:', stats?.overview?.totalUsers);
  console.log('Total Doctors:', stats?.overview?.totalDoctors);
  console.log('Total Appointments:', stats?.overview?.totalAppointments);
  console.log('Total Revenue:', stats?.overview?.totalRevenue);
  console.log('========================');

  // Temporary debug display
  if (stats) {
    console.log('STATS OVERVIEW:', stats.overview);
    console.log('STATS APPOINTMENTS:', stats.appointments);
  }

  const statCards = useMemo(() => {
    if (!stats) {
      return [
        {
          title: 'Usuarios totales',
          value: '0',
          icon: Users,
          accent: 'blue' as const,
        },
        {
          title: 'Doctores verificados',
          value: '0',
          icon: Stethoscope,
          accent: 'purple' as const,
        },
        {
          title: 'Citas registradas',
          value: '0',
          icon: CalendarCheck2,
          accent: 'indigo' as const,
        },
        {
          title: 'Ingresos totales',
          value: formatCurrency(0),
          icon: DollarSign,
          accent: 'emerald' as const,
        },
      ];
    }

    return [
      {
        title: 'Usuarios totales',
        value: formatNumber(stats.overview?.totalUsers || 0),
        icon: Users,
        accent: 'blue' as const,
        change: stats.growth?.users || 0,
        changeLabel: 'vs mes anterior',
        helperText: `${formatNumber(stats.overview?.activeUsers || 0)} activos`,
      },
      {
        title: 'Doctores verificados',
        value: formatNumber(stats.overview?.totalDoctors || 0),
        icon: Stethoscope,
        accent: 'purple' as const,
        helperText: `${formatNumber(stats.overview?.verifiedDoctors || 0)} disponibles`,
      },
      {
        title: 'Citas registradas',
        value: formatNumber(stats.overview?.totalAppointments || 0),
        icon: CalendarCheck2,
        accent: 'indigo' as const,
        change: stats.growth?.appointments || 0,
        changeLabel: 'vs mes anterior',
        helperText: `${formatNumber(stats.appointments?.completed || 0)} completadas`,
      },
      {
        title: 'Ingresos totales',
        value: formatCurrency(stats.overview?.totalRevenue || 0),
        icon: DollarSign,
        accent: 'emerald' as const,
        helperText: `Mes actual: ${formatCurrency(stats.overview?.monthlyRevenue || 0)}`,
      },
    ];
  }, [stats]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Card className="border border-red-200 bg-red-50/60 dark:border-red-800 dark:bg-red-900/20">
        <CardContent className="flex flex-col gap-4 p-6 text-sm">
          <div>
            <h2 className="text-lg font-semibold text-red-700 dark:text-red-300">No se pudo cargar el dashboard</h2>
            <p className="text-red-600 dark:text-red-400">
              Verifica tu conexión o vuelve a intentarlo en unos segundos.
            </p>
          </div>
          <div>
            <Button variant="outline" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card className="border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20">
        <CardContent className="p-6 text-sm text-amber-700 dark:text-amber-300">
          No hay datos de dashboard disponibles por ahora.
        </CardContent>
      </Card>
    );
  }

  const appointmentTotals = stats?.appointments?.total || 0;
  const appointmentStatusBreakdown = [
    {
      key: 'pending',
      label: 'Pendientes',
      value: stats?.appointments?.pending ?? 0,
      bar: 'bg-amber-400',
    },
    {
      key: 'completed',
      label: 'Completadas',
      value: stats?.appointments?.completed ?? 0,
      bar: 'bg-emerald-500',
    },
    {
      key: 'cancelled',
      label: 'Canceladas',
      value: stats?.appointments?.cancelled ?? 0,
      bar: 'bg-rose-500',
    },
  ];

  const recentAppointments = stats?.recentActivity?.appointments?.slice(0, 5) || [];
  const recentUsers = stats?.recentActivity?.users?.slice(0, 5) || [];
  const topDoctors = stats?.topPerformers?.doctors?.slice(0, 5) || [];
  const topServices = stats?.topPerformers?.services?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Temporary debug display */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded dark:bg-yellow-900/20 dark:border-yellow-800">
        <h3 className="font-bold text-yellow-800 dark:text-yellow-300">DEBUG INFO:</h3>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Has data:</strong> {data ? 'YES' : 'NO'}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Has stats:</strong> {stats ? 'YES' : 'NO'}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Stats type:</strong> {typeof stats}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Stats keys:</strong> {stats ? Object.keys(stats).join(', ') : 'N/A'}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Has overview:</strong> {stats?.overview ? 'YES' : 'NO'}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Overview keys:</strong> {stats?.overview ? Object.keys(stats.overview).join(', ') : 'N/A'}</p>
        <p className="text-yellow-700 dark:text-yellow-400"><strong>Raw data structure:</strong> {JSON.stringify(data, null, 2).substring(0, 200)}...</p>
      </div>
      
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Panel general</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Visión rápida de la operación y los indicadores clave de SMD Vital.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" size="md" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate('/analytics')}>
            Explorar analíticas
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => (
          <DashboardStatCard key={card.title} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card variant="elevated" className="xl:col-span-2">
          <CardHeader className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
                Estado de las citas
              </CardTitle>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Distribución de todas las citas registradas ({formatNumber(appointmentTotals)}).
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300">
              Tasa de éxito {stats?.appointments?.completionRate?.toFixed(1) ?? 0}%
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {appointmentStatusBreakdown.map((item) => {
              const percentage =
                appointmentTotals > 0 ? (item.value / appointmentTotals) * 100 : 0;
              return (
                <div key={item.key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{item.label}</span>
                    <span className="text-slate-600 dark:text-slate-400">
                      {formatNumber(item.value)}{' '}
                      <span className="text-xs text-slate-500 dark:text-slate-500">
                        ({percentage.toFixed(1)}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/50 dark:bg-slate-700/50">
                    <div
                      className={cn('h-2.5 rounded-full transition-all duration-500 shadow-sm', item.bar)}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="flex items-center gap-3 rounded-xl bg-indigo-50/80 p-4 text-sm font-medium text-indigo-700 border border-indigo-100/50 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800/50">
              <ShieldCheck className="h-5 w-5 flex-shrink-0" />
              <span>
                {formatNumber(stats?.appointments?.completed || 0)} citas exitosas sobre{' '}
                {formatNumber(appointmentTotals)} totales generan la tasa de éxito mostrada.
              </span>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Resumen financiero
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ingresos acumulados y facturación del mes en curso.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Ingresos totales</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(stats?.overview?.totalRevenue || 0)}
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
                <span>Mes actual</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(stats?.overview?.monthlyRevenue || 0)}
                </span>
              </div>
              <RevenueProgress
                total={stats?.overview?.totalRevenue || 0}
                monthly={stats?.overview?.monthlyRevenue || 0}
              />
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50/80 p-4 text-sm font-medium text-emerald-700 border border-emerald-100/50 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
              <Star className="h-5 w-5 flex-shrink-0" />
              <span>
                Calificación promedio del servicio:{' '}
                <strong>{stats?.overview?.averageRating?.toFixed(1) ?? '0.0'} / 5</strong>
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Citas recientes
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Últimas interacciones registradas junto al estado actual.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentAppointments.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No se registran citas recientes.</p>
            )}
            {recentAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {appointment.patient?.user.firstName}{' '}
                      {appointment.patient?.user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Con {appointment.doctor?.user.firstName}{' '}
                      {appointment.doctor?.user.lastName}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium',
                      statusStyles[appointment.status] ?? statusStyles.PENDING
                    )}
                  >
                    {appointment.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <Activity className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>{appointment.service?.name ?? 'Servicio sin especificar'}</span>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span>{formatDateTime(appointment.createdAt)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Nuevos usuarios
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Cuentas creadas recientemente con su estado actual.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentUsers.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Aún no hay usuarios nuevos.</p>
            )}
            {recentUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs">
                  <span className="rounded-full bg-slate-100 px-2 py-1 font-medium text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                    {user.role}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">{formatDateTime(user.createdAt)}</span>
                  <div className="flex gap-2 text-[10px]">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-medium',
                        user.isActive
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                      )}
                    >
                      {user.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-medium',
                        user.isVerified
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300'
                      )}
                    >
                      {user.isVerified ? 'Verificado' : 'Pendiente'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Doctores destacados
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Profesionales mejor valorados y con mayor volumen de citas.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topDoctors.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No se encontraron médicos destacados.</p>
            )}
            {topDoctors.map((doctor) => (
              <div
                key={doctor.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {doctor.user.firstName} {doctor.user.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{doctor.specialty}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
                    <Star className="h-3 w-3" />
                    {doctor.rating?.toFixed(1) ?? 'N/A'}
                  </span>
                  <span>
                    {doctor._count?.appointments ?? 0} citas •{' '}
                    {doctor.isAvailable ? 'Disponible' : 'Ocupado'}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-white">
              Servicios más demandados
            </CardTitle>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Procedimientos o especialidades con mayor número de citas.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {topServices.length === 0 && (
              <p className="text-sm text-gray-500 dark:text-gray-400">Sin servicios destacados por el momento.</p>
            )}
            {topServices.map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-white p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-600 dark:hover:bg-indigo-900/20"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{service.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{service.category}</p>
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {service._count?.appointments ?? 0} citas •{' '}
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {formatCurrency(service.basePrice)}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

function formatDateTime(value: string | Date) {
  if (!value) return 'Sin fecha';
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

interface RevenueProgressProps {
  total: number;
  monthly: number;
}

function RevenueProgress({ total, monthly }: RevenueProgressProps) {
  const clampedTotal = total > 0 ? total : 1;
  const percentage = Math.min(100, Math.max(0, (monthly / clampedTotal) * 100));

  return (
    <div>
      <div className="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        {percentage.toFixed(1)}% de los ingresos totales se generó este mes.
      </p>
    </div>
  );
}
