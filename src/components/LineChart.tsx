'use client';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type LineChartProps = {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  categories: string[];
};

const colors = {
  opens: 'rgb(59, 130, 246)', // blue
  clicks: 'rgb(16, 185, 129)', // green
  conversions: 'rgb(249, 115, 22)', // orange
};

const LineChart = ({ data, categories }: LineChartProps) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: categories.map(category => ({
      label: category,
      data: data.map(item => item[category.toLowerCase()]),
      borderColor: colors[category.toLowerCase() as keyof typeof colors],
      backgroundColor: colors[category.toLowerCase() as keyof typeof colors],
      tension: 0.4,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default LineChart; 