import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import {
  Activity,
  AlertCircle,
  DollarSign,
  LineChart,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { adminService } from '@/services/admin.service';
import type { AnalyticsMetric } from '@/types';
import { Alerta } from '@/components/ui/Alerta';
import { Boton } from '@/components/ui/Boton';
import {
  Tarjeta,
  TarjetaContenido,
  TarjetaDescripcion,
  TarjetaEncabezado,
  TarjetaTitulo,
} from '@/components/ui/Tarjeta';
import {
  EsqueletoCuadriculaEstadisticas,
  EsqueletoTarjeta,
} from '@/components/ui/Esqueleto';
import { EstadoVacio } from '@/components/ui/EstadoVacio';
import AnalyticsTrendChart from '@/components/AnalyticsTrendChart';
import AnalyticsInsightsModal from '@/components/AnalyticsInsightsModal';

const metricIcons: Record<AnalyticsMetric, React.ComponentType<{ className?: string }>> = {
  revenue: DollarSign,
  appointments: Activity,
  users: Users,
};

const metricLabels: Record<AnalyticsMetric, string> = {
  revenue: 'Ingresos',
  appointments: 'Citas',
  users: 'Usuarios',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);

const formatearNumero = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(value);

const formatPercent = (value: number) =>
  `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;

export default function Analytics() {
  const [showInsights, setShowInsights] = useState(false);
  const [visibleMetrics, setVisibleMetrics] = useState<Record<AnalyticsMetric, boolean>>({
    revenue: true,
    appointments: true,
    users: false,
  });

  const overviewParams = useMemo(() => {
    const today = new Date();
    return {
      startDate: format(subDays(today, 29), 'yyyy-MM-dd'),
      endDate: format(today, 'yyyy-MM-dd'),
      groupBy: 'day' as const,
    };
  }, []);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['analytics-overview', overviewParams],
    queryFn: () => adminService.getAnalytics(overviewParams),
    staleTime: 60_000,
  });

  const analytics = data?.data?.data;
  const trends = analytics?.trends ?? [];
  const summary = analytics?.summary ?? {
    totalAppointments: 0,
    totalRevenue: 0,
    totalUsers: 0,
    averageOrderValue: 0,
  };

  const calculateTrendChange = (metric: AnalyticsMetric) => {
    if (!trends || trends.length < 2) return 0;
    const first = trends[0]?.[metric] ?? 0;
    const last = trends[trends.length - 1]?.[metric] ?? 0;
    if (first === 0) {
      return last > 0 ? 100 : 0;
    }
    return ((last - first) / first) * 100;
  };

  const handleMetricToggle = (metric: AnalyticsMetric) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground dark:text-foreground">Analíticas</h1>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            Visualiza el desempeño general, métricas claves y tendencias de la plataforma.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Boton variant="outline" onClick={() => refetch()} isLoading={isFetching}>
            <RefreshCw className="h-4 w-4" />
            Actualizar formData
          </Boton>
          <Boton onClick={() => setShowInsights(true)}>
            <LineChart className="h-4 w-4" />
            Abrir analíticas avanzadas
          </Boton>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <EsqueletoCuadriculaEstadisticas count={3} />
          <EsqueletoTarjeta />
          <EsqueletoCuadriculaEstadisticas count={3} />
        </div>
      ) : error ? (
        <Alerta
          variant="danger"
          title="No se pudieron cargar las analíticas"
          icon={AlertCircle}
          action={
            <Boton variant="outline" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Boton>
          }
        >
          Verifica tu conexión o vuelve a intentarlo en unos segundos.
        </Alerta>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {(['revenue', 'appointments', 'users'] as AnalyticsMetric[]).map((metric) => {
              const Icon = metricIcons[metric];
              const total =
                metric === 'revenue'
                  ? formatCurrency(summary.totalRevenue)
                  : metric === 'appointments'
                  ? formatearNumero(summary.totalAppointments)
                  : formatearNumero(summary.totalUsers);
              const change = calculateTrendChange(metric);
              const isPositive = change >= 0;

              return (
                <Tarjeta
                  key={metric}
                  className="border border-border shadow-sm dark:border-border dark:bg-card"
                >
                  <TarjetaEncabezado className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <TarjetaTitulo className="text-sm font-medium text-muted-foreground dark:text-muted-foreground">
                      {metricLabels[metric]}
                    </TarjetaTitulo>
                    <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                  </TarjetaEncabezado>
                  <TarjetaContenido>
                    <div className="text-2xl font-semibold text-foreground dark:text-foreground">{total}</div>
                    <p className="mt-2 flex items-center text-sm">
                      {isPositive ? (
                        <TrendingUp className="mr-1 h-4 w-4 text-emerald-500 dark:text-emerald-400" />
                      ) : (
                        <TrendingDown className="mr-1 h-4 w-4 text-red-500 dark:text-red-400" />
                      )}
                      <span
                        className={
                          isPositive
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-red-600 dark:text-red-400'
                        }
                      >
                        {formatPercent(change)}
                      </span>
                      <span className="ml-2 text-muted-foreground dark:text-muted-foreground">
                        vs inicio del periodo
                      </span>
                    </p>
                  </TarjetaContenido>
                </Tarjeta>
              );
            })}
          </div>

          <Tarjeta className="border border-border shadow-sm dark:border-border dark:bg-card">
            <TarjetaEncabezado className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <TarjetaTitulo className="text-foreground dark:text-foreground">
                  Tendencias recientes
                </TarjetaTitulo>
                <TarjetaDescripcion className="dark:text-muted-foreground">
                  Evolución de ingresos, citas y usuarios en los últimos 30 días.
                </TarjetaDescripcion>
              </div>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(visibleMetrics) as AnalyticsMetric[]).map((metric) => (
                  <Boton
                    key={metric}
                    size="sm"
                    variant={visibleMetrics[metric] ? 'primary' : 'outline'}
                    onClick={() => handleMetricToggle(metric)}
                  >
                    {metricLabels[metric]}
                  </Boton>
                ))}
              </div>
            </TarjetaEncabezado>
            <TarjetaContenido>
              {trends.length === 0 ? (
                <EstadoVacio
                  icon={LineChart}
                  title="Sin datos de tendencia"
                  description="No hay datos suficientes para los últimos 30 días."
                />
              ) : (
                <AnalyticsTrendChart data={trends} visibleMetrics={visibleMetrics} />
              )}
            </TarjetaContenido>
          </Tarjeta>

          <div className="grid gap-4 md:grid-cols-3">
            <Tarjeta className="border border-border bg-muted shadow-sm dark:border-border dark:bg-card">
              <TarjetaEncabezado>
                <TarjetaTitulo className="text-foreground dark:text-foreground">Ticket promedio</TarjetaTitulo>
                <TarjetaDescripcion className="dark:text-muted-foreground">
                  Ingresos promedio por cita confirmada.
                </TarjetaDescripcion>
              </TarjetaEncabezado>
              <TarjetaContenido>
                <p className="text-2xl font-semibold text-foreground dark:text-foreground">
                  {formatCurrency(summary.averageOrderValue || 0)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground dark:text-muted-foreground">
                  Basado en {formatearNumero(summary.totalAppointments || 0)} citas del periodo.
                </p>
              </TarjetaContenido>
            </Tarjeta>
            <Tarjeta className="border border-emerald-200 bg-emerald-50/80 shadow-sm dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <TarjetaEncabezado>
                <TarjetaTitulo className="text-foreground dark:text-foreground">
                  Crecimiento neto de usuarios
                </TarjetaTitulo>
                <TarjetaDescripcion className="dark:text-muted-foreground">
                  Usuarios incorporados durante el periodo medido.
                </TarjetaDescripcion>
              </TarjetaEncabezado>
              <TarjetaContenido>
                <p className="text-2xl font-semibold text-emerald-900 dark:text-emerald-300">
                  {formatearNumero(summary.totalUsers || 0)}
                </p>
                <p className="mt-2 text-xs text-emerald-700 dark:text-emerald-400/80">
                  Mantén campañas activas si la tendencia es positiva.
                </p>
              </TarjetaContenido>
            </Tarjeta>
            <Tarjeta className="border border-indigo-200 bg-indigo-50/80 shadow-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <TarjetaEncabezado>
                <TarjetaTitulo className="text-foreground dark:text-foreground">Ritmo operativo</TarjetaTitulo>
                <TarjetaDescripcion className="dark:text-muted-foreground">
                  Citas promedio gestionadas por día.
                </TarjetaDescripcion>
              </TarjetaEncabezado>
              <TarjetaContenido>
                <p className="text-2xl font-semibold text-indigo-900 dark:text-indigo-300">
                  {trends.length > 0
                    ? formatearNumero(summary.totalAppointments / trends.length)
                    : '0'}
                </p>
                <p className="mt-2 text-xs text-indigo-700 dark:text-indigo-400/80">
                  Ajusta turnos y logística según esta capacidad base.
                </p>
              </TarjetaContenido>
            </Tarjeta>
          </div>
        </>
      )}

      <AnalyticsInsightsModal isOpen={showInsights} onClose={() => setShowInsights(false)} />
    </div>
  );
}
