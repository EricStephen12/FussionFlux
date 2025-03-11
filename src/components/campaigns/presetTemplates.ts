import { Template, Block } from '@/types/template';

export interface Template {
  name: string;
  description: string;
  tier: 'free' | 'starter' | 'growth' | 'pro';
  blocks: any[];
  lastModified: string;
}

export const presetTemplates: Record<string, Template> = {
  'Welcome - Basic': {
    name: 'Welcome - Basic',
    description: 'Simple welcome email for new subscribers',
    tier: 'free',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: {
            url: '/logo.png',
            width: '120px',
            height: 'auto',
            alt: 'Company Logo'
          },
          navigation: {
            links: [
              { text: 'Shop', url: '#' },
              { text: 'About', url: '#' },
              { text: 'Contact', url: '#' }
            ]
          },
          backgroundColor: '#ffffff',
          padding: '24px',
          style: {
            borderBottom: '1px solid #eaeaea'
          }
        }
      },
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: '🚀 Introducing Our Revolutionary Product',
          subtitle: 'Transform Your Experience with AI-Powered Innovation',
          imageUrl: '/images/product-hero.jpg',
          backgroundColor: '#f8fafc',
          padding: '64px 24px',
          button: {
            text: 'Pre-order Now - 20% OFF',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED',
              direction: 'to-right'
            }
          },
          style: {
            titleColor: '#1a1a1a',
            titleFontSize: '48px',
            titleLineHeight: '1.1',
            subtitleColor: '#4a5568',
            subtitleFontSize: '24px',
            subtitleMarginTop: '16px',
            ctaMarginTop: '32px',
            layout: 'image-right',
            imageWidth: '50%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          },
          personalization: {
            fields: ['firstName', 'industry'],
            fallback: 'valued customer'
          }
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Game-Changing Features',
          subtitle: 'Discover why our product is revolutionizing the industry',
          columns: 3,
          items: [
            {
              icon: '⚡️',
              title: '10x Faster',
              description: 'AI-powered automation saves hours of manual work'
            },
            {
              icon: '🎯',
              title: 'Precision Perfect',
              description: 'Advanced algorithms ensure 99.9% accuracy'
            },
            {
              icon: '🔒',
              title: 'Enterprise Security',
              description: 'Bank-grade encryption and compliance'
            }
          ],
          style: {
            backgroundColor: '#ffffff',
            padding: '80px 24px',
            titleColor: '#1a1a1a',
            titleFontSize: '36px',
            itemSpacing: '32px',
            iconSize: '48px',
            layout: 'grid',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      {
        id: 'social-proof-1',
        type: 'social-proof',
        content: {
          title: 'Trusted by Industry Leaders',
          reviews: [
            {
              text: "This product has completely transformed our workflow. ROI increased by 300% in the first month.",
              author: "Sarah Johnson",
              role: "CTO, TechCorp",
              rating: 5,
              avatar: '/images/testimonial-1.jpg'
            },
            {
              text: "The best investment we've made this year. Customer satisfaction is up by 50%.",
              author: "Michael Chen",
              role: "CEO, GrowthStart",
              rating: 5,
              avatar: '/images/testimonial-2.jpg'
            }
          ],
          style: {
            backgroundColor: '#f3f4f6',
            padding: '64px 24px',
            layout: 'grid',
            borderRadius: '16px'
          }
        }
      },
      {
        id: 'promotion-1',
        type: 'promotion',
        content: {
          title: 'Early Bird Special Offer',
          subtitle: 'First 100 customers get 20% off + Premium Support',
          discount: '20% OFF',
          code: 'EARLY20',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          button: {
            text: 'Claim Your Discount',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED',
              direction: 'to-right'
            }
          },
          style: {
            backgroundColor: '#eef2ff',
            padding: '48px 24px',
            titleColor: '#312e81',
            titleFontSize: '32px',
            layout: 'split',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      {
        id: 'countdown-1',
        type: 'countdown',
        content: {
          title: 'Limited Time Offer Ends In:',
          hours: 72,
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          style: {
            backgroundColor: '#fef2f2',
            padding: '32px 24px',
            titleColor: '#991b1b',
            borderRadius: '16px',
            layout: 'centered'
          }
        }
      },
      {
        id: 'newsletter-1',
        type: 'newsletter-signup',
        content: {
          title: 'Stay Updated',
          subtitle: 'Get exclusive early access and special offers',
          button: {
            text: 'Subscribe Now',
            style: 'gradient',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED'
            }
          },
          style: {
            backgroundColor: '#ffffff',
            padding: '48px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ],
    lastModified: new Date().toISOString()
  },

  'Product Launch': {
    name: 'Product Launch',
    description: 'Professional product launch campaign',
    tier: 'starter',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: {
            url: '/logo.png',
            width: '120px',
            height: 'auto',
            alt: 'Company Logo'
          },
          navigation: {
            links: [
              { text: 'Shop', url: '#' },
              { text: 'About', url: '#' },
              { text: 'Contact', url: '#' }
            ]
          },
          backgroundColor: '#ffffff',
          padding: '24px',
          style: {
            borderBottom: '1px solid #eaeaea'
          }
        }
      },
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: '🚀 Introducing Our Revolutionary Product',
          subtitle: 'Transform Your Experience with AI-Powered Innovation',
          imageUrl: '/images/product-hero.jpg',
          backgroundColor: '#f8fafc',
          padding: '64px 24px',
          button: {
            text: 'Pre-order Now - 20% OFF',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED',
              direction: 'to-right'
            }
          },
          style: {
            titleColor: '#1a1a1a',
            titleFontSize: '48px',
            titleLineHeight: '1.1',
            subtitleColor: '#4a5568',
            subtitleFontSize: '24px',
            subtitleMarginTop: '16px',
            ctaMarginTop: '32px',
            layout: 'image-right',
            imageWidth: '50%',
            borderRadius: '16px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
          },
          personalization: {
            fields: ['firstName', 'industry'],
            fallback: 'valued customer'
          }
        }
      },
      {
        id: 'features-1',
        type: 'features',
        content: {
          title: 'Game-Changing Features',
          subtitle: 'Discover why our product is revolutionizing the industry',
          columns: 3,
          items: [
            {
              icon: '⚡️',
              title: '10x Faster',
              description: 'AI-powered automation saves hours of manual work'
            },
            {
              icon: '🎯',
              title: 'Precision Perfect',
              description: 'Advanced algorithms ensure 99.9% accuracy'
            },
            {
              icon: '🔒',
              title: 'Enterprise Security',
              description: 'Bank-grade encryption and compliance'
            }
          ],
          style: {
            backgroundColor: '#ffffff',
            padding: '80px 24px',
            titleColor: '#1a1a1a',
            titleFontSize: '36px',
            itemSpacing: '32px',
            iconSize: '48px',
            layout: 'grid',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      {
        id: 'social-proof-1',
        type: 'social-proof',
        content: {
          title: 'Trusted by Industry Leaders',
          reviews: [
            {
              text: "This product has completely transformed our workflow. ROI increased by 300% in the first month.",
              author: "Sarah Johnson",
              role: "CTO, TechCorp",
              rating: 5,
              avatar: '/images/testimonial-1.jpg'
            },
            {
              text: "The best investment we've made this year. Customer satisfaction is up by 50%.",
              author: "Michael Chen",
              role: "CEO, GrowthStart",
              rating: 5,
              avatar: '/images/testimonial-2.jpg'
            }
          ],
          style: {
            backgroundColor: '#f3f4f6',
            padding: '64px 24px',
            layout: 'grid',
            borderRadius: '16px'
          }
        }
      },
      {
        id: 'promotion-1',
        type: 'promotion',
        content: {
          title: 'Early Bird Special Offer',
          subtitle: 'First 100 customers get 20% off + Premium Support',
          discount: '20% OFF',
          code: 'EARLY20',
          expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          button: {
            text: 'Claim Your Discount',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED',
              direction: 'to-right'
            }
          },
          style: {
            backgroundColor: '#eef2ff',
            padding: '48px 24px',
            titleColor: '#312e81',
            titleFontSize: '32px',
            layout: 'split',
            borderRadius: '16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
          }
        }
      },
      {
        id: 'countdown-1',
        type: 'countdown',
        content: {
          title: 'Limited Time Offer Ends In:',
          hours: 72,
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          style: {
            backgroundColor: '#fef2f2',
            padding: '32px 24px',
            titleColor: '#991b1b',
            borderRadius: '16px',
            layout: 'centered'
          }
        }
      },
      {
        id: 'newsletter-1',
        type: 'newsletter-signup',
        content: {
          title: 'Stay Updated',
          subtitle: 'Get exclusive early access and special offers',
          button: {
            text: 'Subscribe Now',
            style: 'gradient',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED'
            }
          },
          style: {
            backgroundColor: '#ffffff',
            padding: '48px 24px',
            borderRadius: '16px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }
      }
    ],
    lastModified: new Date().toISOString()
  },

  'Abandoned Cart - Advanced': {
    name: 'Abandoned Cart - Advanced',
    description: 'Advanced cart recovery with AI-powered recommendations',
    tier: 'growth',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: {
            url: '/logo.png',
            width: '120px',
            height: 'auto',
            alt: 'Company Logo'
          },
          backgroundColor: '#ffffff',
          padding: '24px'
        }
      },
      {
        id: 'hero-2',
        type: 'hero',
        content: {
          title: 'Don\'t Miss Out on Your Perfect Items!',
          subtitle: 'Complete your purchase and get 10% off',
          imageUrl: '/images/cart-items.jpg',
          button: {
            text: 'Complete Purchase Now',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED'
            }
          },
          style: {
            backgroundColor: '#ffffff',
            padding: '48px 24px',
            titleColor: '#1a1a1a',
            titleFontSize: '32px',
            layout: 'image-left'
          }
        }
      },
      {
        id: 'cart-items',
        type: 'cart',
        content: {
          title: 'Your Cart Items',
          showPrice: true,
          showQuantity: true,
          style: {
            backgroundColor: '#f9fafb',
            padding: '32px 24px',
            borderRadius: '12px',
            layout: 'list'
          }
        }
      },
      {
        id: 'countdown-1',
        type: 'countdown',
        content: {
          title: 'Offer Expires In:',
          hours: 24,
          showDays: false,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          style: {
            backgroundColor: '#fee2e2',
            padding: '32px 24px',
            titleColor: '#991b1b',
            layout: 'centered'
          }
        }
      },
      {
        id: 'social-proof',
        type: 'social-proof',
        content: {
          title: 'What Our Customers Say',
          reviews: [
            {
              text: "Amazing quality and fast shipping!",
              author: "Mike T.",
              rating: 5
            },
            {
              text: "Best purchase I've made this year",
              author: "Lisa R.",
              rating: 5
            }
          ],
          style: {
            backgroundColor: '#ffffff',
            padding: '48px 24px',
            layout: 'grid'
          }
        }
      }
    ],
    lastModified: new Date().toISOString()
  },

  'Welcome Series': {
    id: 'welcome-series',
    name: 'Welcome Series',
    category: 'Onboarding',
    description: 'Engaging welcome series template with special offer',
    status: 'draft',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          logo: {
            url: '/logo.png',
            width: '120px',
            height: 'auto',
            alt: 'Company Logo'
          },
          backgroundColor: '#ffffff',
          padding: '24px'
        }
      },
      {
        id: 'hero-3',
        type: 'hero',
        content: {
          title: '👋 Welcome to Our Community!',
          subtitle: 'Get 15% Off Your First Purchase',
          imageUrl: '/images/welcome-hero.jpg',
          button: {
            text: 'Start Shopping',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4F46E5',
              to: '#7C3AED'
            }
          },
          style: {
            backgroundColor: '#f0fdf4',
            padding: '48px 24px',
            titleColor: '#166534',
            titleFontSize: '36px',
            layout: 'centered'
          }
        }
      },
      {
        id: 'benefits',
        type: 'grid',
        content: {
          columns: 2,
          items: [
            {
              title: 'Member Exclusives',
              description: 'Get early access to sales and special discounts',
              icon: '🎁'
            },
            {
              title: 'Free Shipping',
              description: 'On orders over $50',
              icon: '🚚'
            },
            {
              title: 'Premium Support',
              description: '24/7 customer service',
              icon: '💬'
            },
            {
              title: 'Easy Returns',
              description: '30-day money-back guarantee',
              icon: '↩️'
            }
          ],
          style: {
            backgroundColor: '#ffffff',
            padding: '48px 24px',
            layout: 'alternating'
          }
        }
      },
      {
        id: 'featured-products',
        type: 'product-grid',
        content: {
          title: 'Bestsellers You\'ll Love',
          products: [
            {
              imageUrl: '/images/product-1.jpg',
              title: 'Product 1',
              price: '$99',
              button: {
                text: 'Shop Now',
                style: 'outline'
              }
            },
            {
              imageUrl: '/images/product-2.jpg',
              title: 'Product 2',
              price: '$79',
              button: {
                text: 'Shop Now',
                style: 'outline'
              }
            }
          ],
          style: {
            backgroundColor: '#f9fafb',
            padding: '48px 24px',
            layout: 'grid'
          }
        }
      }
    ],
    lastModified: new Date().toISOString()
  },

  'VIP Customer': {
    name: 'VIP Customer',
    description: 'Exclusive template for VIP customer communications',
    tier: 'pro',
    blocks: [
      // ... existing blocks ...
    ],
    lastModified: new Date().toISOString()
  }
};

// Responsive styles for all templates
export const responsiveStyles = `
  @media (max-width: 768px) {
    .template-block {
      padding: 32px 16px !important;
    }
    
    .template-hero__title {
      font-size: 28px !important;
    }
    
    .template-hero__subtitle {
      font-size: 18px !important;
    }
    
    .template-grid {
      grid-template-columns: 1fr !important;
      gap: 24px !important;
    }
    
    .template-features {
      grid-template-columns: 1fr !important;
    }
    
    .template-button {
      width: 100% !important;
      margin-top: 24px !important;
    }
    
    .template-image {
      width: 100% !important;
      margin: 24px 0 !important;
    }
  }
  
  @media (max-width: 480px) {
    .template-block {
      padding: 24px 16px !important;
    }
    
    .template-hero__title {
      font-size: 24px !important;
    }
    
    .template-hero__subtitle {
      font-size: 16px !important;
    }
    
    .template-button {
      font-size: 16px !important;
      padding: 12px 24px !important;
    }
  }
`;

// Layout options for blocks
export const layoutOptions = {
  hero: ['centered', 'image-left', 'image-right', 'overlay'],
  features: ['grid', 'list', 'carousel'],
  testimonial: ['centered', 'card', 'quote-only'],
  promotion: ['centered', 'split', 'full-width'],
  grid: ['grid', 'list', 'alternating'],
  'product-grid': ['grid', 'list', 'carousel']
};

// Template features by tier
export const templateFeatures = {
  free: {
    maxBlocks: 5,
    availableBlocks: ['text', 'image', 'button', 'spacer', 'divider'],
    customization: 'basic',
    abTesting: {
      variants: 1,      // Only one variant allowed
      features: ['subject-line'] // Only subject line testing
    },
    analytics: {
      basic: true,      // Basic analytics enabled
      advanced: false   // Advanced analytics disabled
    },
    leads: {
      preview: 10,      // Maximum preview leads
      import: 100       // Maximum import contacts
    }
  },
  starter: {
    maxBlocks: 10,
    availableBlocks: ['text', 'image', 'button', 'spacer', 'divider', 'social', 'video'],
    customization: 'standard'
  },
  growth: {
    maxBlocks: 20,
    availableBlocks: ['text', 'image', 'button', 'spacer', 'divider', 'social', 'video', 'countdown', 'product-grid'],
    customization: 'advanced'
  },
  pro: {
    maxBlocks: -1, // unlimited
    availableBlocks: ['text', 'image', 'button', 'spacer', 'divider', 'social', 'video', 'countdown', 'product-grid', 'custom-html', 'advanced-layout'],
    customization: 'full'
  }
}; 