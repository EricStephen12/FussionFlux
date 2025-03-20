import React from 'react';
import Script from 'next/script';

export default function HomeSEO() {
  // Create structured data for the homepage using Schema.org Organization and WebSite
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://dropship-email-platform.com/#organization',
        'name': 'Dropship Email Platform',
        'url': 'https://dropship-email-platform.com',
        'logo': {
          '@type': 'ImageObject',
          'url': 'https://dropship-email-platform.com/logo.png',
          'width': 280,
          'height': 80
        },
        'description': 'Professional email marketing platform designed specifically for dropshippers. Automate campaigns, increase conversions, and grow your e-commerce business with our powerful tools.',
        'sameAs': [
          'https://twitter.com/dropshipemail',
          'https://www.facebook.com/dropshipemail',
          'https://www.linkedin.com/company/dropshipemail',
          'https://www.instagram.com/dropshipemail'
        ],
        'contactPoint': {
          '@type': 'ContactPoint',
          'telephone': '+1-800-EMAIL-PRO',
          'contactType': 'customer service',
          'availableLanguage': 'English'
        }
      },
      {
        '@type': 'WebSite',
        '@id': 'https://dropship-email-platform.com/#website',
        'url': 'https://dropship-email-platform.com',
        'name': 'Dropship Email Platform',
        'description': 'Email Marketing for E-commerce Success',
        'publisher': {
          '@id': 'https://dropship-email-platform.com/#organization'
        },
        'potentialAction': {
          '@type': 'SearchAction',
          'target': 'https://dropship-email-platform.com/search?q={search_term_string}',
          'query-input': 'required name=search_term_string'
        }
      },
      {
        '@type': 'WebPage',
        '@id': 'https://dropship-email-platform.com/#webpage',
        'url': 'https://dropship-email-platform.com',
        'name': 'Dropship Email Platform - Email Marketing for E-commerce Success',
        'description': 'Professional email marketing platform designed specifically for dropshippers. Automate campaigns, increase conversions, and grow your e-commerce business with our powerful tools.',
        'isPartOf': {
          '@id': 'https://dropship-email-platform.com/#website'
        },
        'about': {
          '@id': 'https://dropship-email-platform.com/#organization'
        }
      },
      {
        '@type': 'SoftwareApplication',
        'name': 'Dropship Email Platform',
        'operatingSystem': 'Web',
        'applicationCategory': 'BusinessApplication',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'USD'
        }
      }
    ]
  };

  return (
    <Script 
      id="homepage-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
} 