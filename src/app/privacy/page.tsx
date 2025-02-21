import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-8 py-6">
          <h1 className="text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="text-indigo-100 mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>
        
        <div className="p-8">
          <div className="prose prose-indigo max-w-none">
            <p className="text-lg text-gray-700 mb-8">
              At FussionFlux, we understand the importance of protecting your privacy and securing your data. 
              This Privacy Policy outlines our practices for collecting, using, and safeguarding your information 
              when you use our email marketing platform.
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Information We Collect</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Account Information</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Name and contact information</li>
                  <li>Login credentials and authentication data</li>
                  <li>Billing information and transaction history</li>
                  <li>Company details and business information</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mt-6 mb-4">Platform Usage Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Email campaign statistics and performance metrics</li>
                  <li>Subscriber list information and engagement data</li>
                  <li>A/B testing results and analytics</li>
                  <li>Platform interaction patterns and preferences</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mt-6 mb-4">Technical Data</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>IP addresses and device information</li>
                  <li>Browser type and operating system details</li>
                  <li>Usage statistics and crash reports</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">How We Use Your Information</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-xl font-medium text-gray-900 mb-4">Service Provision</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Delivering email marketing capabilities and features</li>
                  <li>Processing and analyzing campaign performance</li>
                  <li>Providing customer support and technical assistance</li>
                  <li>Managing your account and subscription</li>
                </ul>

                <h3 className="text-xl font-medium text-gray-900 mt-6 mb-4">Platform Improvement</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Enhancing platform features and functionality</li>
                  <li>Developing new services and capabilities</li>
                  <li>Analyzing usage patterns for optimization</li>
                  <li>Conducting research and development</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Data Protection Measures</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Industry-standard encryption for data transmission</li>
                  <li>Secure cloud infrastructure with regular security audits</li>
                  <li>Regular security assessments and penetration testing</li>
                  <li>Strict access controls and authentication protocols</li>
                  <li>Regular data backups and disaster recovery procedures</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Your Data Rights</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Access and download your personal data</li>
                  <li>Request corrections or updates to your information</li>
                  <li>Delete your account and associated data</li>
                  <li>Opt-out of marketing communications</li>
                  <li>Export your campaign and subscriber data</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Third-Party Services</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">We integrate with trusted third-party services to enhance our platform's functionality:</p>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li>Payment processing services</li>
                  <li>Email delivery providers</li>
                  <li>Analytics and tracking services</li>
                  <li>Customer support tools</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Data Retention</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">We retain your information for as long as your account is active or as needed to provide services. You can request data deletion at any time through your account settings or by contacting our support team.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Policy Updates</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700">We regularly review and update our privacy policy to reflect platform changes and regulatory requirements. We'll notify you of significant changes via email or platform notifications.</p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-indigo-600 mb-4">Contact Information</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-gray-700 mb-4">For privacy-related inquiries or concerns, please contact us:</p>
                <ul className="text-gray-700 space-y-2">
                  <li><strong>Email:</strong> privacy@fussionflux.com</li>
                  <li><strong>Address:</strong> [Your Company Address]</li>
                  <li><strong>Phone:</strong> [Your Contact Number]</li>
                </ul>
              </div>
            </section>
          </div>
        </div>

        <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            By using FussionFlux, you agree to the terms outlined in this Privacy Policy. 
            If you have questions or concerns, please don't hesitate to contact our support team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy; 