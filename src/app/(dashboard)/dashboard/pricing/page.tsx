'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';

const tiers = [
  {
    name: 'Starter',
    id: 'starter',
    price: 39,
    description: 'Perfect for new dropshippers starting their journey',
    maxLeads: 1000,
    maxEmails: 5000,
    maxSMS: 500,
    features: [
      'Follow-up Emails',
      'A/B Testing',
      'Analytics Dashboard',
      'Preview Leads',
      'Import Contacts',
      'Full Lead Access',
      'Email Support',
      'Proven Templates',
      'Campaign Tracking'
    ]
  },
  {
    name: 'Growth',
    id: 'growth',
    price: 99,
    description: 'Most chosen by successful dropshippers',
    maxLeads: 5000,
    maxEmails: 15000,
    maxSMS: 1500,
    features: [
      'All Starter Features',
      'AI Optimization',
      'Custom Domain',
      'Bulk Operations',
      'Priority Support',
      'Advanced Analytics',
      'Custom Templates',
      'API Access',
      'Dedicated Manager'
    ]
  },
  {
    name: 'Pro',
    id: 'pro',
    price: 199,
    description: 'For established dropshippers with high volume needs',
    maxLeads: 15000,
    maxEmails: 50000,
    maxSMS: 5000,
    features: [
      'All templates',
      'AI optimization',
      'Full analytics suite',
      'Unlimited A/B tests',
      'Premium support',
      'API access',
      'Custom integrations'
    ]
  }
];

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();
  const { subscription } = useSubscription();

  const getPrice = (basePrice: number) => {
    return billingInterval === 'yearly' ? basePrice * 10 : basePrice;
  };

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:flex-col sm:align-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-center">
            Pricing Plans
          </h1>
          <p className="mt-5 text-xl text-gray-500 sm:text-center">
            Start growing your dropshipping business with our powerful email marketing platform
          </p>
          <div className="relative mt-6 bg-gray-100 rounded-lg p-0.5 flex sm:mt-8">
            <button
              type="button"
              className={`${
                billingInterval === 'monthly'
                  ? 'bg-white border-gray-200 shadow-sm text-gray-900'
                  : 'border border-transparent text-gray-700'
              } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:w-auto sm:px-8`}
              onClick={() => setBillingInterval('monthly')}
            >
              Monthly billing
            </button>
            <button
              type="button"
              className={`${
                billingInterval === 'yearly'
                  ? 'bg-white border-gray-200 shadow-sm text-gray-900'
                  : 'border border-transparent text-gray-700'
              } relative w-1/2 rounded-md py-2 text-sm font-medium whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:z-10 sm:w-auto sm:px-8`}
              onClick={() => setBillingInterval('yearly')}
            >
              Yearly billing
              <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="mt-12 space-y-4 sm:mt-16 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6 lg:max-w-4xl lg:mx-auto xl:max-w-none xl:mx-0">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-lg shadow-sm divide-y divide-gray-200 ${
                tier.id === 'growth' ? 'border-2 border-indigo-500' : 'border border-gray-200'
              }`}
            >
              <div className="p-6">
                <h2 className="text-2xl font-semibold text-gray-900">{tier.name}</h2>
                <p className="mt-4 text-sm text-gray-500">{tier.description}</p>
                <p className="mt-8">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${getPrice(tier.price)}
                  </span>
                  <span className="text-base font-medium text-gray-500">
                    /{billingInterval}
                  </span>
                </p>
                <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max Leads</span>
                    <span className="font-semibold text-gray-900">
                      {tier.maxLeads.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max Emails</span>
                    <span className="font-semibold text-gray-900">
                      {tier.maxEmails.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Max SMS</span>
                    <span className="font-semibold text-gray-900">
                      {tier.maxSMS.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  className={`mt-8 block w-full py-3 px-6 border rounded-md text-center font-medium ${
                    subscription?.tier === tier.id
                      ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700'
                  }`}
                  disabled={subscription?.tier === tier.id}
                >
                  {subscription?.tier === tier.id ? 'Current Plan' : 'Upgrade'}
                </button>
              </div>
              <div className="px-6 pt-6 pb-8">
                <h3 className="text-xs font-semibold text-gray-900 tracking-wide uppercase">
                  What&apos;s included
                </h3>
                <ul role="list" className="mt-6 space-y-4">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex space-x-3">
                      <svg
                        className="flex-shrink-0 h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-sm text-gray-500">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 