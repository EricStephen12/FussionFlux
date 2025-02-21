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

interface User {
  uid: string;
  email: string;
  shopifyConnected: boolean;
  subscription?: {
    status: 'trial' | 'active' | 'expired';
    plan: string;
    endDate: Date;
  };
}

export default function DashboardPage() {
  const { user } = useAuth();
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
        setRecentActivity(activity as ActivityItem[]);
        setPerformanceData(performance as PerformanceData);
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
      status: (user as User)?.subscription?.status === 'trial' ? 'warning' : null,
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
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-700">
              Welcome back! Here's an overview of your email marketing performance.
            </p>
          </div>
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

        {/* Trial Status */}
        {user?.subscription?.status === 'trial' && (
          <div className="mt-6">
            <TrialStatus />
          </div>
        )}

        {/* Stats Grid */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EnvelopeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeCampaigns}</dd>
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
                    <dd className="text-lg font-medium text-gray-900">{stats.subscribers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Conversion Rate</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.conversionRate}%</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Revenue Growth</dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth}%
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Performance</h3>
            <LineChart
              data={performanceData.daily}
              height={240}
              categories={['Opens', 'Clicks', 'Conversions']}
            />
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Trend</h3>
            <BarChart
              data={performanceData.weekly}
              height={240}
              categories={['Revenue']}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                href={action.href}
                className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500 rounded-lg shadow-sm hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="rounded-lg inline-flex p-3 bg-indigo-50 text-indigo-700 ring-4 ring-white">
                    <action.icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  {action.status && (
                    <span className={`
                      inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                      ${action.status === 'connected' && 'bg-green-100 text-green-800'}
                    
                      ${action.status === 'warning' && 'bg-red-100 text-red-800'}
                      ${action.status === 'new' && 'bg-blue-100 text-blue-800'}
                    `}>
                      {action.status === 'connected' && 'Connected'}
                    
                      {action.status === 'warning' && 'Trial Ending Soon'}
                      {action.status === 'new' && 'New'}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-medium">
                    <span className="absolute inset-0" aria-hidden="true" />
                    {action.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    {action.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
       
      </div>
    </div>
  );
}