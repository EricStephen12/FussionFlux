import React from 'react';
import Script from 'next/script';

export default function FeaturesSEO() {
  // Features list for structured data
  const features = [
    {
      name: 'Email Automation',
      description: 'Create automated email sequences to nurture leads and increase conversions without manual work.',
      image: 'https://dropship-email-platform.com/images/features/email-automation.jpg',
      url: 'https://dropship-email-platform.com/features/email-automation'
    },
    {
      name: 'SMS Marketing',
      description: 'Reach customers instantly with targeted SMS messages that complement your email campaigns.',
      image: 'https://dropship-email-platform.com/images/features/sms-marketing.jpg',
      url: 'https://dropship-email-platform.com/features/sms-marketing'
    },
    {
      name: 'A/B Testing',
      description: 'Optimize your campaigns by testing different versions to see what drives the best results.',
      image: 'https://dropship-email-platform.com/images/features/ab-testing.jpg',
      url: 'https://dropship-email-platform.com/features/a-b-testing'
    },
    {
      name: 'Analytics Dashboard',
      description: 'Track your campaign performance with comprehensive analytics and visual reports.',
      image: 'https://dropship-email-platform.com/images/features/analytics-dashboard.jpg',
      url: 'https://dropship-email-platform.com/features/analytics-dashboard'
    },
    {
      name: 'Lead Generation',
      description: 'Find and engage with qualified leads in your target market to grow your customer base.',
      image: 'https://dropship-email-platform.com/images/features/lead-generation.jpg',
      url: 'https://dropship-email-platform.com/features/lead-generation'
    }
  ];

  // Create itemListElement for each feature
  const itemListElements = features.map((feature, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'item': {
      '@type': 'SoftwareApplication',
      'name': feature.name,
      'description': feature.description,
      'image': feature.image,
      'url': feature.url,
      'applicationCategory': 'BusinessApplication',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD'
      }
    }
  }));

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://dropship-email-platform.com/features/#webpage',
        'url': 'https://dropship-email-platform.com/features',
        'name': 'Features - Dropship Email Platform',
        'description': 'Discover the powerful features of our email marketing platform designed specifically for dropshippers and e-commerce businesses.',
        'isPartOf': {
          '@id': 'https://dropship-email-platform.com/#website'
        }
      },
      {
        '@type': 'ItemList',
        'itemListElement': itemListElements,
        'numberOfItems': features.length,
        'name': 'Dropship Email Platform Features'
      }
    ]
  };

  return (
    <Script 
      id="features-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 