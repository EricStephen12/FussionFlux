'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function ReferralTermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link href="/dashboard/referrals" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 mb-8">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Referrals
          </Link>
          <h1 className="text-4xl font-bold text-gray-900">Referral Program Terms</h1>
          <p className="mt-4 text-lg text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Program Overview</h2>
            <p className="text-gray-600 mb-4">
              Our Referral Program allows you to earn rewards by inviting others to join our platform. By participating in this program, 
              you agree to these terms and conditions in addition to our general Terms of Service.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                2.1. You must have an active account in good standing to participate in our Referral Program.
              </p>
              <p>
                2.2. Employees, contractors, and affiliates of our company are not eligible to participate.
              </p>
              <p>
                2.3. We reserve the right to determine eligibility at our sole discretion.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Referral Process</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                3.1. Each eligible user receives a unique referral link to share with potential new users.
              </p>
              <p>
                3.2. The referred person must use your referral link when signing up for our service.
              </p>
              <p>
                3.3. Self-referrals or creating multiple accounts to take advantage of the program are prohibited.
              </p>
              <p>
                3.4. The referral must be made before the referred person creates an account.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Rewards</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                4.1. You will receive 500 email credits and 100 SMS credits for each successful referral.
              </p>
              <p>
                4.2. A "successful referral" means the person you referred has:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Signed up using your referral link</li>
                <li>Created a valid account</li>
                <li>Used the service according to our general Terms of Service</li>
              </ul>
              <p>
                4.3. Rewards will be credited to your account within 7 days of a successful referral.
              </p>
              <p>
                4.4. As you reach certain referral milestones, you may qualify for higher tier rewards:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Starter Tier (5+ referrals):</strong> 500 Email + 100 SMS Credits per referral</li>
                <li><strong>Growth Tier (15+ referrals):</strong> 1000 Email + 250 SMS Credits per referral</li>
                <li><strong>Pro Tier (30+ referrals):</strong> 2000 Email + 500 SMS Credits per referral</li>
              </ul>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Restrictions</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                5.1. You may not use spam, automated systems, or other deceptive means to distribute your referral link.
              </p>
              <p>
                5.2. Your referral link may not be posted on coupon sites, rewards sites, or any website or platform where the primary purpose is to promote incentives, discounts, or rewards.
              </p>
              <p>
                5.3. You may not misrepresent our services or make false or misleading statements to potential referrals.
              </p>
              <p>
                5.4. We reserve the right to deny rewards for any referrals that we determine, in our sole discretion, were made fraudulently or in violation of these terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Expiration and Termination</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                6.1. Earned credits do not expire as long as your account remains active.
              </p>
              <p>
                6.2. We reserve the right to modify, suspend, or terminate the Referral Program at any time.
              </p>
              <p>
                6.3. If we suspect fraudulent activity or violation of these terms, we may suspend your participation in the program pending investigation.
              </p>
              <p>
                6.4. We may terminate your participation in the Referral Program and/or void any pending or awarded credits if you violate these terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Program Changes</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                7.1. We reserve the right to modify the Referral Program terms, including the reward structure, at any time.
              </p>
              <p>
                7.2. We will notify you of any material changes via email or through our platform.
              </p>
              <p>
                7.3. Your continued participation in the program after changes constitutes acceptance of the new terms.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Tax Implications</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                8.1. You are responsible for any tax implications resulting from receiving referral rewards.
              </p>
              <p>
                8.2. We may be required to collect tax information from you if your rewards exceed certain thresholds.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Contact Information</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                For any questions about the Referral Program, please contact us at:
              </p>
              <ul className="list-disc pl-6">
                <li>Email: support@dropship-email.com</li>
                <li>Phone: Our Support Team at 1-800-EMAIL-PRO</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            By participating in our Referral Program, you acknowledge that you have read and understand these terms.
          </p>
        </div>
      </div>
    </div>
  );
} 