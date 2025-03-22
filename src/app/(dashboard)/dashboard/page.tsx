// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
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
  XMarkIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  MegaphoneIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
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
  const { subscription, checkFeatureAccess } = useSubscription();
  const customUser = user as User | null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
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
  const [tips, setTips] = useState<string[]>([
    "Try A/B testing subject lines to improve open rates",
    "Segment your audience for more targeted campaigns",
    "Send campaigns at optimal times when your audience is most active",
    "Personalize your emails to increase engagement"
  ]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Check if it's a new user
        const userData = await firestoreService.getUserDocument(user.uid);
        if (userData?.isNewUser) {
          setShowWelcomeTour(true);
          // Update user document to indicate tour has been shown
          await firestoreService.updateUserDocument(user.uid, { isNewUser: false });
        }

        const [dashboardStats, activity, performance] = await Promise.all([
          firestoreService.getDashboardStats(user.uid).catch(e => {
            console.error('Error fetching dashboard stats:', e);
            return null;
          }),
          firestoreService.getRecentActivity(user.uid).catch(e => {
            console.error('Error fetching activity:', e);
            return [];
          }),
          firestoreService.getPerformanceData(user.uid).catch(e => {
            console.error('Error fetching performance data:', e);
            return { daily: [], weekly: [] };
          }),
        ]);
        
        if (dashboardStats) {
          setStats(dashboardStats as DashboardStats);
        }
        
        setRecentActivity(activity as ActivityItem[] || []);
        setPerformanceData(performance as PerformanceData || { daily: [], weekly: [] });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Unable to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [user]);

  const quickActions = [
    {
      name: 'Create Campaign',
      description: 'Start a new email campaign',
      href: '/dashboard/campaigns/new',
      icon: MegaphoneIcon,
    },
    {
      name: 'View Analytics',
      description: 'Check your campaign performance',
      href: '/dashboard/analytics',
      icon: ChartBarIcon,
    },
    {
      name: 'Billing',
      description: 'Manage your subscription and billing',
      href: '/dashboard/billing',
      icon: CreditCardIcon,
    },
    {
      name: 'Settings',
      description: 'Manage your account settings',
      href: '/dashboard/settings',
      icon: Cog6ToothIcon,
    },
  ];

  const dismissTour = () => {
    setShowWelcomeTour(false);
  };

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
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <XMarkIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Tour/Modal for New Users */}
      {showWelcomeTour && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Welcome to Your Dashboard!</h2>
              <button onClick={dismissTour} className="text-gray-400 hover:text-gray-500">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-gray-600">Here's a quick tour to get you started:</p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <ChartBarIcon className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
                  <span className="text-sm">Track your campaign performance with analytics</span>
                </li>
                <li className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
                  <span className="text-sm">Create and manage email campaigns</span>
                </li>
                <li className="flex items-start">
                  <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-2 mt-0.5" />
                  <span className="text-sm">Invite friends and earn credits through referrals</span>
                </li>
              </ul>
              <div className="bg-indigo-50 p-3 rounded-md text-sm text-indigo-700 flex items-start">
                <InformationCircleIcon className="h-5 w-5 text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
                <span>Your free trial is active. Explore all features before deciding on a subscription plan.</span>
              </div>
              <button
                onClick={dismissTour}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 mt-2"
              >
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="sm:flex sm:items-center sm:justify-between pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back, {user?.displayName || 'there'}! Here's an overview of your account.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          {/* Subscription Badge */}
          <div className="bg-gray-100 rounded-full px-3 py-1 text-xs font-medium flex items-center">
            <span className="mr-1.5">Current Plan:</span>
            <span className={`${
              subscription?.tier === 'pro' ? 'text-purple-700' :
              subscription?.tier === 'growth' ? 'text-indigo-700' :
              subscription?.tier === 'starter' ? 'text-blue-700' :
              'text-yellow-700'
            }`}>
              {subscription?.tier === 'free' ? 'Free Trial' : 
               subscription?.tier === 'starter' ? 'Starter' :
               subscription?.tier === 'growth' ? 'Growth' :
               subscription?.tier === 'pro' ? 'Pro' : 'Free'}
            </span>
          </div>

          <Link
            href="/dashboard/campaigns/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            New Campaign
          </Link>
        </div>
      </div>

      {/* Trial Status Banner (if applicable) */}
      {subscription?.tier === 'free' && subscription?.expiresAt && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <InformationCircleIcon className="h-5 w-5 text-amber-500" aria-hidden="true" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-amber-800">Trial Status</h3>
              <div className="mt-1 text-sm text-amber-700">
                <p>
                  {new Date(subscription.expiresAt) > new Date() ? (
                    <>Your free trial expires in <span className="font-medium">{Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days</span>.</>
                  ) : (
                    <>Your free trial has expired. Upgrade to continue using premium features.</>
                  )}
                </p>
              </div>
              <div className="mt-2">
                <Link
                  href="/dashboard/billing"
                  className="text-sm font-medium text-amber-800 hover:text-amber-600"
                >
                  View Subscription Options <span aria-hidden="true">&rarr;</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EnvelopeIcon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats?.activeCampaigns || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-2">
            <Link href="/dashboard/campaigns" className="text-sm text-indigo-600 hover:text-indigo-900">View all campaigns</Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Subscribers</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats?.subscribers?.toLocaleString() || '0'}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-2">
            <Link href="/dashboard/contacts" className="text-sm text-indigo-600 hover:text-indigo-900">Manage contacts</Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg transition-all duration-200 hover:shadow-md">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-400" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg. Open Rate</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">{stats?.openRate || 0}%</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-2">
            <Link href="/dashboard/analytics" className="text-sm text-indigo-600 hover:text-indigo-900">View analytics</Link>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow-sm rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
              Coming Soon
            </span>
          </div>
          <div className="px-4 py-3 sm:p-6">
            <div className="text-lg text-gray-600">Revenue tracking will be available in a future update</div>
          </div>
          <div className="px-4 py-4 sm:px-6 bg-gray-50">
            <div className="text-sm">
              <Link href="/dashboard/analytics" className="text-sm text-indigo-600 hover:text-indigo-900">Learn more</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Pro Tip Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <LightBulbIcon className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-900">Pro Tip</h3>
            <p className="mt-1 text-sm text-gray-600">{tips[Math.floor(Math.random() * tips.length)]}</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Email Performance</h3>
          {performanceData.daily.length > 0 ? (
            <div className="h-[300px]">
              <LineChart
                data={performanceData.daily}
                xKey="date"
                series={[
                  { key: 'opens', name: 'Opens', color: '#4F46E5' },
                  { key: 'clicks', name: 'Clicks', color: '#10B981' },
                ]}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center flex-col">
              <ChartBarIcon className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No data available yet</p>
              <p className="text-gray-400 text-xs mt-1">Send your first campaign to see performance data</p>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Weekly Revenue</h3>
          {performanceData.weekly.length > 0 ? (
            <div className="h-[300px]">
              <BarChart
                data={performanceData.weekly}
                xKey="date"
                series={[
                  { key: 'revenue', name: 'Revenue', color: '#4F46E5' },
                ]}
              />
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center flex-col">
              <ShoppingCartIcon className="h-12 w-12 text-gray-300 mb-2" />
              <p className="text-gray-500 text-sm">No revenue data available yet</p>
              <p className="text-gray-400 text-xs mt-1">Connect your shop to track revenue</p>
            </div>
          )}
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
                className="relative rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm flex items-center space-x-3 hover:border-indigo-400 hover:bg-indigo-50 transition-all duration-200 focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
              >
                <div className="flex-shrink-0 bg-indigo-100 rounded-md p-2">
                  <action.icon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="absolute inset-0" aria-hidden="true" />
                  <p className="text-sm font-medium text-gray-900">{action.name}</p>
                  <p className="text-sm text-gray-500">{action.description}</p>
                </div>
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
            {recentActivity && recentActivity.length > 0 ? (
              <ul role="list" className="-mb-8">
                {recentActivity.map((item, itemIdx) => (
                  <li key={item.id}>
                    <div className="relative pb-8">
                      {itemIdx !== recentActivity.length - 1 ? (
                        <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center ring-8 ring-white">
                            <item.icon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
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
            ) : (
              <div className="text-center py-12">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-300" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first campaign to see activity here
                </p>
              </div>
            )}
          </div>
          {recentActivity && recentActivity.length > 0 && (
            <div className="mt-6 text-center">
              <Link href="/dashboard/activity" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                View all activity
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">Need Help?</h3>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <QuestionMarkCircleIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Documentation</h4>
                  <p className="mt-1 text-sm text-gray-500">Find guides, tutorials and API reference</p>
                  <Link href="/docs" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    View documentation
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <CogIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Settings</h4>
                  <p className="mt-1 text-sm text-gray-500">Configure your account preferences</p>
                  <Link href="/dashboard/settings" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Go to settings
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BoltIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-gray-900">Support</h4>
                  <p className="mt-1 text-sm text-gray-500">Contact our support team for help</p>
                  <Link href="/support" className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Get support
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}