'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { analyticsService } from '@/services/analytics';
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
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  EnvelopeIcon,
  CursorArrowRaysIcon,
  UserGroupIcon,
  ChartPieIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState('30'); // days
  const [stats, setStats] = useState<any>({});
  const [timeSeriesData, setTimeSeriesData] = useState<any>([]);
  const [nichePerformance, setNichePerformance] = useState<any>([]);
  const [roiMetrics, setRoiMetrics] = useState<any>({});
  const [userStats, setUserStats] = useState({
    campaignsCount: 0,
    shopifyVerified: false,
  });

  useEffect(() => {
    if (user) {
      loadAnalytics();
    }
    fetchUserStats();
  }, [user, timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [campaignStats, timeSeries, nicheStats, roi] = await Promise.all([
        analyticsService.getUserCampaignStats(user!.uid),
        analyticsService.getTimeSeriesData(user!.uid, parseInt(timeRange)),
        analyticsService.getNichePerformance(user!.uid),
        analyticsService.getROIMetrics(user!.uid),
      ]);

      setStats(campaignStats);
      setTimeSeriesData(timeSeries);
      setNichePerformance(nicheStats);
      setRoiMetrics(roi);
    } catch (error: any) {
      setError(error.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          Authorization: `Bearer ${await user?.getIdToken()}`,
        },
      });
      const data = await response.json();
      setUserStats(data);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const metrics = [
    {
      id: 1,
      name: 'Total Campaigns',
      stat: stats.totalCampaigns || 0,
      icon: EnvelopeIcon,
      change: '12%',
      changeType: 'increase',
    },
    {
      id: 2,
      name: 'Average Open Rate',
      stat: `${(stats.avgOpenRate || 0).toFixed(1)}%`,
      icon: ChartPieIcon,
      change: '2.1%',
      changeType: 'increase',
    },
    {
      id: 3,
      name: 'Click Rate',
      stat: `${(stats.avgClickRate || 0).toFixed(1)}%`,
      icon: CursorArrowRaysIcon,
      change: '3.2%',
      changeType: 'decrease',
    },
    {
      id: 4,
      name: 'Active Subscribers',
      stat: stats.activeCount || 0,
      icon: UserGroupIcon,
      change: '5%',
      changeType: 'increase',
    },
  ];

  const timeSeriesOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Campaign Performance Over Time',
      },
    },
  };

  const timeSeriesChartData = {
    labels: timeSeriesData.map((d: any) => d.date),
    datasets: [
      {
        label: 'Sent',
        data: timeSeriesData.map((d: any) => d.sent),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
      {
        label: 'Opens',
        data: timeSeriesData.map((d: any) => d.opens),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: 'Clicks',
        data: timeSeriesData.map((d: any) => d.clicks),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  };

  const nicheChartData = {
    labels: nichePerformance.map((n: any) => n.niche),
    datasets: [
      {
        label: 'Open Rate by Niche',
        data: nichePerformance.map((n: any) => n.avgOpenRate),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };

  // Show placeholder state for new users
  if (!userStats.shopifyVerified || userStats.campaignsCount === 0) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <ChartBarIcon className="h-8 w-8 text-indigo-600" />
            <h2 className="text-lg font-medium text-gray-900">Campaign Analytics</h2>
          </div>
          
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
              <InformationCircleIcon className="h-8 w-8 text-indigo-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-500 max-w-sm mx-auto mb-6">
              {!userStats.shopifyVerified 
                ? 'Connect your Shopify store to start tracking campaign analytics.'
                : 'Create and run your first campaign to start seeing analytics data.'}
            </p>
            <div className="space-y-4">
              {!userStats.shopifyVerified && (
                <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                  <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-4">
                    1
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-medium text-gray-900">Connect Your Shopify Store</h4>
                    <p className="text-sm text-gray-500">Import your products and verify your store</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg max-w-md mx-auto">
                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 mr-4">
                  {userStats.shopifyVerified ? '1' : '2'}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-gray-900">Create Your First Campaign</h4>
                  <p className="text-sm text-gray-500">Launch a campaign to start collecting data</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Example Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Open Rate</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-400">--</p>
                  <p className="text-sm text-gray-400 ml-2">No data yet</p>
                </div>
              </div>
              <EnvelopeIcon className="h-8 w-8 text-gray-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Click Rate</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-400">--</p>
                  <p className="text-sm text-gray-400 ml-2">No data yet</p>
                </div>
              </div>
              <ArrowTrendingUpIcon className="h-8 w-8 text-gray-200" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-400">--</p>
                  <p className="text-sm text-gray-400 ml-2">No data yet</p>
                </div>
              </div>
              <UserGroupIcon className="h-8 w-8 text-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-sm text-gray-700">
          Track your email campaign performance and ROI metrics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="mb-6">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Stats Grid */}
      <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((item) => (
          <div
            key={item.id}
            className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-indigo-500 p-3">
                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">{item.stat}</p>
              <p
                className={classNames(
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                  'ml-2 flex items-baseline text-sm font-semibold'
                )}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon className="h-5 w-5 flex-shrink-0 self-center text-green-500" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 flex-shrink-0 self-center text-red-500" />
                )}
                <span className="ml-1">{item.change}</span>
              </p>
            </dd>
          </div>
        ))}
      </dl>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Time Series Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Line options={timeSeriesOptions} data={timeSeriesChartData} />
        </div>

        {/* Niche Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <Bar
            options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'top' as const,
                },
                title: {
                  display: true,
                  text: 'Performance by Niche',
                },
              },
            }}
            data={nicheChartData}
          />
        </div>
      </div>

      {/* ROI Metrics */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ROI Metrics</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Total Spent</p>
            <p className="mt-1 text-xl font-semibold">${roiMetrics.totalSpent || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Emails Sent</p>
            <p className="mt-1 text-xl font-semibold">{roiMetrics.emailsSent || 0}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Cost per Email</p>
            <p className="mt-1 text-xl font-semibold">
              ${(roiMetrics.costPerEmail || 0).toFixed(3)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500">Engagement Rate</p>
            <p className="mt-1 text-xl font-semibold">
              {(roiMetrics.engagementRate || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsPage;