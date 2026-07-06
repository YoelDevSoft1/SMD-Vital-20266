/**
 * AnalyticsTrendChart — Line chart (recharts) con soporte dark mode vía useTheme().
 *
 * Métricas: appointments / revenue / users, cada una con variantes de color
 * para light y dark mode.
 */

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
import { useTheme } from '@/context/theme';

interface AnalyticsTrendChartProps {
  data: Array<{
    date: string;
    appointments: number;
    revenue: number;
    users: number;
  }>;
  visibleMetrics: Record<AnalyticsMetric, boolean>;
}

interface MetricSetting {
  color: string;       // light mode stroke
  darkColor: string;   // dark mode stroke
  label: string;
  formatter: (value: number) => string;
}

const metricSettings: Record<AnalyticsMetric, MetricSetting> = {
  appointments: {
    color: '#3b82f6',
    darkColor: '#60a5fa',
    label: 'Citas',
    formatter: (value) =>
      new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value),
  },
  revenue: {
    color: '#10b981',
    darkColor: '#34d399',
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
    darkColor: '#a78bfa',
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
  return metricSettings[metric].formatter(value);
}

const AnalyticsTrendChart = ({ data, visibleMetrics }: AnalyticsTrendChartProps) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tokens semánticos según tema (recharts usa stroke + fill directos).
  const tickColor = isDark ? '#9ca3af' : '#6B7280';
  const gridStroke = isDark ? 'rgba(148, 163, 184, 0.15)' : '#f3f4f6';
  const tooltipBg = isDark ? 'hsl(222 47% 11%)' : '#111827';
  const tooltipBorder = isDark ? 'rgba(96, 165, 250, 0.6)' : 'rgba(59,130,246,0.4)';
  const tooltipText = isDark ? '#f9fafb' : '#F9FAFB';

  if (!data || data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border bg-card text-sm text-muted-foreground">
        No hay datos disponibles para el rango seleccionado.
      </div>
    );
  }

  const primaryMetric: AnalyticsMetric =
    (Object.keys(visibleMetrics).find(
      (metric) => visibleMetrics[metric as AnalyticsMetric]
    ) as AnalyticsMetric) || 'appointments';

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, right: 24, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
          <XAxis
            dataKey="date"
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => dateFormatter.format(new Date(value))}
          />
          <YAxis
            tick={{ fill: tickColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) =>
              formatYAxisTick(primaryMetric, Number.isFinite(value) ? value : 0)
            }
          />
          <Tooltip
            contentStyle={{
              backgroundColor: tooltipBg,
              borderRadius: '0.75rem',
              border: `1px solid ${tooltipBorder}`,
              color: tooltipText,
            }}
            formatter={(value: number, name: string) => {
              const metric = name as AnalyticsMetric;
              return [
                metricSettings[metric]?.formatter(value) ?? value,
                metricSettings[metric]?.label ?? name,
              ];
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
            formatter={(value: string) =>
              metricSettings[value as AnalyticsMetric]?.label ?? value
            }
          />
          {(
            Object.entries(metricSettings) as Array<
              [AnalyticsMetric, MetricSetting]
            >
          ).map(([metric, settings]) =>
            visibleMetrics[metric] ? (
              <Line
                key={metric}
                type="monotone"
                dataKey={metric}
                name={metric}
                stroke={isDark ? settings.darkColor : settings.color}
                strokeWidth={3}
                dot={{ r: 3 }}
                activeDot={{ r: 6 }}
              />
            ) : null,
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AnalyticsTrendChart;