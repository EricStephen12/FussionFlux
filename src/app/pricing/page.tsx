'use client';

import { useState, useEffect } from 'react';
import { CheckIcon, SparklesIcon, RocketLaunchIcon, ShieldCheckIcon, ChartBarIcon, UserGroupIcon, EnvelopeIcon, DevicePhoneMobileIcon, ArrowRightIcon, StarIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useSubscription, SUBSCRIPTION_TIERS, SubscriptionTier } from '@/hooks/useSubscription';

const pricingTiers: Record<string, SubscriptionTier> = SUBSCRIPTION_TIERS;

const successStories = [
  {
    quote: "Generated $127,492 in our first quarter using the platform",
    author: "Alex M.",
    business: "Fashion Dropshipper",
    metrics: "45% open rate, 12% click rate",
    image: "https://source.unsplash.com/random/100x100"
  },
  {
    quote: "The AI templates doubled our revenue in 30 days",
    author: "Sarah K.",
    business: "Beauty Products",
    metrics: "3.2x ROI on email campaigns",
    image: "https://source.unsplash.com/random/100x100"
  },
  {
    quote: "Best investment we've made - 300% ROI in 2 months",
    author: "David R.",
    business: "Tech Accessories",
    metrics: "$43,721 extra revenue/month",
    image: "https://source.unsplash.com/random/100x100"
  }
];

const guarantees = [
  {
    title: "14-Day Money Back",
    description: "Try risk-free. Full refund if you're not 100% satisfied."
  },
  {
    title: "Results Guarantee",
    description: "Generate 2x ROI in 60 days or get 3 months free."
  },
  {
    title: "Price Lock Guarantee",
    description: "Your price stays the same as long as you're subscribed."
  }
];

function CountdownTimer({ expiryDate }: { expiryDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiryDate).getTime();
      const distance = expiry - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate]);

  return (
    <div className="flex items-center gap-4 text-lg font-semibold">
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-600 rounded px-3 py-1">{timeLeft.days}d</div>
      </div>
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-600 rounded px-3 py-1">{timeLeft.hours}h</div>
      </div>
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-600 rounded px-3 py-1">{timeLeft.minutes}m</div>
      </div>
      <div className="text-center">
        <div className="bg-indigo-100 text-indigo-600 rounded px-3 py-1">{timeLeft.seconds}s</div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const { subscription, isLoading, error } = useSubscription();
  const [timeLeft, setTimeLeft] = useState(3600); // 1 hour in seconds
  const [showExitPopup, setShowExitPopup] = useState(false);

  const handleExitIntent = () => {
    setShowExitPopup(true);
  };

  useEffect(() => {
    const savedTime = localStorage.getItem('countdown');
    if (savedTime) {
      setTimeLeft(parseInt(savedTime, 10));
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          return 0;
        }
        const newTime = prev - 1;
        localStorage.setItem('countdown', newTime.toString());
        return newTime;
      });
    }, 1000);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
      handleExitIntent();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const formatTimeLeft = (seconds: number): string => {
    const days = Math.floor(seconds / (24 * 60 * 60));
    const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
    const minutes = Math.floor((seconds % (60 * 60)) / 60);
    const secs = seconds % 60;
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen py-16 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-indigo-50">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section with USP */}
        <div className="text-center mb-16">
          <div className="mb-8 inline-flex items-center rounded-full bg-green-100 px-4 py-1">
            <StarIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm font-semibold text-green-600">
              Average customer generates $3,427 extra revenue per month
            </span>
          </div>
          
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Choose Your Path to</span>
            <span className="block text-indigo-600">Dropshipping Success</span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Join <span className="text-indigo-600 font-semibold">2,500+ successful dropshippers</span> who achieve 
            <span className="text-indigo-600 font-semibold"> 300% average ROI</span> with our AI-powered platform
          </p>

          {/* Performance Metrics */}
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-4xl font-bold text-indigo-600">45%</div>
              <div className="text-sm text-gray-600 mt-2">Average Open Rate</div>
              <div className="text-xs text-gray-500">(Industry avg: 15%)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-4xl font-bold text-indigo-600">15%</div>
              <div className="text-sm text-gray-600 mt-2">Click-Through Rate</div>
              <div className="text-xs text-gray-500">(Industry avg: 2.5%)</div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-4xl font-bold text-indigo-600">300%</div>
              <div className="text-sm text-gray-600 mt-2">Average ROI</div>
              <div className="text-xs text-gray-500">(Within 60 days)</div>
            </div>
          </div>
        </div>

        {/* Special Offer Banner */}
        {subscription && subscription.specialOffer?.enabled && (
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-8 px-4 mb-12">
            <div className="max-w-7xl mx-auto text-center">
              <div className="text-2xl font-bold mb-4">
                🔥 Special Launch Offer
              </div>
              <div className="text-xl mb-4">
                Get {subscription.specialOffer.discountPercentage}% off your first {subscription.specialOffer.durationMonths} months + ${subscription.specialOffer.bonusAmount} in bonuses
              </div>
              <div className="mb-6">
                <span className="text-lg">Offer ends in:</span>
                <CountdownTimer expiryDate={subscription.specialOffer.expiryDate} />
              </div>
              <div className="flex justify-center gap-4 text-lg">
                {subscription.specialOffer.bonusFeatures.map((feature, index) => (
                  <div key={index} className="bg-white/10 rounded-full px-4 py-1">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Free Trial Banner */}
        <div className="max-w-7xl mx-auto px-4 text-center mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold mb-2">Start with full access to all features</h2>
            <p className="text-gray-600 mb-4">
              No credit card required. After {SUBSCRIPTION_TIERS.free.trialDuration} days, choose the plan that fits your needs or continue with limited features.
            </p>
            <div className="flex justify-center gap-4">
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>{SUBSCRIPTION_TIERS.free.maxEmails} Emails</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>All Features Unlocked</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>No Credit Card</span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="text-center mb-12">
          <div className="flex justify-center items-center gap-x-4">
            <span className={`text-sm ${!isAnnual ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
              Monthly billing
            </span>
            <button
              type="button"
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
              onClick={() => setIsAnnual(!isAnnual)}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isAnnual ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className={`text-sm ${isAnnual ? 'text-indigo-600 font-semibold' : 'text-gray-500'}`}>
              Annual billing <span className="text-green-500 font-medium">(Save 17% + 2 months free)</span>
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {Object.values(pricingTiers).map((tier: SubscriptionTier) => (
            <div key={tier.name} className={`relative rounded-2xl ${
              tier.popular
                ? 'bg-white ring-4 ring-indigo-500 shadow-xl scale-105 z-10'
                : 'bg-white shadow-lg'
            } p-8 flex flex-col`}> 
              {tier.popular && (
                <div className="absolute top-0 right-6 transform -translate-y-1/2">
                  <div className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-1 text-sm font-semibold text-white">
                    Most Popular
                  </div>
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-900">{tier.name}</h3>
              <p className="mt-2 text-sm text-gray-500">{tier.description}</p>
              <div className="mt-6">
                <span className="text-4xl font-extrabold text-gray-900">
                  ${isAnnual ? (Number(tier.price) * 0.83 * 12).toFixed(0) : tier.price}
                </span>
                <span className="text-base font-medium text-gray-500">
                  {isAnnual ? '/year' : '/month'}
                </span>
                {isAnnual && (
                  <span className="ml-2 text-sm text-green-500">
                    Save ${((Number(tier.price) * 0.17 * 12).toFixed(0))}
                  </span>
                )}
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="text-gray-600">{tier.maxEmails.toLocaleString()} Emails/month</span>
                </div>
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="text-gray-600">{tier.maxContacts?.toLocaleString() || 0} Contacts</span>
                </div>
                <div className="flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  <span className="text-gray-600">{tier.maxSMS.toLocaleString()} SMS/month</span>
                </div>
              </div>
              <ul className="mt-8 space-y-4 flex-grow">
                {Object.entries(tier.features).map(([featureName, isEnabled]) => (
                  isEnabled && (
                    <li key={featureName} className="flex items-start gap-x-3">
                      <CheckIcon className="h-6 w-6 flex-shrink-0 text-green-500" />
                      <span className="text-gray-600">{featureName}</span>
                    </li>
                  )
                ))}
              </ul>
              <Link
                href="/login"
                className={`mt-8 w-full inline-flex justify-center items-center px-6 py-3 rounded-lg text-base font-semibold transition-all duration-200 ${
                  tier.popular
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                }`}
              >
                {tier.cta}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              {tier.popular && (
                <p className="mt-4 text-sm text-center text-gray-500">
                  Most dropshippers choose this plan
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Guarantees Section */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Triple Guarantee
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {guarantees.map((guarantee, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg text-center">
                <ShieldCheckIcon className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{guarantee.title}</h3>
                <p className="text-gray-600">{guarantee.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mt-16 max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Join 2,500+ Successful Dropshippers
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {successStories.map((story, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-lg">
                <div className="flex items-center mb-4">
                  <img
                    src={story.image}
                    alt={story.author}
                    className="h-12 w-12 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">{story.author}</p>
                    <p className="text-sm text-gray-500">{story.business}</p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{story.quote}</p>
                <div className="text-sm text-indigo-600 font-medium">{story.metrics}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900">How does the 14-day trial work?</h3>
              <p className="mt-2 text-gray-600">
                Start with full access to all features. No credit card required. After 14 days, choose the plan that fits your needs or continue with the free plan.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900">What's included in each plan?</h3>
              <p className="mt-2 text-gray-600">
                All plans include core features like email campaigns, templates, and analytics. Higher tiers unlock advanced features like AI optimization, SMS marketing, and priority support.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-900">Can I upgrade or downgrade anytime?</h3>
              <p className="mt-2 text-gray-600">
                Yes! Switch plans anytime. Upgrades take effect immediately, while downgrades take effect at the end of your billing cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 max-w-3xl mx-auto text-white">
            <h3 className="text-2xl font-bold mb-4">
              Start Growing Your Dropshipping Business Today
            </h3>
            <p className="text-indigo-100 mb-6">
              Join thousands of successful dropshippers who are already generating profit with our platform
            </p>
            <Link
              href="/login"
              className="inline-flex items-center px-6 py-3 rounded-lg text-base font-semibold bg-white text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
            >
              Start Your Free Trial
              <ArrowRightIcon className="ml-2 h-5 w-5" />
            </Link>
            <div className="mt-4 text-sm text-indigo-100">
              No credit card required • Cancel anytime • 14-day free trial
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-12 text-center">
          <div className="flex justify-center items-center space-x-6 text-gray-500">
            <div>🔒 Secure Checkout</div>
            <div>💯 Money-back Guarantee</div>
            <div>🚀 Instant Access</div>
            <div>💬 24/7 Support</div>
          </div>
        </div>
      </div>

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Wait! Don't Miss Out on 50% Off
            </h3>
            <p className="text-gray-600 mb-6">
              Get 50% off your first 3 months + $500 in bonuses if you start your trial today.
            </p>
            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowExitPopup(false);
                  window.location.href = '/login';
                }}
                className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                Claim My 50% Discount
              </button>
              <button
                onClick={() => setShowExitPopup(false)}
                className="w-full text-gray-600 px-4 py-2"
              >
                No thanks, I'll pay full price later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 