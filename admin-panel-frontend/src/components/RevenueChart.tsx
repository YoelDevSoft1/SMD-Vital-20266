import React from 'react';
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
  // Datos por defecto si no se proporcionan
  const defaultData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
    datasets: [
      {
        label: 'Ingresos (COP)',
        data: [1200000, 1900000, 3000000, 5000000, 2000000, 3000000, 4500000, 3200000, 2800000, 4100000, 3600000, 4200000],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
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
          color: '#374151',
          font: {
            size: 12,
            weight: '500' as const,
          },
        },
      },
      title: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 0.8)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const value = context.parsed.y;
            return `Ingresos: ${new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
            }).format(value)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          },
          callback: function(value: any) {
            return new Intl.NumberFormat('es-CO', {
              style: 'currency',
              currency: 'COP',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(value);
          },
        },
      },
    },
    elements: {
      point: {
        radius: 4,
        hoverRadius: 6,
        backgroundColor: 'rgb(59, 130, 246)',
        borderColor: 'white',
        borderWidth: 2,
      },
      line: {
        borderWidth: 3,
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Line data={chartData} options={options} />
    </div>
  );
}
