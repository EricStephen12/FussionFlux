// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { referralService } from '@/services/referral';
import { toast } from 'react-hot-toast';
import { 
  ClipboardIcon, 
  UserGroupIcon, 
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ShareIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

export default function ReferralsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [stats, setStats] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [copySuccessMessage, setCopySuccessMessage] = useState('');

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
        toast.success('New referral code generated!');
      } else {
        setReferralCode(code.code);
      }

      // Get referral stats
      const referralStats = await referralService.getReferralStats(user!.uid);
      setStats(referralStats);
    } catch (error: any) {
      setError('Unable to load referral data. Please try again later.');
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${referralCode}`);
      setCopied(true);
      setCopySuccessMessage('Referral link copied!');
      toast.success('Referral link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setCopySuccessMessage('');
      }, 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast.error('Failed to copy link. Please try again.');
    }
  };

  const handleShareReferral = () => {
    const referralUrl = `${window.location.origin}/signup?ref=${referralCode}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Join my network on Dropship Email Platform',
        text: 'Sign up using my referral link and get bonus credits!',
        url: referralUrl,
      })
      .then(() => toast.success('Thanks for sharing!'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      handleCopyCode();
    }
  };

  // Calculate progress to next tier
  const calculateProgress = () => {
    const totalReferrals = stats?.totalReferrals || 0;
    const nextTier = {
      tier: 'Starter',
      required: 5,
      progress: 0
    };
    
    if (totalReferrals < 5) {
      nextTier.tier = 'Starter';
      nextTier.required = 5;
      nextTier.progress = (totalReferrals / 5) * 100;
    } else if (totalReferrals < 15) {
      nextTier.tier = 'Growth';
      nextTier.required = 15;
      nextTier.progress = ((totalReferrals - 5) / 10) * 100;
    } else {
      nextTier.tier = 'Pro';
      nextTier.required = 30;
      nextTier.progress = ((totalReferrals - 15) / 15) * 100;
      if (nextTier.progress > 100) nextTier.progress = 100;
    }
    
    return nextTier;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  const nextTier = calculateProgress();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
          <button 
            onClick={loadReferralData}
            className="ml-3 bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium hover:bg-red-200"
          >
            Retry
          </button>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Referral Program</h1>
        <p className="mt-2 text-sm text-gray-600">
          Invite friends to join and earn email and SMS credits for each successful referral
        </p>
      </div>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-500 rounded-lg shadow-lg mb-8 overflow-hidden">
        <div className="p-8 text-white">
          <h2 className="text-xl font-semibold mb-4">Your Personal Referral Link</h2>
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 bg-white bg-opacity-20 rounded-md p-3 backdrop-blur-sm">
              <span className="text-white font-medium">{`${window.location.origin}/signup?ref=${referralCode}`}</span>
            </div>
            <button
              onClick={handleCopyCode}
              className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none"
            >
              {copied ? (
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              ) : (
                <ClipboardIcon className="h-5 w-5" />
              )}
              <span className="ml-2">{copied ? 'Copied!' : 'Copy Link'}</span>
            </button>
            <button
              onClick={handleShareReferral}
              className="inline-flex items-center px-4 py-3 border border-transparent rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none"
            >
              <ShareIcon className="h-5 w-5" />
              <span className="ml-2">Share</span>
            </button>
          </div>
          {copySuccessMessage && (
            <div className="text-sm text-white bg-white bg-opacity-20 px-3 py-1 rounded-full inline-block">
              {copySuccessMessage}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Rewards Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Your Rewards</h2>
          <dl className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Total Referrals
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {stats?.totalReferrals || 0}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                Email Credits Earned
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {stats?.totalEmailCredits || 0}
              </dd>
            </div>
            <div className="px-4 py-5 bg-gray-50 rounded-lg overflow-hidden sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">
                SMS Credits Earned
              </dt>
              <dd className="mt-1 text-3xl font-semibold text-indigo-600">
                {stats?.totalSMSCredits || 0}
              </dd>
            </div>
          </dl>
        </div>

        {/* Next Tier Progress */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Next Tier Progress</h2>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress to {nextTier.tier} Tier</span>
              <span className="text-sm font-medium text-indigo-600">{Math.round(nextTier.progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-indigo-600 h-2.5 rounded-full" 
                style={{ width: `${nextTier.progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {stats?.totalReferrals || 0} of {nextTier.required} referrals needed
            </p>
          </div>
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="font-medium text-indigo-800 text-sm">Reach {nextTier.tier} Tier Benefits:</h3>
            <ul className="mt-2 space-y-1">
              <li className="text-sm text-indigo-700 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-indigo-500" />
                {nextTier.tier === 'Starter' ? '500 Email + 100 SMS Credits per referral' : 
                 nextTier.tier === 'Growth' ? '1000 Email + 250 SMS Credits per referral' : 
                 '2000 Email + 500 SMS Credits per referral'}
              </li>
              <li className="text-sm text-indigo-700 flex items-center">
                <CheckCircleIcon className="h-4 w-4 mr-2 text-indigo-500" />
                {nextTier.tier === 'Starter' ? 'Access to basic templates' : 
                 nextTier.tier === 'Growth' ? 'Access to premium templates' : 
                 'Access to all templates and features'}
              </li>
            </ul>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Rewards</h2>
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email Credits
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SMS Credits
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
                        {transaction.emailCredits || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {transaction.smsCredits || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            'bg-yellow-100 text-yellow-800'}`}>
                          {transaction.status?.charAt(0).toUpperCase() + transaction.status?.slice(1) || 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-lg">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No rewards yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start sharing your referral link to earn rewards!
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleShareReferral}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
                >
                  <ShareIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Share Your Link
                </button>
              </div>
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">How It Works</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                <UserGroupIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-medium text-gray-900">1. Share Your Link</h3>
              <p className="mt-2 text-sm text-gray-500">
                Share your unique referral link with friends and colleagues
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                <ChartBarIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-medium text-gray-900">2. They Sign Up</h3>
              <p className="mt-2 text-sm text-gray-500">
                When they sign up using your link and make their first purchase
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-md bg-indigo-100 text-indigo-600">
                <CurrencyDollarIcon className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-medium text-gray-900">3. Earn Credits</h3>
              <p className="mt-2 text-sm text-gray-500">
                You earn 500 email credits and 100 SMS credits for each referral
              </p>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <a 
              href="/referral-terms" 
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium inline-flex items-center"
            >
              View Referral Program Terms
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
