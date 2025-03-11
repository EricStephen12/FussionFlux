'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { firestoreService } from '@/services/firestore';
import Link from 'next/link';
import {
  EnvelopeIcon,
  ChartBarIcon,
  CogIcon,
  PlusIcon,
  CreditCardIcon,
  UserGroupIcon,
  ShoppingCartIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  BoltIcon,
} from '@heroicons/react/24/outline';
import TrialStatus from '@/components/TrialStatus';
import { LineChart, BarChart } from '@/components/charts';
import { User } from '@/types/user';
import LeadManager from '@/components/leads/LeadManager';

interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  icon: any;
}

interface DashboardStats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalEmails: number;
  openRate: number;
  subscribers: number;
  revenue: number;
  revenueGrowth: number;
  conversionRate: number;
  adSpend: number;
  costPerLead: number;
}

interface PerformanceData {
  daily: Array<{
    date: string;
    opens: number;
    clicks: number;
    conversions: number;
  }>;
  weekly: Array<{
    date: string;
    revenue: number;
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const customUser = user as User | null;
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalEmails: 0,
    openRate: 0,
    subscribers: 0,
    revenue: 0,
    revenueGrowth: 0,
    conversionRate: 0,
    adSpend: 0,
    costPerLead: 0,
  });
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    daily: [],
    weekly: [],
  });

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        const [dashboardStats, activity, performance] = await Promise.all([
          firestoreService.getDashboardStats(user.uid),
          firestoreService.getRecentActivity(user.uid),
          firestoreService.getPerformanceData(user.uid),
        ]);
        
        setStats(dashboardStats as DashboardStats);
        setRecentActivity(activity as ActivityItem[] || []);
        setPerformanceData(performance as PerformanceData || { daily: [], weekly: [] });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const quickActions = [
    {
      name: 'New Campaign',
      href: '/dashboard/campaigns/new',
      icon: PlusIcon,
      description: 'Create a new email campaign',
      status: null,
    },
    
    {
      name: 'Analytics',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
      description: 'View your campaign performance',
      status: null,
    },
    {
      name: 'Billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
      description: 'Manage your subscription and billing',
      status: customUser?.subscription?.status === 'trial' ? 'warning' : null,
    },
    {
      name: 'Referrals',
      href: '/dashboard/referrals',
      icon: UserGroupIcon,
      description: 'Invite friends and earn rewards',
      status: 'new',
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-2/4 mb-8"></div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="sm:flex sm:items-center sm:justify-between pb-6 border-b border-gray-200">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <div className="mt-4 sm:mt-0">
          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.activeCampaigns}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Subscribers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.subscribers.toLocaleString()}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Open Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats.openRate}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">${stats.revenue.toLocaleString()}</div>
                    <p className={`ml-2 flex items-baseline text-sm font-semibold ${
                      stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <ArrowTrendingUpIcon className="self-center flex-shrink-0 h-4 w-4 text-green-500" aria-hidden="true" />
                      <span className="sr-only">{stats.revenueGrowth >= 0 ? 'Increased by' : 'Decreased by'}</span>
                      {Math.abs(stats.revenueGrowth)}%
                    </p>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Email Performance</h3>
          <div className="h-[300px]">
            <LineChart
              data={performanceData.daily}
              xKey="date"
              series={[
                { key: 'opens', name: 'Opens', color: '#4F46E5' },
                { key: 'clicks', name: 'Clicks', color: '#10B981' },
                { key: 'conversions', name: 'Conversions', color: '#F59E0B' },
              ]}
            />
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Weekly Revenue</h3>
          <div className="h-[300px]">
            <BarChart
              data={performanceData.weekly}
              xKey="date"
              series={[
                { key: 'revenue', name: 'Revenue', color: '#4F46E5' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Quick Actions</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions?.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-gray-400 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0">
                  <action.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
                {action.status === 'warning' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Trial
                  </span>
                )}
                {action.status === 'new' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Recent Activity</h3>
          <div className="flow-root mt-6">
            <ul role="list" className="-mb-8">
              {(recentActivity || []).map((item, itemIdx) => (
                <li key={item.id}>
                  <div className="relative pb-8">
                    {itemIdx !== recentActivity.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          <item.icon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            {item.title} <span className="font-medium text-gray-900">{item.description}</span>
                          </p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleDateString()}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}