export type BlockType = 
| 'hero' 
| 'featured-collection' 
| 'promotion' 
| 'testimonial' 
| 'countdown' 
| 'text' 
| 'image' 
| 'product' 
| 'header' 
| 'footer'
| 'social-proof'
| 'cart'
| 'grid'
| 'product-grid'
| 'features'
| 'benefits'
| 'newsletter-signup'
| 'divider'
| 'spacer'
| 'video' // Add this line
| 'social-share' // Add this line
| 'menu' // Add this line
| 'custom-block'
| 'advanced-block';

export interface Review {
  text: string;
  author: string;
  role?: string;
  rating: number;
  avatar?: string;
  date?: string;
  name: string;
}

export interface Item {
  name: string;
  description: string;
  price: string;
}

export interface BlockContent {
  // Text Content
  title?: string;
  subtitle?: string;
  text?: string;
  description?: string;
  quote?: string;
  author?: string;
  role?: string;

  // Media
  imageUrl?: string;
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  alt?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  avatar?: string;

  // Layout & Style
  layout?: 'centered' | 'image-left' | 'image-right' | 'overlay' | 'grid' | 'list' | 'carousel' | 'alternating';
  columns?: number;
  align?: 'left' | 'center' | 'right';
  width?: string;
  height?: string;
  backgroundColor?: string;
  textColor?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  fontSize?: string;

  // Interactive Elements
  button?: {
    text: string;
    style: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'outline' | 'link';
    url?: string;
    gradient?: string;
  };
  placeholder?: string;

  // E-commerce
  productId?: string;
  price?: string;
  products?: Array<{
    id: string;
    title: string;
    description?: string;
    price: string;
    imageUrl: string;
    url: string;
    button?: {
      text: string;
      style?: string;
    };
  }>;
  showPrice?: boolean;
  showDescription?: boolean;
  showQuantity?: boolean;
  discount?: string;
  code?: string;
  expiryDate?: string;

  // Features Section
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;

  // Social & Reviews
  reviews?: Array<{
    text: string;
    author: string;
    role?: string;
    rating: number;
    avatar?: string;
    date?: string;
  }>;
  socialLinks?: {
    [platform: string]: string;
  };
  facebookUrl?: string;
  twitterUrl?: string;
  linkedinUrl?: string;
  instagramUrl?: string;

  // Timer & Countdown
  days?: string;
  hours?: string;
  minutes?: string;
  seconds?: string;

  // Header & Footer
  logo?: {
    url: string;
    width?: string;
    height?: string;
    alt?: string;
  };
  navigation?: {
    links: Array<{ text: string; url: string }>;
  };
  companyName?: string;
  address?: string;
  copyright?: string;
  showUnsubscribe?: boolean;
  unsubscribeText?: string;

  // Advanced Styling
  style?: string;
  color?: string;

  // Personalization
  personalization?: {
    fields: string[];
    fallback?: string;
  };

  // Analytics
  trackingId?: string;
  utmParams?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };

  items?: Array<{ name: string; description: string; }>;
}

export interface Block {
  id: string;
  type: BlockType;
  content: BlockContent;
}

export interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'draft' | 'published';
  blocks: Block[];
  isPreset?: boolean;
  lastModified: string;
  audienceType?: string;
  automation?: {
    triggerType: 'immediate' | 'scheduled' | 'event-based';
    scheduledDate?: string;
    scheduledTime?: string;
    eventTrigger?: string;
    delay?: number;
    conditions?: string[];
  };
  sms?: {
    enabled: boolean;
    message?: string;
    sendTime?: 'with-email' | 'before-email' | 'after-email';
    delay?: number;
    consent?: boolean;
  };
  analytics?: {
    enableTracking?: boolean;
    trackOpens?: boolean;
    trackClicks?: boolean;
    trackConversions?: boolean;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  };
}

export type { Template as EmailTemplate };

export interface PresetTemplate {
  name: string;
  blocks: Block[];
} 