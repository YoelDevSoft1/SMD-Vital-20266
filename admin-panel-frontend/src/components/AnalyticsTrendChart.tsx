import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { AnalyticsMetric } from '@/types';

interface AnalyticsTrendChartProps {
  data: Array<{
    date: string;
    appointments: number;
    revenue: number;
    users: number;
  }>;
  visibleMetrics: Record<AnalyticsMetric, boolean>;
}

const metricSettings: Record<
  AnalyticsMetric,
  { color: string; label: string; formatter: (value: number) => string }
> = {
  appointments: {
    color: '#3b82f6',
    label: 'Citas',
    formatter: (value) =>
      new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value),
  },
  revenue: {
    color: '#10b981',
    label: 'Ingresos',
    formatter: (value) =>
      new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        maximumFractionDigits: 0,
      }).format(value),
  },
  users: {
    color: '#8b5cf6',
    label: 'Usuarios',
    formatter: (value) =>
      new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value),
  },
};

const dateFormatter = new Intl.DateTimeFormat('es-CO', {
  month: 'short',
  day: '2-digit',
});

function formatYAxisTick(metric: AnalyticsMetric, value: number) {
  const { formatter } = metricSettings[metric];
  return formatter(value);
}

const AnalyticsTrendChart = ({ data, visibleMetrics }: AnalyticsTrendChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-white text-sm text-gray-500">
        No hay datos disponibles para el rango seleccionado.
      </div>
    );
  }

  // Determine which metric to use for primary Y axis formatting
  const primaryMetric: AnalyticsMetric =
    (Object.keys(visibleMetrics).find(
      (metric) => visibleMetrics[metric as AnalyticsMetric]
    ) as AnalyticsMetric) || 'appointments';

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => dateFormatter.format(new Date(value))}
          />
          <YAxis
            tick={{ fill: '#6B7280', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              formatYAxisTick(primaryMetric, Number.isFinite(value) ? value : 0)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#111827',
              borderRadius: '0.75rem',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#F9FAFB',
            }}
            formatter={(value: number, name: string) => {
              const metric = name as AnalyticsMetric;
              return [metricSettings[metric]?.formatter(value) ?? value, metricSettings[metric]?.label ?? name];
            }}
            labelFormatter={(value: string) =>
              new Intl.DateTimeFormat('es-CO', {
                year: 'numeric',
                month: 'long',
                day: '2-digit',
              }).format(new Date(value))
            }
          />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ paddingTop: 12 }}
            formatter={(value: string) => metricSettings[value as AnalyticsMetric]?.label ?? value}
          />
          {(
            Object.entries(metricSettings) as Array<[AnalyticsMetric, typeof metricSettings[AnalyticsMetric]]>
          ).map(([metric, settings]) =>
            visibleMetrics[metric] ? (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metric}
                stroke={settings.color}
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ) : null
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsTrendChart;
