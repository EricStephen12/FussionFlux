'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type BarChartProps = {
  data: Array<{
    date: string;
    [key: string]: any;
  }>;
  categories: string[];
};

const colors = {
  campaigns: 'rgb(99, 102, 241)', // indigo
  engagement: 'rgb(236, 72, 153)', // pink
};

const BarChart = ({ data, categories }: BarChartProps) => {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: categories.map(category => ({
      label: category,
      data: data.map(item => item[category.toLowerCase()]),
      backgroundColor: colors[category.toLowerCase() as keyof typeof colors],
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

  return <Bar data={chartData} options={options} />;
};

export default BarChart; 