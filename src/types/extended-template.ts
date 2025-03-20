import { BlockType as BaseBlockType, BlockContent as BaseBlockContent, Block as BaseBlock, Template as BaseTemplate } from './template';

// Extended BlockType with dropshipping-specific blocks
export type ExtendedBlockType = BaseBlockType | 
  'button' |
  'social' |
  'product-card' |
  'shipping-info' |
  'inventory-status' |
  'price-comparison';

// Extended BlockContent with dropshipping-specific properties
export interface ExtendedBlockContent extends BaseBlockContent {
  // Product card properties
  compareAtPrice?: string;
  inventory?: number;
  shippingDays?: string;
  buttonText?: string;
  buttonUrl?: string;
  
  // Shipping info properties
  methods?: Array<{
    name: string;
    deliveryTime: string;
    price: string;
  }>;
  
  // Inventory status properties
  itemsLeft?: number;
  showCounter?: boolean;
  urgencyText?: string;
  
  // Price comparison properties
  retailPrice?: string;
  yourPrice?: string;
  savingsText?: string;
  currency?: string;
  showSavingsPercentage?: boolean;
  
  // Layout properties
  alignment?: 'left' | 'center' | 'right';
  
  // Image can be specified as a string (for backward compatibility)
  image?: string;
}

// Extended Block with extended types
export interface ExtendedBlock extends Omit<BaseBlock, 'type' | 'content'> {
  type: ExtendedBlockType;
  content: ExtendedBlockContent;
}

// Extended Template with extended block type
export interface ExtendedTemplate extends Omit<BaseTemplate, 'blocks'> {
  blocks: ExtendedBlock[];
}

// For compatibility with existing code, make the extended types available under the same names
export type { ExtendedBlockType as BlockType };
export type { ExtendedBlockContent as BlockContent };
export type { ExtendedBlock as Block };
export type { ExtendedTemplate as Template }; 