import React from 'react';
import { ExtendedBlockContent } from '@/types/extended-template';
import { TruckIcon, GlobeAltIcon, ClockIcon } from '@heroicons/react/24/outline';

interface ShippingInfoBlockProps {
  content: ExtendedBlockContent;
  onEdit?: (field: string, value: any) => void;
  isEditing?: boolean;
}

/**
 * A block component for displaying shipping information in email templates
 * Specifically designed for dropshipping businesses to provide shipping details
 */
export const ShippingInfoBlock: React.FC<ShippingInfoBlockProps> = ({
  content,
  onEdit,
  isEditing = false
}) => {
  // Default methods if none provided
  const methods = content.methods || [
    {
      name: 'Standard Shipping',
      deliveryTime: '7-14 days',
      price: '0.00'
    }
  ];
  
  // Handler for editing field values when in edit mode
  const handleEdit = (field: string, value: any) => {
    if (isEditing && onEdit) {
      onEdit(field, value);
    }
  };

  // Get background and text color from content or use defaults
  const backgroundColor = content.backgroundColor || '#f9fafb';
  const textColor = content.textColor || '#111827';

  return (
    <div 
      className="shipping-info-block rounded-lg overflow-hidden p-4 mb-4"
      style={{ backgroundColor, color: textColor }}
    >
      {/* Title */}
      <h3 
        className="text-lg font-bold mb-3 flex items-center"
        onClick={() => handleEdit('title', content.title)}
      >
        <TruckIcon className="h-5 w-5 mr-2" />
        {content.title || 'Shipping Information'}
      </h3>
      
      {/* Shipping methods */}
      <div className="space-y-3">
        {methods.map((method, index) => (
          <div 
            key={index} 
            className="p-3 rounded-md bg-white shadow-sm flex justify-between items-center"
            onClick={() => handleEdit(`methods[${index}]`, method)}
          >
            <div className="flex flex-col">
              <span className="font-medium text-gray-900">{method.name}</span>
              <div className="flex items-center text-sm text-gray-500 mt-1">
                <ClockIcon className="h-4 w-4 mr-1" />
                <span>{method.deliveryTime}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-gray-900">
                {method.price === '0.00' || method.price === '0' ? 
                  'FREE' : 
                  `$${method.price}`
                }
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Global shipping notice */}
      <div className="mt-4 text-sm text-gray-500 flex items-center">
        <GlobeAltIcon className="h-4 w-4 mr-1" />
        <span>We ship worldwide. Delivery times may vary based on location.</span>
      </div>
    </div>
  );
};

export default ShippingInfoBlock; 