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
  xKey: string;
  series: Array<{
    key: string;
    name: string;
    color: string;
  }>;
}

export const LineChart = ({ data = [], xKey, series = [] }: ChartProps) => {
  if (!data || !series || data.length === 0 || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData: ChartData<'line'> = {
    labels: data.map(d => d[xKey] || ''),
    datasets: series.map((s) => ({
      label: s.name,
      data: data.map(d => d[s.key] || 0),
      borderColor: s.color,
      backgroundColor: s.color,
      tension: 0.4,
      fill: false,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export const BarChart = ({ data = [], xKey, series = [] }: ChartProps) => {
  if (!data || !series || data.length === 0 || series.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  const chartData: ChartData<'bar'> = {
    labels: data.map(d => d[xKey] || ''),
    datasets: series.map((s) => ({
      label: s.name,
      data: data.map(d => d[s.key] || 0),
      backgroundColor: s.color,
    })),
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}; 