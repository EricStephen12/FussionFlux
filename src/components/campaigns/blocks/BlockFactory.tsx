import React from 'react';
import { Block } from '@/types/extended-template';

// Default placeholder for blocks that aren't yet implemented
const PlaceholderBlock = ({ block }: { block: Block }) => (
  <div className="p-4 border border-dashed border-gray-300 rounded bg-gray-50">
    <h3 className="font-medium text-gray-700">Block: {block.type}</h3>
    <p className="text-sm text-gray-500">This block type is not yet implemented.</p>
    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
      {JSON.stringify(block.content, null, 2)}
    </pre>
  </div>
);

interface BlockFactoryProps {
  block: Block;
  onEdit?: (fieldPath: string, value: any) => void;
  isEditing?: boolean;
}

/**
 * A factory component that renders the appropriate block component based on type
 */
export const BlockFactory: React.FC<BlockFactoryProps> = ({
  block,
  onEdit,
  isEditing = false
}) => {
  const handleEdit = (field: string, value: any) => {
    if (onEdit) {
      onEdit(`content.${field}`, value);
    }
  };

  // Determine which component to render based on block type
  const renderBlock = () => {
    switch(block.type) {
      // Add specific block renderers here as they are implemented
      // For now, use the placeholder for all types
      default:
        return <PlaceholderBlock block={block} />;
    }
  };

  return (
    <div className="block-wrapper">
      {renderBlock()}
    </div>
  );
};

export default BlockFactory;