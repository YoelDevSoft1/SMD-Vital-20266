/**
 * PaymentMethodsChart — Bar chart (chart.js) con soporte dark mode vía useTheme().
 *
 * Paleta de 6 colores con variantes claras (dark mode) para mejor contraste.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '@/context/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PaymentMethodsChartProps {
  data?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      backgroundColor: string[];
      borderColor: string[];
      borderWidth: number;
    }[];
  };
}

export default function PaymentMethodsChart({ data }: PaymentMethodsChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222 47% 11%)';
  const tickColor = isDark ? 'hsl(215 20% 65%)' : 'hsl(215 16% 47%)';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDark ? 'hsl(222 47% 11%)' : 'rgba(0, 0, 0, 0.85)';
  const tooltipBorder = isDark ? 'hsl(217 91% 60%)' : 'rgba(59, 130, 246, 0.8)';
  const tooltipText = isDark ? 'hsl(210 40% 98%)' : '#fff';

  // Paleta de 6 colores con variantes para dark mode (más brillantes).
  const palette = isDark
    ? {
        bg: [
          'rgba(56, 189, 248, 0.85)',   // sky-400
          'rgba(52, 211, 153, 0.85)',   // emerald-400
          'rgba(167, 139, 250, 0.85)',  // violet-400
          'rgba(251, 146, 60, 0.85)',   // orange-400
          'rgba(248, 113, 113, 0.85)',  // red-400
          'rgba(148, 163, 184, 0.85)',  // slate-400
        ],
        border: [
          'rgb(56, 189, 248)',
          'rgb(52, 211, 153)',
          'rgb(167, 139, 250)',
          'rgb(251, 146, 60)',
          'rgb(248, 113, 113)',
          'rgb(148, 163, 184)',
        ],
      }
    : {
        bg: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        border: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
      };

  const defaultData = {
    labels: ['Tarjeta', 'Transferencia', 'Nequi', 'Davivienda', 'PSE', 'Efectivo'],
    datasets: [
      {
        label: 'Cantidad de Pagos',
        data: [45, 25, 15, 10, 5, 8],
        backgroundColor: palette.bg,
        borderColor: palette.border,
        borderWidth: 1,
      },
    ],
  };

  const chartData =
    data &&
    data.labels &&
    Array.isArray(data.labels) &&
    data.datasets &&
    Array.isArray(data.datasets) &&
    data.datasets.length > 0
      ? data
      : defaultData;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { size: 12, weight: 500 },
        },
      },
      title: { display: false },
      tooltip: {
        backgroundColor: tooltipBg,
        titleColor: tooltipText,
        bodyColor: tooltipText,
        borderColor: tooltipBorder,
        borderWidth: 1,
        callbacks: {
          label: (context: any) => {
            const value = context.parsed.y;
            const total = context.dataset.data.reduce(
              (a: number, b: number) => a + b,
              0,
            );
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} pagos (${percentage}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: tickColor, font: { size: 11 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: {
          color: tickColor,
          font: { size: 11 },
          stepSize: 5,
        },
      },
    },
  };

  try {
    return (
      <div className="h-64 w-full">
        <Bar data={chartData} options={options} />
      </div>
    );
  } catch (error) {
    console.error('Error rendering PaymentMethodsChart:', error);
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 dark:text-gray-400">Error al cargar el gráfico</p>
          <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">
            Intenta recargar la página
          </p>
        </div>
      </div>
    );
  }
}