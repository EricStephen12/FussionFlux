'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { paymentService } from '@/services/payment';
import {
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

export default function SubscriptionPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { subscription, subscriptionTiers } = useSubscription();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'flutterwave' | 'paypal' | 'nowpayments'>('flutterwave');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCancellationInfo, setShowCancellationInfo] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'flutterwave' | 'paypal' | 'nowpayments'>('flutterwave');
  const [selectedCryptoCurrency, setSelectedCryptoCurrency] = useState<string>('BTC');
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'BNB', 'MATIC'];
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [showCryptoPayment, setShowCryptoPayment] = useState(false);
  const [cryptoPaymentDetails, setCryptoPaymentDetails] = useState<{
    address: string;
    amount: number;
    currency: string;
    status: string;
  } | null>(null);

  useEffect(() => {
    if (selectedPaymentMethod === 'paypal' && !paypalLoaded) {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}&currency=USD`;
      script.async = true;
      script.onload = () => setPaypalLoaded(true);
      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    }
  }, [selectedPaymentMethod, paypalLoaded]);

  useEffect(() => {
    if (paypalLoaded && selectedTier && selectedPaymentMethod === 'paypal') {
      const plan = subscriptionTiers[selectedTier];
      // @ts-ignore
      window.paypal?.Buttons({
        createOrder: async () => {
          try {
            const response = await paymentService.initializePayPal(plan);
            if (!response.success) {
              throw new Error(response.error || 'Failed to create PayPal order');
            }
            return response.orderId;
          } catch (error) {
            console.error('PayPal order creation error:', error);
            setError('Failed to create PayPal order. Please try again.');
            throw error;
          }
        },
        onApprove: async (data: any) => {
          try {
            setLoading(true);
            const response = await fetch('/api/payments/paypal/capture', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                orderId: data.orderID,
                planId: selectedTier,
                userId: user?.uid
              })
            });

            if (!response.ok) {
              throw new Error('Failed to capture PayPal payment');
            }

            router.push('/dashboard/billing?success=true');
          } catch (error) {
            console.error('PayPal capture error:', error);
            setError('Failed to complete payment. Please try again.');
          } finally {
            setLoading(false);
          }
        },
        onError: (err: any) => {
          console.error('PayPal error:', err);
          setError('PayPal payment failed. Please try again.');
        }
      }).render('#paypal-button-container');
    }
  }, [paypalLoaded, selectedTier, selectedPaymentMethod]);

  const handleSelectTier = (tierId: string) => {
    if (subscription?.tier === tierId) return;
    console.log('Selected tier:', tierId);
    setSelectedTier(tierId);
  };

  const handleUpgrade = async (tier: string) => {
    try {
      setLoading(true);
      setError('');

      const plan = subscriptionTiers[tier];
      if (!plan) {
        throw new Error('Invalid subscription plan');
      }

      console.log('Starting payment process for tier:', tier);
      console.log('Plan details:', plan);
      console.log('Selected payment method:', selectedPaymentMethod);

      let paymentResult;
      const paymentParams = {
        amount: plan.price,
        planId: tier,
        interval: 'monthly',
        userId: user!.uid,
        currency: 'USD',
        orderId: `${tier}-${Date.now()}`,
        cryptoCurrency: selectedCryptoCurrency
      };

      switch (selectedPaymentMethod) {
        case 'flutterwave':
          console.log('Initializing Flutterwave payment...');
          paymentResult = await paymentService.initializeFlutterwave(plan, user?.email || '');
          break;
        case 'paypal':
          console.log('Initializing PayPal payment...');
          paymentResult = await paymentService.initializePayPal(plan);
          break;
        case 'nowpayments':
          console.log('Initializing NOWPayments payment...');
          paymentResult = await paymentService.initializeNOWPayments(paymentParams);
          break;
        default:
          throw new Error('Invalid payment method');
      }

      console.log('Payment result:', paymentResult);

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment initialization failed');
      }

      if (paymentResult.provider === 'nowpayments' && paymentResult.cryptoDetails) {
        setCryptoPaymentDetails(paymentResult.cryptoDetails);
        setShowCryptoPayment(true);
      } else if (paymentResult.paymentUrl) {
        window.location.href = paymentResult.paymentUrl;
      } else {
        throw new Error('Invalid payment response');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError('Failed to process payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatFeature = (feature: string): string => {
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
    return featureNames[feature] || feature;
  };

  const handlePayment = async () => {
    if (!selectedTier || !selectedPaymentMethod) {
      setError('Please select a subscription tier and payment method');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let paymentResult;

      const paymentParams = {
        amount: selectedTier.price,
        planId: selectedTier.id,
        userId: user.uid,
        orderId: `${selectedTier.id}-${Date.now()}`,
        currency: 'USD'
      };

      switch (selectedPaymentMethod) {
        case 'flutterwave':
          paymentResult = await paymentService.initializeFlutterwave(paymentParams);
          break;
        case 'paypal':
          // PayPal is handled by the PayPal button container
          return;
        case 'crypto':
          paymentResult = await paymentService.initializeNOWPayments({
            ...paymentParams,
            cryptoCurrency: selectedCryptoCurrency || 'BTC'
          });
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (!paymentResult.success) {
        throw new Error(paymentResult.error || 'Payment initialization failed');
      }

      if (paymentResult.paymentUrl) {
        window.location.href = paymentResult.paymentUrl;
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setError(error.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:flex-col sm:align-center mb-12">
        <h1 className="text-5xl font-extrabold text-gray-900 sm:text-center">
          Pricing Plans
          </h1>
        <p className="mt-5 text-xl text-gray-500 sm:text-center">
          Choose the perfect plan for your business
        </p>
        <button
          onClick={() => setShowCancellationInfo(true)}
          className="mt-4 text-sm text-indigo-600 hover:text-indigo-500 flex items-center justify-center gap-1"
        >
          <InformationCircleIcon className="h-5 w-5" />
          View Cancellation & Refund Policy
        </button>
      </div>

      <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0 xl:grid-cols-4">
        {Object.entries(subscriptionTiers).map(([tierId, tier]) => (
          <div
            key={tierId}
            className={`rounded-lg shadow-sm divide-y divide-gray-200 ${
              tier.popular ? 'border-2 border-indigo-500' : 'border border-gray-200'
            }`}
          >
            <div className="p-6">
              {tier.popular && (
                <span className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600 mb-4">
                  Most Popular
                </span>
              )}
              <h2 className="text-2xl font-semibold text-gray-900">{tier.name}</h2>
              <p className="mt-4 text-sm text-gray-500">{tier.description}</p>
              <p className="mt-8">
                <span className="text-4xl font-extrabold text-gray-900">${tier.price}</span>
                <span className="text-base font-medium text-gray-500">/mo</span>
              </p>

              <div className="mt-6">
                <div className="rounded-md shadow">
                  <button
                    onClick={() => handleSelectTier(tierId)}
                    disabled={loading || subscription?.tier === tierId}
                    className={`w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white ${
                      subscription?.tier === tierId
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    {loading
                      ? 'Processing...'
                      : subscription?.tier === tierId
                      ? 'Current Plan'
                      : tier.popular
                      ? 'Upgrade to Pro'
                      : 'Get Started'}
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 pt-6 pb-8">
              <h3 className="text-xs font-medium text-gray-900 tracking-wide uppercase">
                What's included
              </h3>
              <ul className="mt-6 space-y-4">
                <li className="flex space-x-3">
                  <SparklesIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">
                    {tier.maxEmails.toLocaleString()} Emails/month
                  </span>
                </li>
                <li className="flex space-x-3">
                  <SparklesIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">
                    {tier.maxSMS.toLocaleString()} SMS/month
                  </span>
                </li>
                <li className="flex space-x-3">
                  <SparklesIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-500">
                    {tier.maxContacts.toLocaleString()} Contacts
                  </span>
                </li>
                {Object.entries(tier.features).map(([feature, enabled]) => (
                  <li key={feature} className="flex space-x-3">
                    {enabled ? (
                      <CheckIcon className="flex-shrink-0 h-5 w-5 text-green-500" />
                    ) : (
                      <XMarkIcon className="flex-shrink-0 h-5 w-5 text-gray-300" />
                    )}
                    <span className={`text-sm ${enabled ? 'text-gray-500' : 'text-gray-300'}`}>
                      {formatFeature(feature)}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900">Extra Credits Pricing</h4>
                <ul className="mt-4 space-y-2">
                  <li className="text-sm text-gray-500">
                    • Emails: ${(tier.extraEmailPrice || 0) * 1000}/1000 emails
                  </li>
                  <li className="text-sm text-gray-500">
                    • SMS: ${tier.extraSMSPrice}/SMS
                  </li>
                  <li className="text-sm text-gray-500">
                    • Leads: ${tier.extraLeadsPrice}/lead
                  </li>
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedTier && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Select Payment Method
            </h3>
            <div className="space-y-4">
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Select Payment Method
                </label>
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('flutterwave')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      selectedPaymentMethod === 'flutterwave'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      Flutterwave
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('paypal')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      selectedPaymentMethod === 'paypal'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      PayPal
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('nowpayments')}
                    className={`relative px-4 py-3 border rounded-lg shadow-sm focus:outline-none ${
                      selectedPaymentMethod === 'nowpayments'
                        ? 'border-indigo-500 ring-2 ring-indigo-500'
                        : 'border-gray-300'
                    }`}
                  >
                    <span className="block text-sm font-medium text-gray-900">
                      Crypto
                    </span>
                  </button>
                </div>
        </div>

              {selectedPaymentMethod === 'paypal' ? (
                <div id="paypal-button-container" className="mt-6"></div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleUpgrade(selectedTier)}
                  disabled={loading}
                  className="mt-6 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Processing...' : 'Upgrade Now'}
                </button>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedTier(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancellationInfo && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancellation & Refund Policy
            </h3>
            <div className="prose prose-sm">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Cancellation</h4>
              <ul className="list-disc pl-5 mb-4 text-gray-600">
                <li>You can cancel your subscription at any time</li>
                <li>Access to paid features continues until the end of your billing period</li>
                <li>No automatic refunds for cancellations</li>
                <li>Unused credits expire at the end of your subscription</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">Downgrades</h4>
              <ul className="list-disc pl-5 mb-4 text-gray-600">
                <li>You can downgrade to a lower tier at any time</li>
                <li>Changes take effect at the start of the next billing cycle</li>
                <li>Current tier benefits remain active until the end of the current period</li>
                <li>Unused credits from the higher tier may not transfer to lower tiers</li>
              </ul>

              <h4 className="text-lg font-medium text-gray-900 mb-2">Refunds</h4>
              <ul className="list-disc pl-5 mb-4 text-gray-600">
                <li>No automatic refunds for unused time</li>
                <li>Refund requests considered case-by-case for exceptional circumstances</li>
                <li>Contact support for refund requests within 14 days of purchase</li>
              </ul>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowCancellationInfo(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {showCryptoPayment && cryptoPaymentDetails && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Complete Crypto Payment
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Send {cryptoPaymentDetails.amount} {cryptoPaymentDetails.currency.toUpperCase()}
                </label>
                <div className="mt-2 flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={cryptoPaymentDetails.address}
                    className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(cryptoPaymentDetails.address)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <InformationCircleIcon className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      Please send the exact amount to the address above. The payment status will be updated automatically once confirmed on the blockchain.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCryptoPayment(false);
                    setCryptoPaymentDetails(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg shadow-lg">
          {error}
          </div>
        )}

      {/* Add crypto currency selector */}
      {selectedPaymentMethod === 'nowpayments' && (
        <div className="mt-4">
          <label htmlFor="cryptoCurrency" className="block text-sm font-medium text-gray-700">
            Select Cryptocurrency
          </label>
          <select
            id="cryptoCurrency"
            value={selectedCryptoCurrency}
            onChange={(e) => setSelectedCryptoCurrency(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            {cryptoCurrencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
      </div>
      )}
    </div>
  );
} 