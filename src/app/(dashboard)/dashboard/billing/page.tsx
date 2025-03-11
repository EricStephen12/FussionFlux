'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { firestoreService } from '@/services/firestore';
import { paymentService } from '@/services/payment';
import { useRouter } from 'next/navigation';

export default function BillingHistoryPage() {
  const { user } = useAuth();
  const { subscription, isLoading: subscriptionLoading, subscriptionTiers } = useSubscription();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('flutterwave');
  const router = useRouter();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!user) {
        setError('Please sign in to view billing information.');
        return;
      }

      const userData = await firestoreService.getUserData(user.uid);
      
      if (!userData) {
        await firestoreService.initializeUserData(user.uid, {
          subscriptionData: {
            tier: 'free',
            status: 'trial',
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            usageStats: {
              usedEmails: 0,
              usedLeads: 0,
              usedSMS: 0
            }
          }
        });
      }

      setError('');
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Unable to access billing information. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (targetTier: string) => {
    try {
      setLoading(true);
      setError('');
      
      const plan = subscriptionTiers[targetTier];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      let paymentResult;
      switch (selectedPaymentMethod) {
        case 'flutterwave':
          paymentResult = await paymentService.initializeFlutterwave(plan, user?.email || '');
          break;
        case 'paypal':
          paymentResult = await paymentService.initializePayPal(plan);
          break;
        case 'nowpayments':
          paymentResult = await paymentService.initializePayment({
            amount: plan.price,
            planId: targetTier,
            interval: 'monthly',
            userId: user!.uid,
            currency: 'USD'
          });
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (paymentResult.success && paymentResult.paymentUrl) {
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error(paymentResult.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (targetTier: string) => {
    try {
      setLoading(true);
      setError('');

      const success = await paymentService.downgradeSubscription(user!.uid);
      if (success) {
        setSuccessMessage('Successfully downgraded subscription. Changes will take effect at the end of your billing period.');
      } else {
        throw new Error('Failed to downgrade subscription');
      }
    } catch (error) {
      console.error('Downgrade error:', error);
      setError('Failed to downgrade subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseExtraCredits = (type: 'leads' | 'sms') => {
    router.push(`/dashboard/credits?type=${type}`);
  };

  const formatFeatureName = (feature: string): string => {
    const featureNames: Record<string, string> = {
      followUpEmails: 'Automated Follow-up Emails',
      abTesting: 'A/B Testing',
      aiOptimization: 'AI-Powered Optimization',
      analytics: 'Advanced Analytics',
      customDomain: 'Custom Domain',
      previewLeads: 'Lead Preview',
      importContacts: 'Import Contacts',
      fullLeadAccess: 'Full Lead Database Access',
      bulkOperations: 'Bulk Operations'
    };
    return featureNames[feature] || feature.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
  };

  if (loading || subscriptionLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <ArrowPathIcon className="h-8 w-8 text-gray-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const tierInfo = subscriptionTiers[currentTier];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your subscription and view payment history
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subscription Status */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Plan</h2>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xl font-bold text-gray-900">{tierInfo?.name || 'Free Trial'}</p>
                <p className="text-sm text-gray-500">
                  Status: <span className="capitalize">{subscription?.status || 'trial'}</span>
                </p>
                {subscription?.status === 'active' && (
                  <p className="text-sm text-gray-500">
                    ${tierInfo?.price}/month
                  </p>
                )}
                  </div>
              
              {/* Upgrade/Downgrade Options */}
              {subscription?.status === 'active' ? (
                <div className="flex space-x-4">
                  {currentTier !== 'pro' && (
                    <button
                      onClick={() => router.push('/dashboard/subscription')}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      <ArrowUpIcon className="h-4 w-4 mr-2" />
                      Upgrade
                    </button>
                  )}
                  {currentTier !== 'starter' && (
                    <button
                      onClick={() => handleDowngrade('starter')}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <ArrowDownIcon className="h-4 w-4 mr-2" />
                      Downgrade
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => router.push('/dashboard/subscription')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Upgrade Plan
                </button>
              )}
                </div>

            {/* Usage Stats */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Email Credits</span>
                  <span className="text-gray-900 font-medium">
                    {subscription?.usageStats?.usedEmails || 0} / {tierInfo?.maxEmails || 0}
                  </span>
                  </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                    className="bg-indigo-600 h-2 rounded-full"
                        style={{
                      width: `${((subscription?.usageStats?.usedEmails || 0) / (tierInfo?.maxEmails || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Lead Credits</span>
                  <span className="text-gray-900 font-medium">
                    {subscription?.usageStats?.usedLeads || 0} / {tierInfo?.maxContacts || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{
                      width: `${((subscription?.usageStats?.usedLeads || 0) / (tierInfo?.maxContacts || 1)) * 100}%`
                    }}
                      />
                    </div>
                  </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">SMS Credits</span>
                  <span className="text-gray-900 font-medium">
                    {subscription?.usageStats?.usedSMS || 0} / {tierInfo?.maxSMS || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-600 h-2 rounded-full"
                    style={{
                      width: `${((subscription?.usageStats?.usedSMS || 0) / (tierInfo?.maxSMS || 1)) * 100}%`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Plan Features</h3>
              <ul className="mt-4 space-y-3">
                {Object.entries(tierInfo?.features || {}).map(([feature, enabled]) => (
                  <li key={feature} className="flex items-start">
                    {enabled ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-300 mr-2 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={enabled ? 'text-gray-900' : 'text-gray-500'}>
                      {formatFeatureName(feature)}
                      {feature === 'followUpEmails' && enabled && (
                        <span className="block text-xs text-gray-500">
                          Automate your follow-up sequences
                        </span>
                      )}
                      {feature === 'aiOptimization' && enabled && (
                        <span className="block text-xs text-gray-500">
                          AI-powered subject lines and content optimization
                        </span>
                      )}
                      {feature === 'analytics' && enabled && (
                        <span className="block text-xs text-gray-500">
                          Detailed campaign performance metrics and insights
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Purchase Extra Credits */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase Extra Credits</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={() => router.push('/dashboard/credits?type=leads')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra Leads
              </button>
              <button
                onClick={() => router.push('/dashboard/credits?type=sms')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra SMS
              </button>
              <button
                onClick={() => router.push('/dashboard/credits?type=emails')}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra Emails
              </button>
            </div>
          </div>
        </div>

        {/* Trial/Payment Section */}
        <div className="lg:col-span-1">
          {subscription?.status === 'trial' ? (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trial Status</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Trial Period</p>
                  <p className="text-base font-medium text-gray-900">
                    Ends on {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Not available'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Remaining</p>
                  <p className="text-base font-medium text-gray-900">
                    {subscription.expiresAt
                      ? Math.max(0, Math.ceil((new Date(subscription.expiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
                      : 0} days
                  </p>
              </div>
                <button
                  onClick={() => router.push('/dashboard/subscription')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                >
                  Upgrade to Premium
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Extra Credits Pricing</h2>
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <p className="text-sm font-medium text-gray-900">Email Credits</p>
                  <p className="text-sm text-gray-500">
                    ${(tierInfo?.extraEmailPrice || 0) * 1000} per 1,000 emails
                  </p>
          </div>
                <div className="border-b pb-4">
                  <p className="text-sm font-medium text-gray-900">SMS Credits</p>
                  <p className="text-sm text-gray-500">
                    ${tierInfo?.extraSMSPrice} per SMS
                  </p>
      </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Lead Credits</p>
                  <p className="text-sm text-gray-500">
                    ${tierInfo?.extraLeadsPrice} per lead
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}
    </div>
  );
}