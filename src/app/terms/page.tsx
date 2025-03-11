'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mt-4 text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-600 mb-4">
              By accessing or using our platform, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Subscription Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                2.1. Our platform offers various subscription tiers with different features and limitations.
              </p>
              <p>
                2.2. You agree to pay all fees associated with your chosen subscription tier.
              </p>
              <p>
                2.3. Subscriptions automatically renew unless cancelled before the renewal date.
              </p>
              <p>
                2.4. You may upgrade or downgrade your subscription at any time, subject to our pricing terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Responsibilities</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                3.1. You are responsible for maintaining the confidentiality of your account credentials.
              </p>
              <p>
                3.2. You must comply with all applicable laws and regulations when using our services.
              </p>
              <p>
                3.3. You agree not to use our platform for any illegal or unauthorized purposes.
              </p>
              <p>
                3.4. You are responsible for obtaining consent from your email recipients and complying with anti-spam laws.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Intellectual Property</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                4.1. Our platform, including all content, features, and functionality, is owned by us and protected by intellectual property laws.
              </p>
              <p>
                4.2. You retain ownership of your content but grant us a license to use it for providing our services.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Platform Usage</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                5.1. We reserve the right to modify, suspend, or discontinue any part of our services at any time.
              </p>
              <p>
                5.2. We may impose limits on certain features or restrict access to parts of the service without notice.
              </p>
              <p>
                5.3. You agree not to attempt to circumvent any limitations or restrictions we place on our services.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Usage and Privacy</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                6.1. Our collection and use of personal information is governed by our Privacy Policy.
              </p>
              <p>
                6.2. You retain ownership of your customer data and are responsible for its accuracy and legality.
              </p>
              <p>
                6.3. We may use anonymized data for improving our services and generating insights.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Termination</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                7.1. You may cancel your subscription at any time through your account settings.
              </p>
              <p>
                7.2. We may terminate or suspend your account for violations of these terms.
              </p>
              <p>
                7.3. Upon termination, you will lose access to our services and any unused credits or features.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Limitation of Liability</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                8.1. We provide our services "as is" without any warranty or guarantee.
              </p>
              <p>
                8.2. We are not liable for any indirect, incidental, or consequential damages.
              </p>
              <p>
                8.3. Our total liability shall not exceed the amount you paid for our services in the past 12 months.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Changes to Terms</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                9.1. We reserve the right to modify these terms at any time.
              </p>
              <p>
                9.2. We will notify you of any material changes via email or through our platform.
              </p>
              <p>
                9.3. Your continued use of our services after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                For any questions about these Terms of Service, please contact us at:
              </p>
              <ul className="list-disc pl-6">
                <li>Email: support@yourdomain.com</li>
                <li>Address: [Your Company Address]</li>
                <li>Phone: [Your Support Phone Number]</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            By using our services, you acknowledge that you have read and understand these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
} 