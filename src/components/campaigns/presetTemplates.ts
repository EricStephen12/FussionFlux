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
          title: "Bestsellers You'll Love",
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

// Preset email templates for dropshipping
export const templateCategories = {
  'Product Launch': [
    {
      id: 'product-launch-1',
      name: 'New Product Announcement',
      category: 'Product Launch',
      description: 'Announce new products with a clean, visually appealing layout',
      status: 'active',
      stats: {
        openRate: 42.5,
        clickRate: 12.8
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?product',
      blocks: [
        {
          id: 'header-1',
          type: 'header',
          content: {
            title: 'Introducing Our Latest Product',
            subtitle: 'Limited Time Offer - 20% Off for Early Birds',
            alignment: 'center',
            background: '#ffffff',
            textColor: '#000000'
          }
        },
        {
          id: 'image-1',
          type: 'image',
          content: {
            src: 'https://source.unsplash.com/random/600x400?product',
            alt: 'Product image',
            width: '600px',
            alignment: 'center',
            link: '#'
          }
        },
        {
          id: 'text-1',
          type: 'text',
          content: {
            text: "We're excited to announce our newest addition to the collection. This product has been designed with you in mind, combining quality materials with practical functionality.",
            alignment: 'left',
            textColor: '#333333',
            fontSize: '16px'
          }
        },
        {
          id: 'button-1',
          type: 'button',
          content: {
            text: 'Shop Now',
            link: '#',
            alignment: 'center',
            backgroundColor: '#4F46E5',
            textColor: '#ffffff',
            borderRadius: '4px',
            width: '200px'
          }
        }
      ]
    },
    {
      id: 'product-launch-2',
      name: 'Flash Sale Announcement',
      category: 'Product Launch',
      description: 'Create urgency with a time-limited flash sale template',
      status: 'active',
      stats: {
        openRate: 45.2,
        clickRate: 15.6
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?sale',
      blocks: [
        {
          id: 'header-2',
          type: 'header',
          content: {
            title: '⚡ 24-HOUR FLASH SALE ⚡',
            subtitle: 'Up to 50% Off - Today Only!',
            alignment: 'center',
            background: '#ff3b30',
            textColor: '#ffffff'
          }
        },
        {
          id: 'countdown-1',
          type: 'countdown',
          content: {
            endDate: new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toISOString(),
            title: 'Sale Ends In:',
            alignment: 'center',
            background: '#f8f9fa',
            textColor: '#000000'
          }
        },
        {
          id: 'products-1',
          type: 'products',
          content: {
            title: 'Featured Products',
            products: [
              {
                name: 'Product 1',
                image: 'https://source.unsplash.com/random/300x300?product1',
                price: '$29.99',
                salePrice: '$19.99',
                link: '#'
              },
              {
                name: 'Product 2',
                image: 'https://source.unsplash.com/random/300x300?product2',
                price: '$39.99',
                salePrice: '$24.99',
                link: '#'
              }
            ],
            alignment: 'center'
          }
        },
        {
          id: 'button-2',
          type: 'button',
          content: {
            text: 'SHOP THE SALE',
            link: '#',
            alignment: 'center',
            backgroundColor: '#000000',
            textColor: '#ffffff',
            borderRadius: '0px',
            width: '250px'
          }
        }
      ]
    }
  ],
  'Abandoned Cart': [
    {
      id: 'abandoned-cart-1',
      name: 'Cart Reminder',
      category: 'Abandoned Cart',
      description: 'Remind customers about items left in their cart with a friendly nudge',
      status: 'active',
      stats: {
        openRate: 48.3,
        clickRate: 22.7
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?cart',
      blocks: [
        {
          id: 'header-3',
          type: 'header',
          content: {
            title: 'You left something in your cart!',
            subtitle: 'Your items are waiting for you',
            alignment: 'center',
            background: '#ffffff',
            textColor: '#333333'
          }
        },
        {
          id: 'cart-1',
          type: 'cart',
          content: {
            title: 'Your Cart Items',
            products: [
              {
                name: 'Sample Product',
                image: 'https://source.unsplash.com/random/150x150?product',
                price: '$29.99',
                quantity: 1,
                link: '#'
              }
            ],
            alignment: 'center'
          }
        },
        {
          id: 'text-2',
          type: 'text',
          content: {
            text: "We noticed you left some items in your cart. Don't worry, we've saved them for you! Complete your purchase now to avoid missing out.",
            alignment: 'left',
            textColor: '#333333',
            fontSize: '16px'
          }
        },
        {
          id: 'button-3',
          type: 'button',
          content: {
            text: 'Complete Your Purchase',
            link: '#',
            alignment: 'center',
            backgroundColor: '#4F46E5',
            textColor: '#ffffff',
            borderRadius: '4px',
            width: '250px'
          }
        }
      ]
    }
  ],
  'Welcome': [
    {
      id: 'welcome-1',
      name: 'New Subscriber Welcome',
      category: 'Welcome',
      description: 'Welcome new subscribers with a special discount',
      status: 'active',
      stats: {
        openRate: 52.7,
        clickRate: 18.3
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?welcome',
      blocks: [
        {
          id: 'header-4',
          type: 'header',
          content: {
            title: 'Welcome to Our Store!',
            subtitle: 'Thanks for joining our community',
            alignment: 'center',
            background: '#ffffff',
            textColor: '#333333'
          }
        },
        {
          id: 'image-2',
          type: 'image',
          content: {
            src: 'https://source.unsplash.com/random/600x300?welcome',
            alt: 'Welcome image',
            width: '600px',
            alignment: 'center',
            link: '#'
          }
        },
        {
          id: 'text-3',
          type: 'text',
          content: {
            text: "We're thrilled to have you as part of our community! As a thank you for signing up, we'd like to offer you a special discount on your first purchase.",
            alignment: 'left',
            textColor: '#333333',
            fontSize: '16px'
          }
        },
        {
          id: 'coupon-1',
          type: 'coupon',
          content: {
            code: 'WELCOME15',
            discount: '15% OFF',
            expiry: '30 days',
            alignment: 'center',
            backgroundColor: '#f8f9fa',
            borderColor: '#e9ecef'
          }
        },
        {
          id: 'button-4',
          type: 'button',
          content: {
            text: 'Shop Now',
            link: '#',
            alignment: 'center',
            backgroundColor: '#4F46E5',
            textColor: '#ffffff',
            borderRadius: '4px',
            width: '200px'
          }
        }
      ]
    }
  ],
  'Follow-up': [
    {
      id: 'follow-up-1',
      name: 'Post-Purchase Follow-up',
      category: 'Follow-up',
      description: 'Follow up with customers after their purchase',
      status: 'active',
      stats: {
        openRate: 41.8,
        clickRate: 12.5
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?thanks',
      blocks: [
        {
          id: 'header-5',
          type: 'header',
          content: {
            title: 'Thank You for Your Purchase!',
            subtitle: 'We hope you love your new items',
            alignment: 'center',
            background: '#ffffff',
            textColor: '#333333'
          }
        },
        {
          id: 'text-4',
          type: 'text',
          content: {
            text: "We wanted to reach out and thank you for your recent purchase. We hope you're enjoying your new items! We'd love to hear your feedback.",
            alignment: 'left',
            textColor: '#333333',
            fontSize: '16px'
          }
        },
        {
          id: 'review-1',
          type: 'review',
          content: {
            title: 'Share Your Experience',
            productImage: 'https://source.unsplash.com/random/200x200?product',
            productName: 'Your Recent Purchase',
            alignment: 'center'
          }
        },
        {
          id: 'social-1',
          type: 'social',
          content: {
            title: 'Follow Us',
            platforms: ['facebook', 'instagram', 'tiktok'],
            alignment: 'center',
            iconColor: '#4F46E5'
          }
        },
        {
          id: 'button-5',
          type: 'button',
          content: {
            text: 'Write a Review',
            link: '#',
            alignment: 'center',
            backgroundColor: '#4F46E5',
            textColor: '#ffffff',
            borderRadius: '4px',
            width: '200px'
          }
        }
      ]
    }
  ],
  'Promotional': [
    {
      id: 'promo-1',
      name: 'Seasonal Sale',
      category: 'Promotional',
      description: 'Promote seasonal sales with eye-catching design',
      status: 'active',
      stats: {
        openRate: 38.5,
        clickRate: 16.2
      },
      updatedAt: new Date().toISOString(),
      thumbnail: 'https://source.unsplash.com/random/300x400?seasonal',
      blocks: [
        {
          id: 'header-6',
          type: 'header',
          content: {
            title: 'Season\'s Biggest Sale!',
            subtitle: 'Up to 60% Off Storewide',
            alignment: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            textColor: '#ffffff'
          }
        },
        {
          id: 'image-3',
          type: 'image',
          content: {
            src: 'https://source.unsplash.com/random/600x400?sale',
            alt: 'Sale image',
            width: '600px',
            alignment: 'center',
            link: '#'
          }
        },
        {
          id: 'products-2',
          type: 'products',
          content: {
            title: 'Bestsellers On Sale',
            products: [
              {
                name: 'Product 1',
                image: 'https://source.unsplash.com/random/200x200?product1',
                price: '$49.99',
                salePrice: '$29.99',
                link: '#'
              },
              {
                name: 'Product 2',
                image: 'https://source.unsplash.com/random/200x200?product2',
                price: '$59.99',
                salePrice: '$34.99',
                link: '#'
              },
              {
                name: 'Product 3',
                image: 'https://source.unsplash.com/random/200x200?product3',
                price: '$39.99',
                salePrice: '$19.99',
                link: '#'
              }
            ],
            alignment: 'center'
          }
        },
        {
          id: 'button-6',
          type: 'button',
          content: {
            text: 'Shop All Deals',
            link: '#',
            alignment: 'center',
            backgroundColor: '#ffffff',
            textColor: '#764ba2',
            borderRadius: '30px',
            width: '200px'
          }
        }
      ]
    }
  ]
}; 