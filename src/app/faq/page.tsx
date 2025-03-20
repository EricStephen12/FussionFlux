'use client';

import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Script from 'next/script';
import { generateFAQSchema } from '@/utils/seo';

interface FAQ {
  question: string;
  answer: string | React.ReactNode;
  category: string;
}

const faqs: FAQ[] = [
  {
    question: 'What is the Dropship Email Platform?',
    answer: 'The Dropship Email Platform is a comprehensive email marketing solution designed specifically for dropshipping businesses. It helps you create, manage, and optimize email campaigns to drive sales and build customer relationships.',
    category: 'General'
  },
  {
    question: 'How do I get started with the platform?',
    answer: 'Sign up for an account, complete your profile setup, and you\'ll be guided through a simple onboarding process. You can start with our free trial to explore the features before committing to a paid plan.',
    category: 'Getting Started'
  },
  {
    question: 'Is there a free trial available?',
    answer: 'Yes, we offer a 14-day free trial that includes access to most of our features with limits on the number of emails, contacts, and SMS you can send.',
    category: 'Pricing & Billing'
  },
  {
    question: 'What happens when my trial expires?',
    answer: 'When your trial expires, you\'ll need to upgrade to a paid plan to continue using the platform. Your data will be preserved, but you won\'t be able to send new campaigns until you subscribe.',
    category: 'Pricing & Billing'
  },
  {
    question: 'How do I upgrade my subscription?',
    answer: 'Go to the Subscription page in your dashboard and select the plan that best fits your needs. You can upgrade at any time to increase your limits and access more features.',
    category: 'Pricing & Billing'
  },
  {
    question: 'Can I downgrade or cancel my subscription?',
    answer: 'Yes, you can downgrade or cancel your subscription at any time from the Billing page. Your subscription remains active until the end of your current billing period.',
    category: 'Pricing & Billing'
  },
  {
    question: 'How many emails can I send per month?',
    answer: 'The number of emails you can send depends on your subscription tier. Free trial users can send up to 250 emails, Starter plan users can send up to 5,000 emails, Growth plan users can send up to 15,000 emails, and Pro plan users can send up to 50,000 emails per month.',
    category: 'Usage & Limits'
  },
  {
    question: 'How do I import my existing contacts?',
    answer: 'You can import contacts by going to the Contacts section and using our import tool. We support CSV and Excel file formats, and you can map your fields during the import process.',
    category: 'Leads & Contacts'
  },
  {
    question: 'What is lead scoring and how does it work?',
    answer: 'Lead scoring is a methodology that ranks leads based on their value to your business. Our platform automatically scores leads based on criteria like engagement, company size, and job title to help you prioritize your outreach efforts.',
    category: 'Leads & Contacts'
  },
  {
    question: 'How do I create an email campaign?',
    answer: 'Go to the Campaigns section and click "Create New Campaign". You\'ll be guided through a step-by-step process to select your audience, choose or create a template, customize your content, and schedule your campaign.',
    category: 'Campaigns'
  },
  {
    question: 'What is A/B testing and how do I use it?',
    answer: 'A/B testing allows you to compare two versions of an email to see which performs better. When creating a campaign, enable A/B testing to create variant versions with different subject lines, content, or send times.',
    category: 'Campaigns'
  },
  {
    question: 'How do I track the performance of my campaigns?',
    answer: 'Each campaign has its own analytics dashboard that shows metrics like open rate, click-through rate, and conversions. You can also view aggregate analytics for all campaigns in the Analytics section.',
    category: 'Analytics & Reporting'
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept credit/debit cards through Flutterwave, PayPal, and cryptocurrency payments through NOWPayments.',
    category: 'Pricing & Billing'
  },
  {
    question: 'Is my data secure?',
    answer: 'Yes, we take data security seriously. We use encryption for all data transfers, secure our databases with industry-standard practices, and never share your data with third parties without your consent.',
    category: 'Security & Privacy'
  },
  {
    question: 'How can I get support if I have problems?',
    answer: (
      <>
        You can contact our support team through the <Link href="/support" className="text-indigo-600 hover:text-indigo-500">Support page</Link>, email us at support@dropshipemailplatform.com, or check our <Link href="/docs" className="text-indigo-600 hover:text-indigo-500">Documentation</Link> for self-help resources.
      </>
    ),
    category: 'Support'
  }
];

const categories = [...new Set(faqs.map(faq => faq.category))];

export default function FAQPage() {
  const [expandedFAQs, setExpandedFAQs] = useState<{ [key: string]: boolean }>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const toggleFAQ = (question: string) => {
    setExpandedFAQs(prev => ({
      ...prev,
      [question]: !prev[question]
    }));
  };

  const filteredFAQs = selectedCategory 
    ? faqs.filter(faq => faq.category === selectedCategory)
    : faqs;

  // Extract questions and answers in plain text for schema
  const faqItems = faqs.map(faq => ({
    question: faq.question,
    answer: typeof faq.answer === 'string' 
      ? faq.answer 
      : 'Please visit our FAQ page for a detailed answer to this question.'
  }));
  
  const faqSchema = generateFAQSchema(faqItems);

  return (
    <>
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: faqSchema }}
      />
      <div className="bg-white min-h-screen">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
            <h1 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-center text-lg text-gray-500 mb-8">
              Find answers to the most common questions about our platform
            </p>

            {/* Category filter */}
            <div className="mt-6 mb-8 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedCategory === null
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <dl className="mt-6 space-y-6 divide-y divide-gray-200">
              {filteredFAQs.map((faq, index) => (
                <div
                  key={index}
                  className={`pt-6 ${index !== 0 ? 'border-t border-gray-200' : ''}`}
                >
                  <dt className="text-lg">
                    <button
                      onClick={() => toggleFAQ(faq.question)}
                      className="text-left w-full flex justify-between items-start text-gray-800 focus:outline-none"
                    >
                      <span className="font-medium text-gray-900">{faq.question}</span>
                      <span className="ml-6 h-7 flex items-center">
                        {expandedFAQs[faq.question] ? (
                          <ChevronUpIcon className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <ChevronDownIcon className="h-5 w-5 text-indigo-600" />
                        )}
                      </span>
                    </button>
                  </dt>
                  {expandedFAQs[faq.question] && (
                    <dd className="mt-2 pr-12">
                      <p className="text-base text-gray-600">{faq.answer}</p>
                    </dd>
                  )}
                </div>
              ))}
            </dl>
          </div>

          <div className="mt-16 bg-indigo-50 rounded-2xl p-8 max-w-3xl mx-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
              Still have questions?
            </h2>
            <p className="text-center text-gray-600 mb-6">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex justify-center">
              <Link
                href="/support"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 