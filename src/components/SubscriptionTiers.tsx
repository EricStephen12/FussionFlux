'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/20/solid';
import { useAuth } from '@/contexts/AuthContext';
import { paymentService } from '@/services/payment';

const tiers = [
  {
    name: 'Basic',
    id: 'basic',
    priceMonthly: 29,
    priceYearly: 290,
    description: 'Perfect for getting started with email marketing.',
    features: [
      '1,000 Email Credits',
      'Basic Email Templates',
      'Single Niche Selection',
      'Standard Support',
      'Basic Analytics',
      'Manual Campaign Scheduling',
    ],
    mostPopular: false,
  },
  {
    name: 'Professional',
    id: 'pro',
    priceMonthly: 79,
    priceYearly: 790,
    description: 'Everything you need for growing your business.',
    features: [
      '5,000 Email Credits',
      'Premium Email Templates',
      'Multiple Niche Selection',
      'Priority Support',
      'Advanced Analytics',
      'Automated Campaign Scheduling',
      'A/B Testing',
      'Custom Branding',
    ],
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    priceMonthly: 199,
    priceYearly: 1990,
    description: 'Advanced features for scaling your operations.',
    features: [
      '15,000 Email Credits',
      'Custom Email Templates',
      'Unlimited Niche Selection',
      '24/7 Priority Support',
      'Advanced Analytics & Reporting',
      'Smart Campaign Automation',
      'Advanced A/B Testing',
      'Custom Branding',
      'API Access',
      'Dedicated Account Manager',
    ],
    mostPopular: false,
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function SubscriptionTiers() {
  const [frequency, setFrequency] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubscribe = async (tierId: string) => {
    if (!user) {
      setError('Please sign in to subscribe');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const tier = tiers.find((t) => t.id === tierId);
      if (!tier) return;

      const price = frequency === 'monthly' ? tier.priceMonthly : tier.priceYearly;
      const result = await paymentService.initializePayment({
        amount: price,
        planId: tierId,
        interval: frequency,
        userId: user.uid,
      });

      if (result.success) {
        // Redirect to success page or show success message
        window.location.href = '/dashboard';
      } else {
        setError(result.error || 'Payment failed');
      }
    } catch (error: any) {
      setError(error.message || 'Failed to process subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">Pricing</h2>
          <p className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose the right plan for&nbsp;you
          </p>
        </div>
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-600">
          Select a plan that best fits your email marketing needs. All plans include access to our
          powerful campaign management tools.
        </p>

        {/* Billing Frequency Toggle */}
        <div className="mt-16 flex justify-center">
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
              <span className="absolute -right-2 -top-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs text-white">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 text-center">
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        )}

        <div className="isolate mx-auto mt-10 grid max-w-md grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={classNames(
                tier.mostPopular
                  ? 'ring-2 ring-indigo-600'
                  : 'ring-1 ring-gray-200',
                'rounded-3xl p-8 xl:p-10'
              )}
            >
              <div className="flex items-center justify-between gap-x-4">
                <h3
                  id={tier.id}
                  className={classNames(
                    tier.mostPopular ? 'text-indigo-600' : 'text-gray-900',
                    'text-lg font-semibold leading-8'
                  )}
                >
                  {tier.name}
                </h3>
                {tier.mostPopular && (
                  <p className="rounded-full bg-indigo-600/10 px-2.5 py-1 text-xs font-semibold leading-5 text-indigo-600">
                    Most popular
                  </p>
                )}
              </div>
              <p className="mt-4 text-sm leading-6 text-gray-600">
                {tier.description}
              </p>
              <p className="mt-6 flex items-baseline gap-x-1">
                <span className="text-4xl font-bold tracking-tight text-gray-900">
                  ${frequency === 'monthly' ? tier.priceMonthly : tier.priceYearly}
                </span>
                <span className="text-sm font-semibold leading-6 text-gray-600">
                  /{frequency === 'monthly' ? 'month' : 'year'}
                </span>
              </p>
              <button
                onClick={() => handleSubscribe(tier.id)}
                disabled={loading}
                className={classNames(
                  tier.mostPopular
                    ? 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500'
                    : 'text-indigo-600 ring-1 ring-inset ring-indigo-200 hover:ring-indigo-300',
                  'mt-6 block w-full rounded-md py-2 px-3 text-center text-sm font-semibold leading-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {loading ? 'Processing...' : 'Subscribe'}
              </button>
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 