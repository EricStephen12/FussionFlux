'use client';

import { ArrowLeftIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

const dataCollectionPoints = [
  {
    title: "Account Information",
    description: "Email, name, business details, and payment information for account creation and billing."
  },
  {
    title: "Usage Data",
    description: "Information about how you use our platform, including features accessed and campaign performance."
  },
  {
    title: "Customer Lists",
    description: "Contact information for your email subscribers and campaign recipients."
  },
  {
    title: "Campaign Data",
    description: "Email content, templates, analytics, and engagement metrics."
  },
  {
    title: "Technical Data",
    description: "IP addresses, browser type, device information, and cookies for platform functionality."
  }
];

const dataSharingPurposes = [
  {
    title: "Service Providers",
    description: "We work with trusted third-party providers for email delivery, payment processing, and analytics."
  },
  {
    title: "Legal Requirements",
    description: "We may share data when required by law or to protect our rights and safety."
  },
  {
    title: "Business Transfers",
    description: "Your data may be transferred if we're involved in a merger, acquisition, or asset sale."
  }
];

const dataProtectionMeasures = [
  {
    title: "Encryption",
    description: "All data is encrypted in transit and at rest using industry-standard protocols."
  },
  {
    title: "Access Controls",
    description: "Strict access controls and authentication measures protect your data."
  },
  {
    title: "Regular Audits",
    description: "We conduct regular security audits and vulnerability assessments."
  },
  {
    title: "Data Backups",
    description: "Regular backups ensure your data is safe and recoverable."
  }
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center gap-4">
            <ShieldCheckIcon className="h-12 w-12 text-indigo-600" />
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
              <p className="mt-2 text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Introduction */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <p className="text-gray-600">
              We take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our platform.
            </p>
          </section>

          {/* Data Collection */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Information We Collect</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {dataCollectionPoints.map((point, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{point.title}</h3>
                  <p className="text-gray-600">{point.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* How We Use Your Data */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How We Use Your Data</h2>
            <div className="space-y-4 text-gray-600">
              <p>We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and improve our services</li>
                <li>Process your transactions</li>
                <li>Send administrative information</li>
                <li>Provide customer support</li>
                <li>Send marketing communications (with your consent)</li>
                <li>Analyze usage patterns to improve our platform</li>
                <li>Detect and prevent fraud</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Data Sharing</h2>
            <div className="space-y-6">
              {dataSharingPurposes.map((purpose, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{purpose.title}</h3>
                  <p className="text-gray-600">{purpose.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Data Protection */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">How We Protect Your Data</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {dataProtectionMeasures.map((measure, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{measure.title}</h3>
                  <p className="text-gray-600">{measure.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Your Rights */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Rights</h2>
            <div className="space-y-4 text-gray-600">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Object to data processing</li>
                <li>Export your data</li>
                <li>Withdraw consent at any time</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact our privacy team at privacy@yourdomain.com
              </p>
            </div>
          </section>

          {/* Cookie Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Cookie Policy</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We use cookies and similar technologies to improve your experience on our platform. These include:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Essential cookies for platform functionality</li>
                <li>Analytics cookies to understand usage</li>
                <li>Preference cookies to remember your settings</li>
                <li>Marketing cookies for targeted advertising</li>
              </ul>
              <p className="mt-4">
                You can control cookie preferences through your browser settings.
              </p>
            </div>
          </section>

          {/* Children's Privacy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Children's Privacy</h2>
            <p className="text-gray-600">
              Our services are not intended for children under 13. We do not knowingly collect or maintain information from children under 13.
            </p>
          </section>

          {/* Changes to Privacy Policy */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Changes to This Policy</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Posting the new policy on this page</li>
                <li>Sending an email notification</li>
                <li>Displaying a notice in your account dashboard</li>
              </ul>
            </div>
          </section>

          {/* Contact Information */}
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                If you have any questions about this Privacy Policy, please contact us:
              </p>
              <ul className="list-disc pl-6">
                <li>Email: privacy@yourdomain.com</li>
                <li>Address: [Your Company Address]</li>
                <li>Phone: [Your Privacy Team Phone Number]</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Trust Badge */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-center gap-4 text-gray-500">
            <ShieldCheckIcon className="h-6 w-6 text-green-500" />
            <p className="text-sm">
              Your data is protected by industry-leading security measures
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 