'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { nicheService } from '@/services/niche';
import {
  DocumentDuplicateIcon,
  CheckIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

interface EmailTemplate {
  id: string;
  title: string;
  subject: string;
  body: string;
  niche: string;
  performance: {
    openRate: number;
    clickRate: number;
    useCount: number;
  };
}

export default function EmailTemplates() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [copied, setCopied] = useState(false);
  const [userNiche, setUserNiche] = useState('');

  useEffect(() => {
    if (user) {
      loadUserNicheAndTemplates();
    }
  }, [user]);

  const loadUserNicheAndTemplates = async () => {
    try {
      setLoading(true);
      const nichePreference = await nicheService.getUserNiche(user!.uid);
      if (nichePreference) {
        setUserNiche(nichePreference.currentNiche);
        // Load templates for the user's niche
        const nicheTemplates = await loadTemplatesForNiche(nichePreference.currentNiche);
        setTemplates(nicheTemplates);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadTemplatesForNiche = async (niche: string): Promise<EmailTemplate[]> => {
    // This would typically come from your backend
    // For now, returning mock data
    return [
      {
        id: '1',
        title: 'Welcome Series - Introduction',
        subject: 'Welcome to [Store Name] - Your Source for [Niche] Products',
        body: `Hi {first_name},

Thank you for showing interest in our [Niche] products! We're excited to have you here.

At [Store Name], we specialize in providing high-quality [Niche] products that [benefit statement].

Here's what you can expect from us:
- Exclusive deals and discounts
- New product announcements
- Expert tips and advice
- Special subscriber-only offers

Stay tuned for our next email where we'll share [teaser for next email].

Best regards,
[Your Name]
[Store Name]`,
        niche: niche,
        performance: {
          openRate: 45.2,
          clickRate: 12.8,
          useCount: 1234,
        },
      },
      {
        id: '2',
        title: 'Product Showcase',
        subject: 'Discover Our Best-Selling [Niche] Products',
        body: `Hello {first_name},

We wanted to share our most popular [Niche] products with you:

1. [Product Name]
   - Key benefit 1
   - Key benefit 2
   - Special price: [Price]

2. [Product Name]
   - Key benefit 1
   - Key benefit 2
   - Special price: [Price]

Shop now and get [special offer/discount].

Best regards,
[Store Name]`,
        niche: niche,
        performance: {
          openRate: 38.5,
          clickRate: 15.3,
          useCount: 987,
        },
      },
      {
        id: '3',
        title: 'Limited Time Offer',
        subject: 'Special [Holiday/Event] Deals on [Niche] Products',
        body: `Hi {first_name},

Don't miss out on our biggest [Holiday/Event] sale!

For a limited time only:
- [Discount details]
- [Special bundle offers]
- [Free shipping terms]

Shop now: [Store URL]

Hurry, offer ends [Date]!

Best regards,
[Store Name]`,
        niche: niche,
        performance: {
          openRate: 42.7,
          clickRate: 18.9,
          useCount: 756,
        },
      },
    ];
  };

  const handleCopyTemplate = (template: EmailTemplate) => {
    navigator.clipboard.writeText(template.body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Email Templates for {userNiche}
        </h3>
        <div className="mt-2 text-sm text-gray-500">
          Choose from our high-performing templates customized for your niche.
          These templates are proven to drive engagement and sales.
        </div>

        <div className="mt-6 space-y-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 hover:border-indigo-500 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-base font-medium text-gray-900">
                    {template.title}
                  </h4>
                  <p className="mt-1 text-sm text-gray-600">
                    Subject: {template.subject}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>{template.performance.openRate}% open rate</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopyTemplate(template)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4 mr-1" />
                    ) : (
                      <DocumentDuplicateIcon className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setSelectedTemplate(
                    selectedTemplate?.id === template.id ? null : template
                  )}
                  className="text-sm text-indigo-600 hover:text-indigo-900"
                >
                  {selectedTemplate?.id === template.id ? 'Hide preview' : 'Show preview'}
                </button>

                {selectedTemplate?.id === template.id && (
                  <div className="mt-2 p-4 bg-gray-50 rounded-md">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                      {template.body}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                <span>{template.performance.useCount} users</span>
                <span>{template.performance.clickRate}% click rate</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 