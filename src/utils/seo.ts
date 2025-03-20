import { Metadata } from 'next';

/**
 * Generate metadata for SEO optimization
 *
 * @param title Page title
 * @param description Page description
 * @param path Path relative to the domain (e.g., '/blog/post-slug')
 * @param image Path to the main image for social sharing
 * @param type Content type (default: 'website')
 * @param tags Array of keywords/tags
 * @returns Metadata object with SEO optimizations
 */
export function generateMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  tags = [],
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: 'website' | 'article' | 'product';
  tags?: string[];
}): Metadata {
  const baseUrl = 'https://dropship-email-platform.com';
  const url = `${baseUrl}${path}`;
  const imageUrl = image ? (image.startsWith('http') ? image : `${baseUrl}${image}`) : `${baseUrl}/og-image.jpg`;

  return {
    title,
    description,
    keywords: tags,
    robots: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Dropship Email Platform',
      locale: 'en_US',
      type,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      site: '@dropshipemail',
      creator: '@dropshipemail',
      images: [imageUrl],
    },
    alternates: {
      canonical: url,
    },
  };
}

/**
 * Generate JSON-LD schema for articles/blog posts
 *
 * @param title Article title
 * @param description Article description 
 * @param url Full URL to the article
 * @param image URL to the main image
 * @param publishDate Publication date ISO string
 * @param modifiedDate Last modified date ISO string
 * @param authorName Author name
 * @param authorUrl URL to author page/profile
 * @returns Stringified JSON-LD schema for articles
 */
export function generateArticleSchema({
  title,
  description,
  url,
  image,
  publishDate,
  modifiedDate,
  authorName,
  authorUrl,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  publishDate: string;
  modifiedDate: string;
  authorName: string;
  authorUrl: string;
}): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image,
    datePublished: publishDate,
    dateModified: modifiedDate,
    author: {
      '@type': 'Person',
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Dropship Email Platform',
      url: 'https://dropship-email-platform.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://dropship-email-platform.com/logo.png',
        width: 280,
        height: 80,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };

  return JSON.stringify(schema);
}

/**
 * Generate JSON-LD schema for FAQ pages
 *
 * @param questions Array of questions and answers
 * @returns Stringified JSON-LD schema for FAQs
 */
export function generateFAQSchema(questions: Array<{ question: string; answer: string }>): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return JSON.stringify(schema);
} 