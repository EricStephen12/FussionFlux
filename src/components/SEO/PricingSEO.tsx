import React from 'react';
import Script from 'next/script';
import { SUBSCRIPTION_TIERS } from '@/types/subscription';

export default function PricingSEO() {
  // Convert subscription tiers to Schema.org Offers
  const offers = Object.keys(SUBSCRIPTION_TIERS).map(tierId => {
    const tier = SUBSCRIPTION_TIERS[tierId];
    return {
      '@type': 'Offer',
      'name': tier.name,
      'description': tier.description || `${tier.name} plan for email marketing`,
      'price': tier.price.toString(),
      'priceCurrency': 'USD',
      'priceValidUntil': new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // Valid for 1 year
      'url': `https://dropship-email-platform.com/pricing#${tierId}`,
      'itemOffered': {
        '@type': 'Service',
        'name': `${tier.name} Email Marketing Plan`,
        'description': tier.description || `Email marketing plan with ${tier.maxEmails} emails`,
      }
    };
  });

  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': 'https://dropship-email-platform.com/pricing/#webpage',
        'url': 'https://dropship-email-platform.com/pricing',
        'name': 'Pricing Plans - Dropship Email Platform',
        'description': 'Choose the right email marketing plan for your dropshipping business. From free trials to professional plans with advanced features.',
        'isPartOf': {
          '@id': 'https://dropship-email-platform.com/#website'
        }
      },
      {
        '@type': 'Product',
        '@id': 'https://dropship-email-platform.com/pricing/#product',
        'name': 'Dropship Email Platform',
        'description': 'Professional email marketing platform designed specifically for dropshippers',
        'brand': {
          '@type': 'Brand',
          'name': 'Dropship Email Platform'
        },
        'offers': {
          '@type': 'AggregateOffer',
          'priceCurrency': 'USD',
          'lowPrice': '0',
          'highPrice': '199',
          'offerCount': offers.length,
          'offers': offers
        }
      }
    ]
  };

  return (
    <Script 
      id="pricing-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 