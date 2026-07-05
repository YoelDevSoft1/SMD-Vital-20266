import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import {
  X,
  RefreshCw,
  Download,
  CalendarRange,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  DollarSign,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminService } from '@/services/admin.service';
import type { AnalyticsData, AnalyticsFilters, AnalyticsMetric } from '@/types';
import { Boton } from '@/components/ui/Boton';
import { Entrada } from '@/components/ui/Entrada';
import { Etiqueta } from '@/components/ui/Etiqueta';
import { Seleccion, SelectItem } from '@/components/ui/Seleccion';
import { Tarjeta, TarjetaContenido, TarjetaEncabezado, TarjetaTitulo } from '@/components/ui/Tarjeta';
import AnalyticsTrendChart from '@/components/AnalyticsTrendChart';

type RangePreset = '7d' | '30d' | '90d' | 'ytd' | 'custom';
type ComparePreset = 'none' | 'previous_period' | 'previous_year';

interface AnalyticsInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const metricIcons: Record<AnalyticsMetric, React.ComponentType<{ className?: string }>> = {
  appointments: Activity,
  revenue: DollarSign,
  users: Users,
};

const metricLabels: Record<AnalyticsMetric, string> = {
  appointments: 'Citas',
  revenue: 'Ingresos',
  users: 'Usuarios',
};

const rangeOptions: Array<{ id: RangePreset; label: string }> = [
  { id: '7d', label: 'Últimos 7 días' },
  { id: '30d', label: 'Últimos 30 días' },
  { id: '90d', label: 'Últimos 90 días' },
  { id: 'ytd', label: 'Año en curso' },
  { id: 'custom', label: 'Personalizado' },
];

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

const calculateTrendChange = (trends: AnalyticsData['trends'], metric: AnalyticsMetric) => {
  if (!trends || trends.length < 2) return 0;
  const first = trends[0]?.[metric] ?? 0;
  const last = trends[trends.length - 1]?.[metric] ?? 0;
  if (first === 0) {
    return last > 0 ? 100 : 0;
  }
  return ((last - first) / first) * 100;
};

const getBestDay = (
  trends: AnalyticsData['trends'],
  metric: AnalyticsMetric
) => {
  if (!trends || trends.length === 0) return null;
  return trends.reduce((best, item) =>
    item[metric] > best[metric] ? item : best
  );
};

const formatearFecha = (value: Date) => format(value, 'yyyy-MM-dd');

const AnalyticsInsightsModal = ({ isOpen, onClose }: AnalyticsInsightsModalProps) => {
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => subDays(today, 29), [today]);

  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [comparePreset, setComparePreset] = useState<ComparePreset>('none');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: formatearFecha(defaultStart),
    endDate: formatearFecha(today),
    groupBy: 'day',
  });
  const [customRange, setCustomRange] = useState({
    startDate: formatearFecha(defaultStart),
    endDate: formatearFecha(today),
  });
  const [visibleMetrics, setVisibleMetrics] = useState<Record<AnalyticsMetric, boolean>>({
    appointments: true,
    revenue: true,
    users: true,
  });

  const requestParams = useMemo(
    () => ({
      startDate: filters.startDate,
      endDate: filters.endDate,
      groupBy: filters.groupBy,
      compareTo: comparePreset === 'none' ? undefined : comparePreset,
      doctorId: filters.doctorId || undefined,
      serviceId: filters.serviceId || undefined,
      city: filters.city || undefined,
    }),
    [filters.startDate, filters.endDate, filters.groupBy, comparePreset, filters.doctorId, filters.serviceId, filters.city]
  );

  const { data: analytics, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['analytics-insights', requestParams],
    queryFn: async () => {
      const response = await adminService.getAnalytics(requestParams);
      return response.data.data;
    },
    enabled: isOpen,
    staleTime: 60_000,
  });

  const trends: AnalyticsData['trends'] = analytics?.trends ?? [];
  const summary = analytics?.summary ?? {
    totalAppointments: 0,
    totalRevenue: 0,
    totalUsers: 0,
    averageOrderValue: 0,
  };

  const appointmentsChange = calculateTrendChange(trends, 'appointments');
  const revenueChange = calculateTrendChange(trends, 'revenue');
  const usersChange = calculateTrendChange(trends, 'users');

  const bestRevenueDay = getBestDay(trends, 'revenue');
  const bestAppointmentsDay = getBestDay(trends, 'appointments');

  const averageDailyRevenue =
    trends.length > 0 ? summary.totalRevenue / trends.length : 0;
  const averageDailyAppointments =
    trends.length > 0 ? summary.totalAppointments / trends.length : 0;

  const handlePresetChange = (preset: RangePreset) => {
    setRangePreset(preset);
    const end = new Date();
    let start: Date | null = null;

    if (preset === '7d') start = subDays(end, 6);
    if (preset === '30d') start = subDays(end, 29);
    if (preset === '90d') start = subDays(end, 89);
    if (preset === 'ytd') start = new Date(end.getFullYear(), 0, 1);

    if (preset === 'custom') {
      setFilters((prev) => ({
        ...prev,
        startDate: customRange.startDate,
        endDate: customRange.endDate,
      }));
      return;
    }

    if (start) {
      setFilters((prev) => ({
        ...prev,
        startDate: formatearFecha(start!),
        endDate: formatearFecha(end),
      }));
      setCustomRange({
        startDate: formatearFecha(start),
        endDate: formatearFecha(end),
      });
    }
  };

  const handleCustomDateChange = (key: 'startDate' | 'endDate', value: string) => {
    setCustomRange((prev) => ({ ...prev, [key]: value }));
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleMetricToggle = (metric: AnalyticsMetric) => {
    setVisibleMetrics((prev) => ({
      ...prev,
      [metric]: !prev[metric],
    }));
  };

  const handleExport = async (formatType: 'csv' | 'json') => {
    try {
      await adminService.exportData('analytics', formatType, requestParams);
      toast.success(`Exportación ${formatType.toUpperCase()} iniciada`);
    } catch (exportError) {
      console.error(exportError);
      toast.error('No se pudo exportar la información de analíticas');
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <div className="relative flex h-[100dvh] w-full max-w-6xl flex-col overflow-hidden rounded-t-2xl rounded-b-none bg-white shadow-2xl sm:h-[92vh] sm:rounded-2xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Analíticas Avanzadas</h2>
            <p className="text-sm text-muted-foreground">
              Explora en detalle el rendimiento de la plataforma y encuentra patrones relevantes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Boton
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </Boton>
            <Boton variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Boton>
            <Boton variant="outline" onClick={() => handleExport('json')}>
              <Download className="h-4 w-4" />
              Exportar JSON
            </Boton>
            <Boton variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Boton>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-muted">
          <section className="border-b border-border bg-white px-6 py-5">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Etiqueta className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <CalendarRange className="h-4 w-4 text-blue-500" />
                  Rango de tiempo
                </Etiqueta>
                <div className="flex flex-wrap gap-2">
                  {rangeOptions.map((option) => (
                    <Boton
                      key={option.id}
                      size="sm"
                      variant={rangePreset === option.id ? 'primary' : 'outline'}
                      onClick={() => handlePresetChange(option.id)}
                    >
                      {option.label}
                    </Boton>
                  ))}
                </div>
                {rangePreset === 'custom' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Etiqueta htmlFor="custom-start" className="mb-1 block text-sm font-medium text-foreground">
                        Desde
                      </Etiqueta>
                      <Entrada
                        id="custom-start"
                        type="date"
                        value={customRange.startDate}
                        onChange={(event) => handleCustomDateChange('startDate', event.target.value)}
                      />
                    </div>
                    <div>
                      <Etiqueta htmlFor="custom-end" className="mb-1 block text-sm font-medium text-foreground">
                        Hasta
                      </Etiqueta>
                      <Entrada
                        id="custom-end"
                        type="date"
                        value={customRange.endDate}
                        max={formatearFecha(today)}
                        onChange={(event) => handleCustomDateChange('endDate', event.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:col-span-3">
                <div>
                  <Etiqueta htmlFor="group-by" className="mb-1 block text-sm font-medium text-foreground">
                    Agrupar por
                  </Etiqueta>
                  <Seleccion
                    id="group-by"
                    value={filters.groupBy}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, groupBy: event.target.value as 'day' | 'week' | 'month' }))
                    }
                  >
                    <SelectItem value="day">Día</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mes</SelectItem>
                  </Seleccion>
                </div>
                <div>
                  <Etiqueta htmlFor="compare-to" className="mb-1 block text-sm font-medium text-foreground">
                    Comparar contra
                  </Etiqueta>
                  <Seleccion
                    id="compare-to"
                    value={comparePreset}
                    onChange={(event) => setComparePreset(event.target.value as ComparePreset)}
                  >
                    <SelectItem value="none">Sin comparación</SelectItem>
                    <SelectItem value="previous_period">Periodo anterior</SelectItem>
                    <SelectItem value="previous_year">Mismo periodo año pasado</SelectItem>
                  </Seleccion>
                </div>
              </div>

              <div className="grid gap-4 lg:col-span-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Etiqueta htmlFor="segment-service" className="mb-1 block text-sm font-medium text-foreground">
                      Servicio (ID)
                    </Etiqueta>
                    <Entrada
                      id="segment-service"
                      placeholder="Opcional"
                      value={filters.serviceId ?? ''}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, serviceId: event.target.value || undefined }))
                      }
                    />
                  </div>
                  <div>
                    <Etiqueta htmlFor="segment-city" className="mb-1 block text-sm font-medium text-foreground">
                      Ciudad
                    </Etiqueta>
                    <Entrada
                      id="segment-city"
                      placeholder="Ej: Bogotá"
                      value={filters.city ?? ''}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, city: event.target.value || undefined }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Etiqueta htmlFor="segment-doctor" className="mb-1 block text-sm font-medium text-foreground">
                    Doctor (ID)
                  </Etiqueta>
                  <Entrada
                    id="segment-doctor"
                    placeholder="Opcional"
                    value={filters.doctorId ?? ''}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, doctorId: event.target.value || undefined }))
                    }
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="px-6 py-6">
            {isLoading ? (
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-white text-muted-foreground">
                Cargando analíticas...
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-600">
                No se pudo cargar la información. Intenta actualizar o verifica la conexión con el backend.
              </div>
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
                    const change =
                      metric === 'revenue'
                        ? revenueChange
                        : metric === 'appointments'
                        ? appointmentsChange
                        : usersChange;
                    const isPositive = change >= 0;

                    return (
                      <Tarjeta key={metric} className="border border-border shadow-sm">
                        <TarjetaEncabezado className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <TarjetaTitulo className="text-sm font-medium text-muted-foreground">
                            {metricLabels[metric]}
                          </TarjetaTitulo>
                          <Icon className="h-5 w-5 text-blue-500" />
                        </TarjetaEncabezado>
                        <TarjetaContenido>
                          <div className="text-2xl font-semibold text-foreground">{total}</div>
                          <div className="mt-2 flex items-center text-sm">
                            {isPositive ? (
                              <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                              {formatPercent(change)}
                            </span>
                            <span className="ml-2 text-muted-foreground">vs inicio del periodo</span>
                          </div>
                        </TarjetaContenido>
                      </Tarjeta>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Tendencias en el tiempo</h3>
                      <p className="text-sm text-muted-foreground">
                        Visualiza el comportamiento histórico y activa/desactiva las métricas de interés.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
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
                  </div>
                  <AnalyticsTrendChart data={trends} visibleMetrics={visibleMetrics} />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Tarjeta className="border border-border shadow-sm">
                    <TarjetaEncabezado>
                      <TarjetaTitulo>Insights destacados</TarjetaTitulo>
                    </TarjetaEncabezado>
                    <TarjetaContenido className="space-y-4 text-sm text-foreground">
                      <div className="rounded-lg bg-blue-50/70 p-3">
                        <p className="font-semibold text-blue-900">Ingresos promedio diarios</p>
                        <p className="mt-1 text-blue-800">{formatCurrency(averageDailyRevenue)}</p>
                        <p className="text-xs text-blue-600">
                          {trends.length} puntos analizados · {filters.groupBy === 'day' ? 'Agrupado por día' : filters.groupBy === 'week' ? 'Agrupado por semana' : 'Agrupado por mes'}
                        </p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-3">
                        <p className="font-semibold text-emerald-900">Citas promedio por periodo</p>
                        <p className="mt-1 text-emerald-800">
                          {formatearNumero(averageDailyAppointments)} citas
                        </p>
                        <p className="text-xs text-emerald-600">
                          Ideal para dimensionar capacidad operativa y recursos.
                        </p>
                      </div>
                      {bestRevenueDay && (
                        <div className="rounded-lg bg-purple-50 p-3">
                          <p className="font-semibold text-purple-900">Mejor día en ingresos</p>
                          <p className="mt-1 text-purple-800">
                            {new Intl.DateTimeFormat('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: '2-digit',
                            }).format(new Date(bestRevenueDay.date))}{' '}
                            · {formatCurrency(bestRevenueDay.revenue)}
                          </p>
                          <p className="text-xs text-purple-600">
                            Maximiza campañas similares a ese día para replicar resultados.
                          </p>
                        </div>
                      )}
                      {bestAppointmentsDay && (
                        <div className="rounded-lg bg-amber-50 p-3">
                          <p className="font-semibold text-amber-900">Mayor número de citas</p>
                          <p className="mt-1 text-amber-800">
                            {new Intl.DateTimeFormat('es-CO', {
                              year: 'numeric',
                              month: 'long',
                              day: '2-digit',
                            }).format(new Date(bestAppointmentsDay.date))}{' '}
                            · {formatearNumero(bestAppointmentsDay.appointments)} citas
                          </p>
                          <p className="text-xs text-amber-600">
                            Útil para ajustar disponibilidad de médicos y logística.
                          </p>
                        </div>
                      )}
                    </TarjetaContenido>
                  </Tarjeta>

                  <Tarjeta className="border border-border shadow-sm">
                    <TarjetaEncabezado>
                      <TarjetaTitulo>Detalle de los últimos periodos</TarjetaTitulo>
                    </TarjetaEncabezado>
                    <TarjetaContenido className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-border text-sm">
                          <thead className="bg-muted text-left text-xs font-semibold uppercase text-muted-foreground">
                            <tr>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3 text-right">Ingresos</th>
                              <th className="px-4 py-3 text-right">Citas</th>
                              <th className="px-4 py-3 text-right">Usuarios</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border bg-white">
                            {trends
                              .slice(-8)
                              .reverse()
                              .map((item: AnalyticsData['trends'][number]) => (
                              <tr key={item.date}>
                                <td className="whitespace-nowrap px-4 py-3 text-foreground">
                                  {new Intl.DateTimeFormat('es-CO', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                  }).format(new Date(item.date))}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                                  {formatCurrency(item.revenue)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                                  {formatearNumero(item.appointments)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-foreground">
                                  {formatearNumero(item.users)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TarjetaContenido>
                  </Tarjeta>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsInsightsModal;
