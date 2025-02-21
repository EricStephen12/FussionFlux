import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartData,
  ChartOptions
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const defaultOptions: ChartOptions<'line'> = {
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
    },
  },
};

interface ChartProps {
  data: any[];
  height?: number;
  categories: string[];
}

export function LineChart({ data, height = 300, categories }: ChartProps) {
  const chartData: ChartData<'line'> = {
    labels: data.map(d => d.date),
    datasets: categories.map((category, index) => ({
      label: category,
      data: data.map(d => d[category.toLowerCase()]),
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(168, 85, 247)',
        'rgb(236, 72, 153)',
      ][index],
      tension: 0.4,
    })),
  };

  return (
    <div style={{ height }}>
      <Line options={defaultOptions} data={chartData} />
    </div>
  );
}

export function BarChart({ data, height = 300, categories }: ChartProps) {
  const chartData: ChartData<'bar'> = {
    labels: data.map(d => d.date),
    datasets: categories.map((category, index) => ({
      label: category,
      data: data.map(d => d[category.toLowerCase()]),
      backgroundColor: [
        'rgba(99, 102, 241, 0.5)',
        'rgba(168, 85, 247, 0.5)',
        'rgba(236, 72, 153, 0.5)',
      ][index],
      borderColor: [
        'rgb(99, 102, 241)',
        'rgb(168, 85, 247)',
        'rgb(236, 72, 153)',
      ][index],
      borderWidth: 1,
    })),
  };

  return (
    <div style={{ height }}>
      <Bar options={defaultOptions} data={chartData} />
    </div>
  );
} 