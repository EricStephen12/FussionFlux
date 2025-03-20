import React from 'react';
import { ExtendedBlockContent } from '@/types/extended-template';
import Image from 'next/image';
import { TagIcon, TruckIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';

interface ProductCardBlockProps {
  content: ExtendedBlockContent;
  onEdit?: (field: string, value: any) => void;
  isEditing?: boolean;
}

/**
 * A block component for displaying product cards in email templates
 * Specifically designed for dropshipping businesses
 */
export const ProductCardBlock: React.FC<ProductCardBlockProps> = ({
  content,
  onEdit,
  isEditing = false
}) => {
  // Use imageUrl or image property, defaulting to a placeholder
  const imageUrl = content.imageUrl || content.image || 'https://placehold.co/600x400?text=Product+Image';
  
  // Format prices to show currency if available
  const formatPrice = (price: string) => {
    const currency = content.currency || '$';
    return price.startsWith(currency) ? price : `${currency}${price}`;
  };

  // Handler for editing field values when in edit mode
  const handleEdit = (field: string, value: any) => {
    if (isEditing && onEdit) {
      onEdit(field, value);
    }
  };

  // Calculate percent savings if both prices are available
  const calculateSavings = () => {
    if (content.compareAtPrice && content.price) {
      const originalPrice = parseFloat(content.compareAtPrice.replace(/[^0-9.]/g, ''));
      const currentPrice = parseFloat(content.price.replace(/[^0-9.]/g, ''));
      
      if (originalPrice > 0 && currentPrice > 0) {
        const savingsPercent = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
        return savingsPercent > 0 ? savingsPercent : null;
      }
    }
    return null;
  };

  const savingsPercent = calculateSavings();

  return (
    <div className={`product-card rounded-lg overflow-hidden shadow-md border border-gray-200 transition-all ${isEditing ? 'hover:shadow-lg' : ''} bg-white`}>
      {/* Product image */}
      <div className="relative h-48 w-full overflow-hidden bg-gray-100">
        <Image 
          src={imageUrl} 
          alt={content.title || 'Product'} 
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 400px"
        />
        
        {/* Show savings badge if applicable */}
        {savingsPercent && (
          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-md text-sm font-semibold">
            Save {savingsPercent}%
          </div>
        )}
        
        {/* Inventory status if present and low */}
        {content.inventory !== undefined && content.inventory <= 10 && (
          <div className="absolute bottom-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
            <TagIcon className="h-3 w-3 mr-1" />
            Only {content.inventory} left!
          </div>
        )}
      </div>
      
      {/* Product details */}
      <div className="p-4">
        {/* Title */}
        <h3 
          className="text-lg font-bold text-gray-800 mb-2"
          onClick={() => handleEdit('title', content.title)}
        >
          {content.title || 'Product Name'}
        </h3>
        
        {/* Description */}
        {content.description && (
          <p 
            className="text-sm text-gray-600 mb-3"
            onClick={() => handleEdit('description', content.description)}
          >
            {content.description}
          </p>
        )}
        
        {/* Price section */}
        <div className="flex items-baseline mb-3">
          <span 
            className="text-xl font-bold text-gray-900 mr-2"
            onClick={() => handleEdit('price', content.price)}
          >
            {formatPrice(content.price || '0.00')}
          </span>
          
          {content.compareAtPrice && (
            <span 
              className="text-sm text-gray-500 line-through"
              onClick={() => handleEdit('compareAtPrice', content.compareAtPrice)}
            >
              {formatPrice(content.compareAtPrice)}
            </span>
          )}
        </div>
        
        {/* Shipping info if available */}
        {content.shippingDays && (
          <div className="flex items-center text-xs text-gray-500 mb-3">
            <TruckIcon className="h-4 w-4 mr-1" />
            <span>Ships in {content.shippingDays} days</span>
          </div>
        )}
        
        {/* Call to action button */}
        <button 
          className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          onClick={() => handleEdit('buttonText', content.buttonText)}
        >
          {content.buttonText || 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default ProductCardBlock; 