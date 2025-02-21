'use client';

import { useState } from 'react';
import {
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  EnvelopeIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import AudienceSelector from './AudienceSelector';

// Define types directly in this file
type BlockContent = {
  text?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  imageUrl?: string;
  alt?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
  boxShadow?: boolean;
  title?: string;
  description?: string;
  price?: string;
  buttonText?: string;
  buttonStyle?: {
    backgroundColor?: string;
    textColor?: string;
  };
  showDescription?: boolean;
  showPrice?: boolean;
  textColor?: string;
  padding?: string;
  style?: string;
  margin?: string;
};

interface Block {
  id: string;
  type: string;
  content: BlockContent;
}

interface Template {
  subject: string;
  preheader?: string;
  blocks: Block[];
}

interface EmailPreviewProps {
  template: Template;
  onClose: () => void;
  onSendTest: (email: string) => Promise<void>;
}

export default function EmailPreview({
  template,
  onClose,
  onSendTest,
}: EmailPreviewProps) {
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [testEmail, setTestEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showTestForm, setShowTestForm] = useState(false);
  const [selectedAudience, setSelectedAudience] = useState<string[]>([]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail || selectedAudience.length === 0) return;

    setIsSending(true);
    try {
      await onSendTest(testEmail);
      setShowTestForm(false);
      setTestEmail('');
    } finally {
      setIsSending(false);
    }
  };

  const updateBlockContent = (id: string, content: BlockContent) => {
    const updatedBlocks = template.blocks.map(block =>
      block.id === id ? { ...block, content } : block
    );
    // Assuming there's a way to update the template state
    // updateTemplate({ ...template, blocks: updatedBlocks });
  };

  const renderBlock = (block: Block) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof BlockContent) => {
      updateBlockContent(block.id, { ...block.content, [field]: e.target.value });
    };

    switch (block.type) {
      case 'text':
        return (
          <div className="mb-4">
            <textarea
              value={block.content.text}
              onChange={(e) => handleInputChange(e, 'text')}
              style={{
                textAlign: block.content.align as any,
                fontSize: block.content.fontSize,
                color: block.content.color,
                backgroundColor: block.content.backgroundColor,
              }}
              className="w-full p-2 border rounded"
            />
          </div>
        );

      case 'image':
        return (
          <div className="mb-4">
            <input
              type="text"
              value={block.content.imageUrl}
              onChange={(e) => handleInputChange(e, 'imageUrl')}
              placeholder="Image URL"
              className="w-full p-2 border rounded mb-2"
            />
            <img
              src={block.content.imageUrl}
              alt={block.content.alt}
              style={{
                width: block.content.width || '100%',
                height: block.content.height || 'auto',
                borderRadius: block.content.borderRadius || '0',
              }}
              className="mx-auto"
            />
          </div>
        );

      case 'product':
        return renderProductBlock(block);

      case 'button':
        return (
          <div className="mb-4 text-center">
            <button
              style={{
                backgroundColor: block.content.backgroundColor || '#4F46E5',
                color: block.content.textColor || '#ffffff',
                padding: block.content.padding || '0.5rem 1rem',
                borderRadius: block.content.borderRadius || '0.375rem',
              }}
              className="inline-block transition-opacity hover:opacity-90"
            >
              {block.content.text}
            </button>
          </div>
        );

      case 'divider':
        return (
          <hr
            style={{
              borderColor: block.content.color || '#E5E7EB',
              borderStyle: block.content.style || 'solid',
              width: block.content.width || '100%',
              margin: block.content.margin || '1rem 0',
            }}
          />
        );

      case 'spacer':
        return <div style={{ height: block.content.height || '1rem' }} />;

      default:
        return null;
    }
  };

  const renderProductBlock = (block: Block) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: keyof BlockContent) => {
      updateBlockContent(block.id, { ...block.content, [field]: e.target.value });
    };

    return (
      <>
        <input
          type="text"
          value={block.content.title}
          onChange={(e) => handleInputChange(e, 'title')}
          placeholder="Product Title"
          className="w-full p-2 border rounded mb-2"
        />
        <textarea
          value={block.content.description}
          onChange={(e) => handleInputChange(e, 'description')}
          placeholder="Product Description"
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="text"
          value={block.content.price}
          onChange={(e) => handleInputChange(e, 'price')}
          placeholder="Product Price"
          className="w-full p-2 border rounded mb-2"
        />
        <input
          type="file"
          onChange={(e) => handleInputChange(e, 'imageUrl')}
          className="w-full p-2 border rounded mb-2"
        />
        <img
          src={block.content.imageUrl}
          alt={block.content.alt}
          style={{
            width: block.content.width || '100%',
            height: block.content.height || 'auto',
            borderRadius: block.content.borderRadius || '0',
          }}
          className="mx-auto"
        />
      </>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Email Preview</h2>
            <p className="mt-1 text-sm text-gray-500">
              Preview how your email will look to recipients
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-2 rounded-md ${
                  viewMode === 'desktop'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                <ComputerDesktopIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-2 rounded-md ${
                  viewMode === 'mobile'
                    ? 'bg-white shadow-sm text-indigo-600'
                    : 'text-gray-500'
                }`}
              >
                <DevicePhoneMobileIcon className="h-5 w-5" />
              </button>
            </div>
            <button
              onClick={() => setShowTestForm(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <EnvelopeIcon className="h-5 w-5 mr-2 text-gray-500" />
              Send Test
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto p-6">
          <div
            className={`mx-auto bg-white ${
              viewMode === 'mobile' ? 'max-w-sm' : 'max-w-2xl'
            }`}
          >
            {/* Email Header */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">{template.subject}</h1>
              {template.preheader && (
                <p className="mt-2 text-sm text-gray-500">{template.preheader}</p>
              )}
            </div>

            {/* Email Content */}
            <div className="space-y-6">
              {template.blocks.map(block => (
                <div key={block.id}>{renderBlock(block)}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Test Email Form */}
        {showTestForm && (
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Send Test Email</h3>
                <button
                  onClick={() => setShowTestForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <form onSubmit={handleSendTest}>
                <div>
                  <label
                    htmlFor="test-email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="test-email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowTestForm(false)}
                    className="mr-4 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSending || !testEmail}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSending ? 'Sending...' : 'Send Test'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <AudienceSelector onSelect={setSelectedAudience} initialSelected={selectedAudience} />
      </div>
    </div>
  );
} 