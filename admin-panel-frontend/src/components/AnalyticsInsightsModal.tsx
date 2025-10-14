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
import type { AxiosResponse } from 'axios';
import { adminService } from '@/services/admin.service';
import type { AnalyticsData, AnalyticsFilters, AnalyticsMetric } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectItem } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const formatNumber = (value: number) =>
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

const formatDate = (value: Date) => format(value, 'yyyy-MM-dd');

const AnalyticsInsightsModal = ({ isOpen, onClose }: AnalyticsInsightsModalProps) => {
  const today = useMemo(() => new Date(), []);
  const defaultStart = useMemo(() => subDays(today, 29), [today]);

  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [comparePreset, setComparePreset] = useState<ComparePreset>('none');
  const [filters, setFilters] = useState<AnalyticsFilters>({
    startDate: formatDate(defaultStart),
    endDate: formatDate(today),
    groupBy: 'day',
  });
  const [customRange, setCustomRange] = useState({
    startDate: formatDate(defaultStart),
    endDate: formatDate(today),
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

  const { data, isLoading, isFetching, error, refetch } = useQuery<AxiosResponse<{ data: AnalyticsData }>>({
    queryKey: ['analytics-insights', requestParams],
    queryFn: () => adminService.getAnalytics(requestParams),
    enabled: isOpen,
    staleTime: 60_000,
  });

  const analytics = data?.data;
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
        startDate: formatDate(start!),
        endDate: formatDate(end),
      }));
      setCustomRange({
        startDate: formatDate(start),
        endDate: formatDate(end),
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
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="relative flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Analíticas Avanzadas</h2>
            <p className="text-sm text-gray-500">
              Explora en detalle el rendimiento de la plataforma y encuentra patrones relevantes.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetch()}
              isLoading={isFetching}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Actualizar
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="mr-2 h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => handleExport('json')}>
              <Download className="mr-2 h-4 w-4" />
              Exportar JSON
            </Button>
            <Button variant="ghost" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-gray-50">
          <section className="border-b border-gray-200 bg-white px-6 py-5">
            <div className="grid gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <CalendarRange className="h-4 w-4 text-blue-500" />
                  Rango de tiempo
                </Label>
                <div className="flex flex-wrap gap-2">
                  {rangeOptions.map((option) => (
                    <Button
                      key={option.id}
                      size="sm"
                      variant={rangePreset === option.id ? 'primary' : 'outline'}
                      onClick={() => handlePresetChange(option.id)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
                {rangePreset === 'custom' && (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="custom-start" className="mb-1 block text-sm font-medium text-gray-700">
                        Desde
                      </Label>
                      <Input
                        id="custom-start"
                        type="date"
                        value={customRange.startDate}
                        onChange={(event) => handleCustomDateChange('startDate', event.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-end" className="mb-1 block text-sm font-medium text-gray-700">
                        Hasta
                      </Label>
                      <Input
                        id="custom-end"
                        type="date"
                        value={customRange.endDate}
                        max={formatDate(today)}
                        onChange={(event) => handleCustomDateChange('endDate', event.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid gap-4 lg:col-span-3">
                <div>
                  <Label htmlFor="group-by" className="mb-1 block text-sm font-medium text-gray-700">
                    Agrupar por
                  </Label>
                  <Select
                    id="group-by"
                    value={filters.groupBy}
                    onChange={(event) =>
                      setFilters((prev) => ({ ...prev, groupBy: event.target.value as 'day' | 'week' | 'month' }))
                    }
                  >
                    <SelectItem value="day">Día</SelectItem>
                    <SelectItem value="week">Semana</SelectItem>
                    <SelectItem value="month">Mes</SelectItem>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="compare-to" className="mb-1 block text-sm font-medium text-gray-700">
                    Comparar contra
                  </Label>
                  <Select
                    id="compare-to"
                    value={comparePreset}
                    onChange={(event) => setComparePreset(event.target.value as ComparePreset)}
                  >
                    <SelectItem value="none">Sin comparación</SelectItem>
                    <SelectItem value="previous_period">Periodo anterior</SelectItem>
                    <SelectItem value="previous_year">Mismo periodo año pasado</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 lg:col-span-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="segment-service" className="mb-1 block text-sm font-medium text-gray-700">
                      Servicio (ID)
                    </Label>
                    <Input
                      id="segment-service"
                      placeholder="Opcional"
                      value={filters.serviceId ?? ''}
                      onChange={(event) =>
                        setFilters((prev) => ({ ...prev, serviceId: event.target.value || undefined }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="segment-city" className="mb-1 block text-sm font-medium text-gray-700">
                      Ciudad
                    </Label>
                    <Input
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
                  <Label htmlFor="segment-doctor" className="mb-1 block text-sm font-medium text-gray-700">
                    Doctor (ID)
                  </Label>
                  <Input
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
              <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-white text-gray-500">
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
                        ? formatNumber(summary.totalAppointments)
                        : formatNumber(summary.totalUsers);
                    const change =
                      metric === 'revenue'
                        ? revenueChange
                        : metric === 'appointments'
                        ? appointmentsChange
                        : usersChange;
                    const isPositive = change >= 0;

                    return (
                      <Card key={metric} className="border border-gray-200 shadow-sm">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium text-gray-600">
                            {metricLabels[metric]}
                          </CardTitle>
                          <Icon className="h-5 w-5 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-semibold text-gray-900">{total}</div>
                          <div className="mt-2 flex items-center text-sm">
                            {isPositive ? (
                              <TrendingUp className="mr-1 h-4 w-4 text-emerald-500" />
                            ) : (
                              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            )}
                            <span className={isPositive ? 'text-emerald-600' : 'text-red-600'}>
                              {formatPercent(change)}
                            </span>
                            <span className="ml-2 text-gray-500">vs inicio del periodo</span>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Tendencias en el tiempo</h3>
                      <p className="text-sm text-gray-500">
                        Visualiza el comportamiento histórico y activa/desactiva las métricas de interés.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {(Object.keys(visibleMetrics) as AnalyticsMetric[]).map((metric) => (
                        <Button
                          key={metric}
                          size="sm"
                          variant={visibleMetrics[metric] ? 'primary' : 'outline'}
                          onClick={() => handleMetricToggle(metric)}
                        >
                          {metricLabels[metric]}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <AnalyticsTrendChart data={trends} visibleMetrics={visibleMetrics} />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Insights destacados</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-gray-700">
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
                          {formatNumber(averageDailyAppointments)} citas
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
                            · {formatNumber(bestAppointmentsDay.appointments)} citas
                          </p>
                          <p className="text-xs text-amber-600">
                            Útil para ajustar disponibilidad de médicos y logística.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-sm">
                    <CardHeader>
                      <CardTitle>Detalle de los últimos periodos</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
                            <tr>
                              <th className="px-4 py-3">Fecha</th>
                              <th className="px-4 py-3 text-right">Ingresos</th>
                              <th className="px-4 py-3 text-right">Citas</th>
                              <th className="px-4 py-3 text-right">Usuarios</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 bg-white">
                            {trends
                              .slice(-8)
                              .reverse()
                              .map((item: AnalyticsData['trends'][number]) => (
                              <tr key={item.date}>
                                <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                                  {new Intl.DateTimeFormat('es-CO', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: '2-digit',
                                  }).format(new Date(item.date))}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                                  {formatCurrency(item.revenue)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                                  {formatNumber(item.appointments)}
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-right text-gray-700">
                                  {formatNumber(item.users)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
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
