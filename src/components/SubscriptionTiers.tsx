'use client';

import { useState } from 'react';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, ShieldCheckIcon, ChartBarIcon, UserGroupIcon, EnvelopeIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/payment';
import { useRouter } from 'next/navigation';
import { useSubscription } from '@/hooks/useSubscription';
import Image from 'next/image';

const tiers = [
  {
    name: 'Free Trial',
    price: '0',
    limits: 50,
    maxEmails: 10,
    maxSMS: 0,
    maxContacts: 10,
    description: 'Try our platform risk-free for 14 days',
    features: [
      'Basic Analytics Dashboard',
      'Preview Leads',
      'Email Support',
      'Basic Templates',
      'Campaign Tracking',
    ],
    stats: {
      expectedOrders: '5-10',
      potentialRevenue: '$175-$350',
      roi: '6-12x',
    },
    cta: 'Start Free Trial',
    popular: false,
    highlight: 'No Credit Card Required'
  },
  {
    name: 'Starter',
    price: '39',
    limits: 1000,
    maxEmails: 5000,
    maxSMS: 500,
    maxContacts: 500,
    description: 'Perfect for new dropshippers starting their journey',
    features: [
      'Follow-up Emails',
      'A/B Testing',
      'Analytics Dashboard',
      'Preview Leads',
      'Import Contacts',
      'Full Lead Access',
      'Email Support',
      'Proven Templates',
      'Campaign Tracking',
    ],
    stats: {
      expectedOrders: '5-10',
      potentialRevenue: '$175-$350',
      roi: '6-12x',
    },
    cta: 'Get Started',
    popular: false,
    highlight: '97% Email Deliverability'
  },
  {
    name: 'Grower',
    price: '99',
    limits: 5000,
    maxEmails: 15000,
    maxSMS: 1000,
    maxContacts: 2000,
    description: 'Most chosen by successful dropshippers',
    features: [
      'All Starter Features',
      'AI Optimization',
      'Custom Domain',
      'Bulk Operations',
      'Priority Support',
      'Advanced Analytics',
      'Custom Templates',
      'API Access',
      'Dedicated Manager',
    ],
    stats: {
      expectedOrders: '25-50',
      potentialRevenue: '$875-$1,750',
      roi: '11-22x',
    },
    cta: 'Upgrade Now',
    popular: true,
    highlight: 'Most Popular Choice'
  },
  {
    name: 'Pro',
    price: '249',
    limits: 10000,
    maxEmails: 50000,
    maxSMS: 5000,
    maxContacts: 5000,
    description: 'For serious dropshippers ready to scale',
    features: [
      'All Growth Features',
      'Premium AI Features',
      'Unlimited Templates',
      '24/7 Priority Support',
      'Custom Integration',
      'White Label Options',
      'Enterprise Security',
      'Advanced API Access',
      'Revenue Analytics',
      'Bulk Automation',
    ],
    stats: {
      expectedOrders: '100-200',
      potentialRevenue: '$3,500-$7,000',
      roi: '23-47x',
    },
    cta: 'Go Pro',
    popular: false,
    highlight: 'Highest ROI Potential'
  }
];

const paymentMethods = [
  { id: 'flutterwave', name: 'Flutterwave', logo: '/path/to/flutterwave-logo.png', description: 'Pay with Flutterwave' },
  { id: 'paypal', name: 'PayPal', logo: '/path/to/paypal-logo.png', description: 'Pay with PayPal' },
  { id: 'nowpayments', name: 'NowPayments', logo: '/path/to/nowpayments-logo.png', description: 'Pay with NowPayments' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  limits: number;
  features: string[];
  amount: number;
  planId: string;
  interval: 'monthly' | 'yearly';
  userId: string;
  email?: string;
  currency?: string;
}

export default function SubscriptionTiers() {
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>('flutterwave');
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const router = useRouter();

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      router.push('/login?redirect=/dashboard/subscription');
      return;
    }

    try {
      setLoadingTier(tierId);
      setError(null);
      const tier = tiers.find((t) => t.name.toLowerCase() === tierId.toLowerCase());
      if (!tier) return;

      const price = frequency === 'monthly' ? tier.price : (Number(tier.price) * 0.83 * 12).toFixed(0);
      let paymentResult;

      switch (selectedPayment) {
        case 'flutterwave':
          if (!user.email) {
            throw new Error('User email is required for payment.');
          }
          const flutterwavePlan: PaymentPlan = {
            id: tierId,
            name: 'Flutterwave',
            description: 'Pay with Flutterwave',
            price: Number(price),
            limits: tier.limits,
            features: tier.features,
            amount: Number(price),
            planId: tierId,
            interval: frequency,
            userId: user.uid,
            email: user.email,
          };
          paymentResult = await paymentService.initializeFlutterwave(flutterwavePlan, user.email);
          break;

        case 'paypal':
          const paypalPlan: PaymentPlan = {
            id: tierId,
            name: tier.name,
            description: tier.description,
            price: Number(price),
            limits: tier.limits,
            features: tier.features,
            amount: Number(price),
            planId: tierId,
            interval: frequency,
            userId: user.uid,
            email: user.email || '',
          };
          paymentResult = await paymentService.initializePayPal(paypalPlan);
          break;

        case 'nowpayments':
          paymentResult = await paymentService.initializePayment({
            amount: Number(price),
            planId: tierId,
            interval: frequency,
            userId: user.uid,
            currency: 'USD',
          });
          break;

        default:
          throw new Error('Invalid payment method');
      }

      if (paymentResult.success && paymentResult.paymentUrl) {
        window.location.href = paymentResult.paymentUrl;
      } else {
        setError(paymentResult.error || 'Payment initialization failed');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to process subscription');
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <div className="bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Billing Frequency Toggle */}
        <div className="mt-8 flex justify-center">
          <div className="relative flex rounded-full bg-gray-100 p-1">
            <button
              type="button"
              className={classNames(
                frequency === 'monthly'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-50',
                'relative rounded-full py-2 px-6 text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              )}
              onClick={() => setFrequency('monthly')}
            >
              Monthly
            </button>
            <button
              type="button"
              className={classNames(
                frequency === 'yearly'
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-gray-50',
                'relative ml-0.5 rounded-full py-2 px-6 text-sm font-semibold text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
              )}
              onClick={() => setFrequency('yearly')}
            >
              Yearly
              <span className="absolute -right-2 -top-2 rounded-full bg-green-500 px-2 py-0.5 text-xs text-white">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="mt-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedPayment(method.id)}
                className={classNames(
                  'flex flex-col items-center p-4 rounded-lg border-2 transition-all',
                  selectedPayment === method.id
                    ? 'border-indigo-600 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-200'
                )}
              >
                <Image
                  src={method.logo}
                  alt={method.name}
                  width={120}
                  height={40}
                  className="h-10 object-contain"
                />
                <p className="mt-2 text-sm font-medium text-gray-900">{method.name}</p>
                <p className="text-xs text-gray-500">{method.description}</p>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mt-8 text-center">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        {/* Pricing Tiers */}
        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-2 md:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={classNames(
                tier.popular
                  ? 'ring-2 ring-indigo-600 scale-105'
                  : 'ring-1 ring-gray-200',
                'rounded-3xl p-8 xl:p-10'
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.name}
                  className={classNames(
                    tier.popular ? 'text-indigo-600' : 'text-gray-900',
                    'text-lg font-semibold leading-8'
                  )}
                >
                  {tier.name}
                </h3>
                {tier.popular ? (
                  <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600">
                    Most popular
                  </p>
                ) : (
                  <p className="rounded-full bg-gray-50 px-2.5 py-1 text-xs font-semibold leading-5 text-gray-600">
                    {tier.highlight}
                  </p>
                )}
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-600">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  ${frequency === 'monthly' ? tier.price : (Number(tier.price) * 0.83 * 12).toFixed(0)}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600">
                  /{frequency === 'monthly' ? 'month' : 'year'}
                </span>
              </p>

              {/* Usage Limits */}
              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Credits</span>
                  <span className="font-semibold text-gray-900">{tier.limits.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Emails</span>
                  <span className="font-semibold text-gray-900">{subscription?.maxEmails.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max Contacts</span>
                  <span className="font-semibold text-gray-900">{subscription?.maxContacts.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Max SMS</span>
                  <span className="font-semibold text-gray-900">{subscription?.maxSMS.toLocaleString()}</span>
                </div>
              </div>

              {/* ROI Stats */}
              <div className="mt-4 space-y-2 text-left">
                <h4 className="font-medium text-gray-900">Expected Monthly Results:</h4>
                <ul className="list-disc list-inside">
                  <li>{tier.stats.expectedOrders} Orders</li>
                  <li>${tier.stats.potentialRevenue} Revenue</li>
                  <li>{tier.stats.roi}x ROI</li>
                </ul>
              </div>

              <ul role="list" className="mt-8 space-y-3 text-sm leading-6 text-gray-600">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex gap-x-3">
                    <CheckIcon
                      className="h-6 w-5 flex-none text-indigo-600"
                      aria-hidden="true"
                    />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(tier.name)}
                disabled={loadingTier === tier.name}
                className={classNames(
                  'mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
                  tier.popular
                    ? 'bg-indigo-600 text-white shadow hover:bg-indigo-500 focus-visible:outline-indigo-600'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                )}
              >
                {loadingTier === tier.name ? 'Processing...' : tier.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}