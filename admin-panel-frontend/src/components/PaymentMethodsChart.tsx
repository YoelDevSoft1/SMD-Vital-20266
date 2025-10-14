import React from 'react';
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
  // Datos por defecto si no se proporcionan
  const defaultData = {
    labels: ['Tarjeta', 'Transferencia', 'Nequi', 'Davivienda', 'PSE', 'Efectivo'],
    datasets: [
      {
        label: 'Cantidad de Pagos',
        data: [45, 25, 15, 10, 5, 8],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(249, 115, 22, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(107, 114, 128, 0.8)',
        ],
        borderColor: [
          'rgb(59, 130, 246)',
          'rgb(34, 197, 94)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)',
          'rgb(239, 68, 68)',
          'rgb(107, 114, 128)',
        ],
        borderWidth: 1,
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
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value} pagos (${percentage}%)`;
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
          stepSize: 5,
        },
      },
    },
  };

  return (
    <div className="h-64 w-full">
      <Bar data={chartData} options={options} />
    </div>
  );
}
