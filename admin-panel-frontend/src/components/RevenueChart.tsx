/**
 * RevenueChart — Line chart (chart.js) con soporte dark mode vía useTheme().
 *
 * Tokenos semánticos aplicados a escalas, leyenda y tooltip para coherencia
 * con el design system. Si el padre pasa `data`, se preserva; si no, defaults.
 */

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useTheme } from '@/context/theme';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data?: {
    labels: string[];
    datasets: {
      label: string;
      data: number[];
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    }[];
  };
}

export default function RevenueChart({ data }: RevenueChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Tokens semánticos según tema — coherente con index.css HSL tokens.
  const textColor = isDark ? 'hsl(210 40% 98%)' : 'hsl(222 47% 11%)';
  const tickColor = isDark ? 'hsl(215 20% 65%)' : 'hsl(215 16% 47%)';
  const gridColor = isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(0, 0, 0, 0.05)';
  const tooltipBg = isDark ? 'hsl(222 47% 11%)' : 'rgba(0, 0, 0, 0.85)';
  const tooltipBorder = isDark ? 'hsl(217 91% 60%)' : 'rgba(59, 130, 246, 0.8)';
  const tooltipText = isDark ? 'hsl(210 40% 98%)' : '#fff';

  // Variantes de línea y punto con mejor contraste en dark.
  const lineColor = isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)';
  const lineBg = isDark ? 'rgba(96, 165, 250, 0.12)' : 'rgba(59, 130, 246, 0.1)';
  const pointBg = isDark ? 'rgb(96, 165, 250)' : 'rgb(59, 130, 246)';
  const pointBorder = isDark ? 'hsl(222 47% 8%)' : '#fff';

  const defaultData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Ingresos (COP)',
        data: [1200000, 1900000, 3000000, 5000000, 2000000, 3000000, 4500000, 3200000, 2800000, 4100000, 3600000, 4200000],
        borderColor: lineColor,
        backgroundColor: lineBg,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartData = data || defaultData;

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
          label: (context: any) =>
            `Ingresos: ${new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(context.parsed.y)}`,
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
          callback: (value: any) =>
            new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value),
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: pointBg,
        borderColor: pointBorder,
        borderWidth: 2,
      },
      line: { borderWidth: 3 },
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}