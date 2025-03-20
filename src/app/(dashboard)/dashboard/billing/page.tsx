// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { ArrowPathIcon, CheckCircleIcon, XCircleIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
  const [showCancellationInfo, setShowCancellationInfo] = useState(false);
  const [showCancellationConfirm, setShowCancellationConfirm] = useState(false);
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
        setShowCancellationConfirm(false);
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

  const handlePurchaseExtraCredits = (type: 'leads' | 'sms' | 'emails') => {
    router.push(`/dashboard/credits?type=${type}`);
  };

  const handleCancelSubscription = () => {
    setShowCancellationConfirm(true);
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
  const isFreeUser = currentTier === 'free';
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
                <p className="text-sm text-gray-500 mt-1">
                  {isFreeUser 
                    ? "Trial expires: " + (subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Not available')
                    : "Next billing date: " + (subscription?.nextBillingDate ? new Date(subscription.nextBillingDate).toLocaleDateString() : 'Not available')
                  }
                </p>
              </div>
              
              {isFreeUser && (
                <button
                  onClick={() => router.push('/dashboard/subscription')}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition duration-150"
                >
                  Upgrade Plan
                </button>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-medium text-gray-700">Usage Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Email Credits</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription?.usageStats?.usedEmails || 0} / {tierInfo?.maxEmails || 0}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${((subscription?.usageStats?.usedEmails || 0) / (tierInfo?.maxEmails || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Lead Credits</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription?.usageStats?.usedLeads || 0} / {tierInfo?.maxContacts || 0}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${((subscription?.usageStats?.usedLeads || 0) / (tierInfo?.maxContacts || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">SMS Credits</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {subscription?.usageStats?.usedSMS || 0} / {tierInfo?.maxSMS || 0}
                  </p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${((subscription?.usageStats?.usedSMS || 0) / (tierInfo?.maxSMS || 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods - Only show for paid tiers */}
            {!isFreeUser && (
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img src="/payment-methods/credit-card.svg" alt="Credit Card" className="h-8 w-8 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Credit Card</p>
                        <p className="text-xs text-gray-500">Ending in 4242</p>
                      </div>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">Update</button>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img src="/payment-methods/paypal.svg" alt="PayPal" className="h-8 w-8 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">PayPal</p>
                        <p className="text-xs text-gray-500">Connected</p>
                      </div>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-800">Manage</button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Billing History - Only show for paid tiers */}
          {!isFreeUser && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Billing History</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Add billing history rows here */}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => handlePurchaseExtraCredits('leads')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra Leads
              </button>
              <button
                onClick={() => handlePurchaseExtraCredits('sms')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra SMS
              </button>
              <button
                onClick={() => handlePurchaseExtraCredits('emails')}
                className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
              >
                Purchase Extra Emails
              </button>

              {isFreeUser ? (
                <button
                  onClick={() => router.push('/dashboard/subscription')}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  Upgrade to Paid Plan
                </button>
              ) : (
                <button
                  onClick={handleCancelSubscription}
                  className="w-full inline-flex items-center justify-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>

          {/* Support */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h2>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/support')}
                className="block text-sm text-indigo-600 hover:text-indigo-800 text-left"
              >
                Contact Support
              </button>
              <button
                onClick={() => router.push('/faq')}
                className="block text-sm text-indigo-600 hover:text-indigo-800 text-left"
              >
                FAQ
              </button>
              <button
                onClick={() => router.push('/docs')}
                className="block text-sm text-indigo-600 hover:text-indigo-800 text-left"
              >
                Documentation
              </button>
              <button
                onClick={() => setShowCancellationInfo(true)}
                className="block text-sm text-indigo-600 hover:text-indigo-800 text-left"
              >
                Learn about our cancellation policy
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Message Toast */}
      {successMessage && (
        <div className="fixed bottom-4 right-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg shadow-lg">
          {successMessage}
        </div>
      )}

      {/* Cancellation Info Modal */}
      {showCancellationInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Cancellation & Refund Policy</h3>
              <button 
                onClick={() => setShowCancellationInfo(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                When you cancel your subscription:
              </p>
              <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                <li>Your subscription remains active until the end of your current billing period.</li>
                <li>You won't be charged for the next billing cycle.</li>
                <li>You'll lose access to premium features once your current billing period ends.</li>
                <li>Any unused credits will expire at the end of your billing period.</li>
                <li>We offer a 7-day refund for new subscriptions if you're not satisfied with our service.</li>
              </ul>
              <p className="text-sm text-gray-600">
                For refund requests, please contact our support team with your account details.
              </p>
            </div>
            <div className="mt-6">
              <button
                onClick={() => setShowCancellationInfo(false)}
                className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {showCancellationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Confirm Cancellation</h3>
              <button 
                onClick={() => setShowCancellationConfirm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to cancel your subscription? Your subscription will remain active until the end of your current billing period.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancellationConfirm(false)}
                className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                No, Keep My Plan
              </button>
              <button
                onClick={() => handleDowngrade(currentTier)}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Yes, Cancel Subscription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}