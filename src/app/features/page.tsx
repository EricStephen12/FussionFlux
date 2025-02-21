import { ArrowPathIcon, CloudArrowUpIcon, LockClosedIcon, ServerIcon, ChartBarIcon, EnvelopeIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const features = [
  {
    name: 'Professional Email Templates',
    description: 'Choose from our collection of professionally designed email templates optimized for e-commerce. Easily customize content to match your brand.',
    icon: DocumentDuplicateIcon,
  },
  {
    name: 'Campaign Management',
    description: 'Create, schedule, and track email campaigns with our intuitive interface. Perfect for welcome series, abandoned cart recovery, and customer retention.',
    icon: ArrowPathIcon,
  },
  {
    name: 'Performance Analytics',
    description: 'Track open rates, click-through rates, and conversion metrics in real-time. Make data-driven decisions to optimize your campaigns.',
    icon: ChartBarIcon,
  },
  {
    name: 'Smart List Management',
    description: 'Easily segment your audience based on behavior, preferences, and engagement levels for targeted campaigns.',
    icon: ServerIcon,
  },
  {
    name: 'Enterprise Security',
    description: 'Your data is protected with industry-leading security measures, including end-to-end encryption and secure authentication.',
    icon: LockClosedIcon,
  },
  {
    name: 'High Deliverability',
    description: 'Our advanced infrastructure ensures your emails reach the inbox, not the spam folder, with high deliverability rates.',
    icon: EnvelopeIcon,
  },
];

export default function Features() {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <div className="relative isolate overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
          <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0 lg:pt-8">
            <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Powerful Features for Your Email Marketing
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Everything you need to create, manage, and optimize your email campaigns. Built for dropshippers who want to scale their business.
            </p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="mx-auto grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 sm:gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.name} className="feature-card">
              <div className="relative">
                <feature.icon className="feature-icon" aria-hidden="true" />
                <h3 className="text-xl font-semibold leading-7 text-gray-900">
                  {feature.name}
                </h3>
                <p className="mt-3 text-base leading-7 text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24">
        <div className="glass-card">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
              Join thousands of successful dropshippers who are growing their business with our email marketing platform.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/login"
                className="btn-primary"
              >
                Get started
              </a>
              <a
                href="/contact"
                className="btn-secondary"
              >
                Contact sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 