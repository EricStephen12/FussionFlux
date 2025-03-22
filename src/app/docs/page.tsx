'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

interface DocSection {
  title: string;
  id: string;
  content: string;
  subSections?: DocSection[];
}

const DOCUMENTATION: DocSection[] = [
  {
    title: 'Getting Started',
    id: 'getting-started',
    content: 'Welcome to our Dropship Email Platform documentation! This guide will help you get started with our platform and make the most of its features.',
    subSections: [
      {
        title: 'Account Setup',
        id: 'account-setup',
        content: 'Create your account, verify your email, and set up your profile with your business information to get started.'
      },
      {
        title: 'Dashboard Overview',
        id: 'dashboard-overview',
        content: 'Get familiar with your dashboard where you can monitor campaigns, view analytics, and access all platform features.'
      },
      {
        title: 'Subscription Plans',
        id: 'subscription-plans',
        content: 'Learn about our different subscription tiers and choose the one that best fits your business needs.'
      }
    ]
  },
  {
    title: 'Email Campaigns',
    id: 'email-campaigns',
    content: 'Create, manage, and track your email campaigns to effectively reach your audience.',
    subSections: [
      {
        title: 'Creating a Campaign',
        id: 'creating-campaign',
        content: 'Follow our step-by-step guide to create your first email campaign, from selecting a template to scheduling your send.'
      },
      {
        title: 'Audience Selection',
        id: 'audience-selection',
        content: 'Learn how to segment your audience and target specific groups of leads based on various criteria.'
      },
      {
        title: 'A/B Testing',
        id: 'ab-testing',
        content: 'Use A/B testing to optimize your email campaigns by comparing different subject lines, content, or send times.'
      },
      {
        title: 'Campaign Analytics',
        id: 'campaign-analytics',
        content: 'Track the performance of your campaigns with detailed analytics on open rates, click-through rates, and conversions.'
      }
    ]
  },
  {
    title: 'Lead Management',
    id: 'lead-management',
    content: 'Effectively manage your leads to maximize conversion rates and grow your business.',
    subSections: [
      {
        title: 'Importing Leads',
        id: 'importing-leads',
        content: 'Learn how to import your existing leads from CSV files or other platforms into our system.'
      },
      {
        title: 'Lead Scoring',
        id: 'lead-scoring',
        content: 'Understand how our lead scoring system works to prioritize your most valuable prospects.'
      },
      {
        title: 'Lead Nurturing',
        id: 'lead-nurturing',
        content: 'Develop effective lead nurturing strategies to move prospects through your sales funnel.'
      }
    ]
  },
  {
    title: 'Templates',
    id: 'templates',
    content: 'Create and customize email templates to maintain consistent branding and save time.',
    subSections: [
      {
        title: 'Using Pre-built Templates',
        id: 'prebuilt-templates',
        content: 'Browse our library of professionally designed email templates and select the ones that best fit your needs.'
      },
      {
        title: 'Creating Custom Templates',
        id: 'custom-templates',
        content: 'Design your own custom templates with our intuitive drag-and-drop editor to match your brand.'
      },
      {
        title: 'Template Best Practices',
        id: 'template-best-practices',
        content: 'Follow our best practices for creating effective email templates that drive engagement and conversions.'
      }
    ]
  },
  {
    title: 'Billing & Subscriptions',
    id: 'billing-subscriptions',
    content: 'Manage your subscription, billing information, and understand our pricing structure.',
    subSections: [
      {
        title: 'Managing Your Subscription',
        id: 'managing-subscription',
        content: 'Learn how to upgrade, downgrade, or cancel your subscription as your business needs change.'
      },
      {
        title: 'Payment Methods',
        id: 'payment-methods',
        content: 'Add, update, or remove payment methods to ensure uninterrupted service.'
      },
      {
        title: 'Credits & Limits',
        id: 'credits-limits',
        content: 'Understand how credits work, what limits apply to your plan, and how to purchase additional credits if needed.'
      }
    ]
  }
];

export default function Documentation() {
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({
    'getting-started': true
  });
  const [isLargeScreen, setIsLargeScreen] = useState(true); // Set default to true for SSR

  useEffect(() => {
    // Only update isLargeScreen after component mounts
    setIsLargeScreen(window.innerWidth >= 1024);

    function handleResize() {
      setIsLargeScreen(window.innerWidth >= 1024);
    }
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (id: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Documentation
          </h1>
          <p className="mt-4 text-lg text-gray-500">
            Everything you need to know about using our Dropship Email Platform
          </p>
        </div>

        <div className="flex flex-col lg:flex-row">
          {/* Sidebar */}
          <div className="lg:w-1/4 pr-8 hidden lg:block">
            <div className="sticky top-8">
              <nav className="space-y-1">
                {DOCUMENTATION.map(section => (
                  <div key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-gray-800 hover:text-indigo-600 font-medium block py-2"
                    >
                      {section.title}
                    </a>
                    {section.subSections && (
                      <div className="pl-4 space-y-1 mt-1">
                        {section.subSections.map(subSection => (
                          <a
                            key={subSection.id}
                            href={`#${subSection.id}`}
                            className="text-gray-600 hover:text-indigo-600 block py-1 text-sm"
                          >
                            {subSection.title}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900">Need more help?</h3>
                <div className="mt-4 space-y-4">
                  <Link href="/support" className="text-indigo-600 hover:text-indigo-500 block text-sm">
                    Contact Support
                  </Link>
                  <Link href="/faq" className="text-indigo-600 hover:text-indigo-500 block text-sm">
                    Frequently Asked Questions
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {DOCUMENTATION.map(section => (
              <div key={section.id} className="mb-12" id={section.id}>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-lg text-gray-700 mb-6">{section.content}</p>

                {/* Mobile Section Toggle */}
                <div className="lg:hidden mb-4">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="flex items-center justify-between w-full text-left px-4 py-2 border rounded-md"
                  >
                    <span className="font-medium">Subsections</span>
                    {expandedSections[section.id] ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronRightIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                {/* Subsections */}
                {(expandedSections[section.id] || isLargeScreen) && section.subSections && (
                  <div className="space-y-8 mt-6">
                    {section.subSections.map(subSection => (
                      <div key={subSection.id} id={subSection.id} className="p-6 bg-gray-50 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-900 mb-3">{subSection.title}</h3>
                        <p className="text-gray-700">{subSection.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <div className="bg-gray-50 rounded-lg p-6 mt-8">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Still need help?</h3>
              <p className="text-gray-700 mb-4">
                If you couldn't find what you were looking for in our documentation, our support team is ready to assist you.
              </p>
              <Link 
                href="/support" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 