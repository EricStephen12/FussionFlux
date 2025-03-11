'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { referralService } from '@/services/referral';
import { 
  ClipboardIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function ReferralsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get or generate referral code
      const code = await referralService.getReferralCode(user!.uid);
      if (!code) {
        const newCode = await referralService.generateReferralCode(user!.uid);
        setReferralCode(newCode.code);
      } else {
        setReferralCode(code.code);
      }

      // Get affiliate stats
      const affiliateStats = await referralService.getAffiliateStats(user!.uid);
      setStats(affiliateStats);
    } catch (error: any) {
      setError(error.message || 'Failed to load referral data');
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!referralCode) return;
    
    try {
      const referralLink = `${window.location.origin}/login?ref=${referralCode}`;
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Affiliate Program</h1>
        <p className="mt-2 text-sm text-gray-700">
          Earn money by referring new users to our platform
        </p>
      </div>

      {/* Referral Link Section */}
      <div className="bg-white shadow sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Your Referral Link
          </h3>
          <div className="mt-5">
            <div className="flex">
              <input
                type="text"
                readOnly
                value={referralCode ? `${window.location.origin}/login?ref=${referralCode}` : ''}
                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-l-md border border-r-0 border-gray-300 text-gray-900 sm:text-sm"
              />
              <button
                onClick={handleCopyCode}
                className="relative inline-flex items-center px-4 py-2 border border-l-0 border-gray-300 text-sm font-medium rounded-r-md text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {copied ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-5 w-5 text-gray-400" />
                )}
                <span className="ml-2">{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Share this link with potential users. You'll earn commission when they subscribe.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 lg:grid-cols-3 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Referrals
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalReferrals}
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
                  <ChartBarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Conversion Rate
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.conversionRate.toFixed(1)}%
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
                  <CurrencyDollarIcon className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Credits Earned
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">
                      {stats.totalEmailCredits} emails<br/>
                      {stats.totalSMSCredits} SMS<br/>
                      {stats.totalLeadCredits} leads
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {stats && stats.recentTransactions && stats.recentTransactions.length > 0 && (
        <div className="bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Recent Rewards
            </h3>
          </div>
          <div className="border-t border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SMS Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lead Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentTransactions.map((transaction: any) => (
                    <tr key={transaction.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(transaction.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.emailCredits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.smsCredits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.leadCredits}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reward Structure */}
      <div className="mt-8 bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Reward Structure
          </h3>
          <div className="mt-5 text-sm text-gray-600">
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Free Tier (0-2 referrals):</strong>
                <ul className="list-none pl-5 pt-1">
                  <li>• 100 Email Credits</li>
                  <li>• 50 SMS Credits</li>
                  <li>• 25 Lead Credits</li>
                </ul>
              </li>
              <li><strong>Starter Tier (3-9 referrals):</strong>
                <ul className="list-none pl-5 pt-1">
                  <li>• 250 Email Credits</li>
                  <li>• 100 SMS Credits</li>
                  <li>• 50 Lead Credits</li>
                </ul>
              </li>
              <li><strong>Grower Tier (10-24 referrals):</strong>
                <ul className="list-none pl-5 pt-1">
                  <li>• 500 Email Credits</li>
                  <li>• 200 SMS Credits</li>
                  <li>• 100 Lead Credits</li>
                </ul>
              </li>
              <li><strong>Pro Tier (25+ referrals):</strong>
                <ul className="list-none pl-5 pt-1">
                  <li>• 1000 Email Credits</li>
                  <li>• 500 SMS Credits</li>
                  <li>• 250 Lead Credits</li>
                </ul>
              </li>
              <li className="pt-2">Credits are instantly added to your account upon successful referral</li>
              <li>Track your rewards and referrals in real-time</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
