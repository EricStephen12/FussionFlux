import { ArrowPathIcon, CloudArrowUpIcon, LockClosedIcon, ServerIcon, ChartBarIcon, EnvelopeIcon, DocumentDuplicateIcon, CheckIcon, ArrowRightIcon, CursorArrowRaysIcon, ChartPieIcon, CreditCardIcon, ShieldCheckIcon, SparklesIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'AI-Powered Lead Generation',
    description: 'Get instant access to 10,000+ verified, high-intent leads in your niche. Our AI ensures 97% accuracy and 3x higher conversion rates compared to traditional methods.',
    icon: SparklesIcon,
    stats: {
      users: '2,347',
      metric: 'Average Success Rate',
      value: '89%'
    }
  },
  {
    name: 'Smart Email Campaigns',
    description: 'Create high-converting emails in seconds with our AI copywriter. Our users achieve 45% open rates (3x industry average) and 15% click rates using our proven templates.',
    icon: EnvelopeIcon,
    stats: {
      users: '1,892',
      metric: 'Avg. Open Rate',
      value: '45%'
    }
  },
  {
    name: 'Advanced A/B Testing',
    description: 'Test up to 5 variants simultaneously. Our AI automatically optimizes for the best performer, increasing conversions by up to 127% on average.',
    icon: ChartPieIcon,
    stats: {
      users: '1,456',
      metric: 'Conversion Lift',
      value: '+127%'
    }
  },
  {
    name: 'Visual Campaign Builder',
    description: 'Design stunning emails in minutes with our drag-and-drop builder. Choose from 300+ mobile-optimized templates with proven conversion rates.',
    icon: CursorArrowRaysIcon,
    stats: {
      users: '2,103',
      metric: 'Time Saved',
      value: '4hrs/week'
    }
  },
  {
    name: 'Behavioral Automation',
    description: 'Set up intelligent sequences that adapt to customer behavior. Increase repeat purchases by 83% with our smart follow-up system.',
    icon: ArrowPathIcon,
    stats: {
      users: '1,734',
      metric: 'Revenue Increase',
      value: '+83%'
    }
  },
  {
    name: 'Revenue Analytics',
    description: 'Track ROI, LTV, and customer behavior in real-time. Our users report an average of $3,427 additional monthly revenue after implementing our insights.',
    icon: ChartBarIcon,
    stats: {
      users: '1,967',
      metric: 'Extra Revenue',
      value: '$3,427/mo'
    }
  },
  {
    name: 'Smart List Management',
    description: 'Our AI automatically segments your audience based on 50+ behavior signals, increasing engagement by 215% through hyper-personalization.',
    icon: ServerIcon,
    stats: {
      users: '1,589',
      metric: 'Engagement Boost',
      value: '+215%'
    }
  },
  {
    name: 'Enterprise Security',
    description: 'Bank-grade encryption, GDPR compliance, and 99.99% uptime. Trusted by 2,500+ businesses handling sensitive customer data.',
    icon: ShieldCheckIcon,
    stats: {
      users: '2,500',
      metric: 'Uptime',
      value: '99.99%'
    }
  },
];

const getRandomRevenue = () => {
  const revenue = Math.floor(Math.random() * 5000) + 1000;
  return `$${revenue.toLocaleString()}`;
};

export default function Features() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            {/* Social Proof Banner */}
            <div className="mb-8 inline-flex items-center rounded-full bg-indigo-600/10 px-4 py-1">
              <span className="text-sm font-semibold text-indigo-600">
                ⚡️ Trusted by 2,500+ successful dropshippers
              </span>
            </div>
            
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Turn Every Email into a <span className="text-indigo-600">Revenue Machine</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Our users generate <span className="font-semibold text-indigo-600">$3,427 extra revenue per month</span> on average. Join them and unlock the power of AI-driven email marketing for your dropshipping business.
            </p>
            
            {/* Trust Indicators */}
            <div className="mt-8 flex items-center gap-x-4 text-sm">
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>45% Open Rates</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>15% Click Rates</span>
              </div>
              <div className="flex items-center gap-x-2">
                <CheckIcon className="h-5 w-5 text-green-500" />
                <span>3x ROI</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="feature-card bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all">
              <div className="relative">
                <div className="flex items-center mb-4">
                  <feature.icon className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-indigo-600">
                      Used by {feature.stats.users} stores
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">
                  {feature.description}
                </p>
                <div className="mt-4 flex items-center justify-between bg-gray-50 rounded-lg p-3">
                  <div className="text-sm text-gray-600">
                    {feature.stats.metric}
                  </div>
                  <div className="text-lg font-semibold text-indigo-600">
                    {feature.stats.value}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Start Generating More Revenue Today
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-100">
              Join thousands of successful dropshippers who increased their revenue by 300% with our AI-powered platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/login"
                className="inline-flex items-center px-6 py-3 text-lg font-semibold text-indigo-600 bg-white rounded-lg hover:bg-indigo-50 transition-all"
              >
                Start Free Trial
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </a>
              <div className="text-sm text-indigo-100">
                <div>✓ No credit card required</div>
                <div>✓ 14-day free trial</div>
                <div>✓ Cancel anytime</div>
              </div>
            </div>
            
            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-medium">🔒 Enterprise Security</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-medium">💬 24/7 Support</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-medium">💯 Money-back Guarantee</div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="text-sm font-medium">🛡️ GDPR Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 