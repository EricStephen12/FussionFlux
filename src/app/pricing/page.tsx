'use client';

import { useState } from 'react';
import { CheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const pricingTiers = [
  {
    name: 'Free',
    price: '0',
    credits: '0',
    description: 'Get started with our free plan using your own contacts. Limited to 5 emails and 5 contacts per day.',
    features: [
      'Basic email targeting',
      'Standard templates',
      'Basic analytics',
      'Email verification',
      'Basic support',
    ],
    cta: 'Start Free',
    popular: false
  },
  {
    name: 'Starter',
    price: '19.99',
    credits: '100',
    description: 'Ideal for small campaigns',
    features: [
      'Basic targeting',
      'Standard templates',
      'Email verification',
      'Basic analytics',
      'Email support',
      '1,000 emails per month'
    ],
    cta: 'Start with Starter',
    popular: false
  },
  {
    name: 'Grower',
    price: '49.99',
    credits: '500',
    description: 'Ideal for expanding businesses',
    features: [
      'Advanced targeting',
      'A/B testing',
      'Detailed analytics',
      'Priority email verification',
      'Priority support',
      'Custom templates',
      'ROI tracking',
      '2,000 emails per month'
    ],
    cta: 'Grow with Grower',
    popular: false
  },
  {
    name: 'Pro',
    price: '99.99',
    credits: '1,000',
    description: 'For established businesses',
    features: [
      'Advanced targeting',
      'A/B testing',
      'Detailed analytics',
      'Priority email verification',
      'Priority support',
      'Custom templates',
      'ROI tracking',
      'Custom domain',
      '4,000 emails per month'
    ],
    cta: 'Go Pro',
    popular: true
  },
  {
    name: 'Enterprise',
    price: '249.99',
    credits: '5,000',
    description: 'For large-scale operations',
    features: [
      'Premium targeting',
      'Advanced A/B testing',
      'Full analytics suite',
      'Instant verification',
      '24/7 priority support',
      'Custom integration',
      'Dedicated account manager',
      'White label options',
      '20,000 emails per month'
    ],
    cta: 'Contact Sales',
    popular: false
  }
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="min-h-screen py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8">
      <div className="container-lg">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 sm:mt-5 text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
            Choose the perfect plan for your dropshipping business. No hidden fees.
          </p>

          {/* Billing Toggle */}
          <div className="mt-6 sm:mt-8 flex justify-center items-center gap-x-2 sm:gap-x-4">
            <span className={`text-sm ${!isAnnual ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
              Monthly billing
            </span>
            <button
              type="button"
              className={`relative inline-flex h-5 sm:h-6 w-9 sm:w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span
                className={`pointer-events-none inline-block h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
              Annual billing <span className="text-green-500 font-medium">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative rounded-2xl ${
                tier.popular
                  ? 'bg-gradient-to-b from-indigo-500 to-purple-600 text-white shadow-xl md:scale-105 md:z-10'
                  : 'bg-white text-gray-900 border border-indigo-100'
              } p-6 sm:p-8 flex flex-col`}
            >
              {tier.popular && (
                <div className="absolute -top-4 sm:-top-5 left-1/2 transform -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6 sm:mb-8">
                <h3 className={`text-xl sm:text-2xl font-bold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                  {tier.name}
                </h3>
                <p className={`mt-2 text-sm ${tier.popular ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {tier.description}
                </p>
                <div className="mt-4 sm:mt-6">
                  <span className={`text-3xl sm:text-4xl font-extrabold ${tier.popular ? 'text-white' : 'text-gray-900'}`}>
                    ${isAnnual ? (Number(tier.price) * 0.8 * 12).toFixed(2) : tier.price}
                  </span>
                  <span className={`text-sm sm:text-base font-medium ${tier.popular ? 'text-indigo-100' : 'text-gray-500'}`}>
                    {isAnnual ? '/year' : '/month'}
                  </span>
                </div>
                <div className={`mt-1 text-sm ${tier.popular ? 'text-indigo-100' : 'text-gray-500'}`}>
                  {tier.credits} credits included
                </div>
              </div>

              <ul className="space-y-3 sm:space-y-4 flex-grow mb-6 sm:mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-x-3">
                    <CheckIcon 
                      className={`h-5 w-5 flex-shrink-0 ${
                        tier.popular ? 'text-indigo-200' : 'text-indigo-500'
                      }`}
                    />
                    <span className={`text-sm sm:text-base ${tier.popular ? 'text-indigo-100' : 'text-gray-600'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`w-full inline-flex justify-center items-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-sm sm:text-base font-semibold transition-all duration-200 ${
                  tier.popular
                    ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 sm:mt-20 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
            Have questions?
          </h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6">
            Contact our sales team for custom enterprise solutions or specific requirements.
          </p>
          <Link
            href="/contact"
            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm sm:text-base"
          >
            Contact Sales →
          </Link>
        </div>
      </div>
    </div>
  );
} 