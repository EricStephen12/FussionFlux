import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable, Droppable, DragDropContext, DropResult } from 'react-beautiful-dnd';
import { 
  TrashIcon, 
  SunIcon as UndoIcon, 
  RadioIcon as RedoIcon,
  SparklesIcon,
  ChevronLeftIcon, 
  ChevronRightIcon 
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { cloudinaryService } from './cloudinaryService';
import { ApolloService } from '../../services/apollo';
import { useResend } from '../../hooks/useResend';
import { useAI } from '../../hooks/useAI';
import { useTemplate } from '../../hooks/useTemplate';
import { StarIcon } from '@heroicons/react/24/solid';

// Define preset templates
export const presetTemplates = {
  'Product Launch': {
    name: 'Product Launch Template',
    blocks: [
      {
        id: 'header-1',
        type: 'header',
        content: {
          header: {
            logo: { url: '/logo.png', width: '120px', height: 'auto', alt: 'Logo' },
            navigation: { links: [{ text: 'View Collection', url: '#' }] },
            backgroundColor: '#ffffff',
            textColor: '#1f2937',
            padding: '1.5rem 2rem',
            borderBottom: { width: '1px', style: 'solid', color: '#e5e7eb' },
            position: 'relative',
            zIndex: 50
          },
          style: {
            position: 'relative',
            zIndex: 50
          }
        }
      },
      {
        id: 'hero-1',
        type: 'hero',
        content: {
          title: 'Introducing Our Latest Innovation',
          subtitle: 'Limited Time Launch Offer - Save 20%',
          imageUrl: '/product-hero.jpg',
          backgroundColor: '#f8fafc',
          padding: '4rem 2rem',
          style: {
            titleColor: '#1f2937',
            titleFontSize: '2.5rem',
            titleLineHeight: '1.2',
            titleLetterSpacing: '-0.025em',
            subtitleColor: '#4b5563',
            subtitleFontSize: '1.25rem',
            subtitleLineHeight: '1.5',
            subtitleMarginTop: '1rem'
          },
          button: {
            text: 'Shop Now - 20% Off',
            style: 'gradient',
            url: '#',
            gradient: {
              from: '#4f46e5',
              to: '#6366f1'
            }
          }
        }
      },
      {
        id: 'product-grid-1',
        type: 'product',
        content: {
          title: 'Best Sellers',
          description: 'Shop our most popular items',
          columns: 2,
          padding: '3rem 2rem',
          backgroundColor: '#ffffff',
          showPrice: true,
          showDescription: true,
          boxShadow: true,
          borderRadius: 'lg',
          buttonText: 'Add to Cart',
          buttonStyle: 'gradient'
        }
      }
    ]
  },
  'Limited Time Offer': {
    name: 'Flash Sale Template',
    blocks: [
      {
        id: 'hero-2',
        type: 'hero',
        content: {
          title: '48-Hour Flash Sale',
          subtitle: 'Up to 50% Off - Don\'t Miss Out!',
          backgroundColor: '#ef4444',
          textColor: '#ffffff',
          padding: '3rem 2rem',
          style: {
            titleFontSize: '3rem',
            titleLetterSpacing: '-0.025em',
            subtitleMarginTop: '1rem'
          },
          button: {
            text: 'Shop Now',
            style: 'gradient',
            gradient: {
              from: '#ffffff',
              to: '#f3f4f6'
            },
            textColor: '#ef4444'
          }
        }
      },
      {
        id: 'countdown-1',
        type: 'countdown',
        content: {
          title: 'Time Remaining',
          endDate: '2024-12-31T23:59:59',
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
          backgroundColor: '#fef2f2',
          padding: '2rem',
          style: {
            titleColor: '#ef4444',
            titleFontSize: '1.5rem'
          }
        }
      },
      {
        id: 'product-grid-2',
        type: 'product',
        content: {
          columns: 3,
          padding: '2rem',
          backgroundColor: '#ffffff',
          showPrice: true,
          showDescription: true,
          boxShadow: true,
          borderRadius: 'md'
        }
      }
    ]
  },
  'Abandoned Cart': {
    name: 'Cart Recovery Template',
    blocks: [
      {
        id: 'hero-3',
        type: 'hero',
        content: {
          title: 'Your Cart Misses You',
          subtitle: 'Complete your purchase and get 10% off',
          backgroundColor: '#f8fafc',
          padding: '3rem 2rem',
          style: {
            titleColor: '#1f2937',
            titleFontSize: '2rem',
            subtitleColor: '#4b5563'
          }
        }
      },
      {
        id: 'product-1',
        type: 'product',
        content: {
          title: 'Items in Your Cart',
          columns: 1,
          padding: '2rem',
          backgroundColor: '#ffffff',
          showPrice: true,
          showDescription: true,
          boxShadow: true,
          borderRadius: 'lg',
          buttonText: 'Complete Purchase',
          buttonStyle: 'gradient'
        }
      },
      {
        id: 'promotion-1',
        type: 'promotion',
        content: {
          title: 'Special Offer',
          discount: '10% OFF',
          code: 'COMEBACK10',
          expiryDate: '2024-12-31',
          backgroundColor: '#f0fdf4',
          padding: '2rem',
          borderRadius: 'md'
        }
      }
    ]
  },
  'Welcome Series': {
    name: 'Welcome Email Template',
    blocks: [
      {
        id: 'hero-4',
        type: 'hero',
        content: {
          title: 'Welcome to Our Family',
          subtitle: 'Get 15% off your first purchase',
          backgroundColor: '#f0f9ff',
          padding: '4rem 2rem',
          style: {
            titleColor: '#0369a1',
            titleFontSize: '2.5rem',
            subtitleColor: '#0c4a6e'
          }
        }
      },
      {
        id: 'featured-1',
        type: 'featured-collection',
        content: {
          title: 'Our Best Sellers',
          columns: 2,
          padding: '3rem 2rem',
          backgroundColor: '#ffffff',
          showPrice: true,
          showDescription: true,
          boxShadow: true,
          borderRadius: 'lg'
        }
      },
      {
        id: 'testimonial-1',
        type: 'testimonial',
        content: {
          quote: 'Best purchase I\'ve made this year!',
          author: 'Sarah Johnson',
          role: 'Verified Customer',
          rating: 5,
          backgroundColor: '#ffffff',
          padding: '2rem',
          borderRadius: 'md'
        }
      }
    ]
  },
  'New Collection': {
    name: 'Collection Launch Template',
    blocks: [
      {
        id: 'hero-5',
        type: 'hero',
        content: {
          title: 'The New Collection Has Arrived',
          subtitle: 'Be the first to shop our latest designs',
          backgroundColor: '#faf5ff',
          padding: '4rem 2rem',
          style: {
            titleColor: '#6b21a8',
            titleFontSize: '2.5rem',
            subtitleColor: '#581c87'
          }
        }
      },
      {
        id: 'product-grid-3',
        type: 'product',
        content: {
          title: 'New Arrivals',
          columns: 3,
          padding: '3rem 2rem',
          backgroundColor: '#ffffff',
          showPrice: true,
          showDescription: true,
          boxShadow: true,
          borderRadius: 'lg',
          buttonText: 'Shop Now',
          buttonStyle: 'gradient'
        }
      }
    ]
  }
};

const categories = [
  'All',
  'Product Launch',
  'Limited Time Offer',
  'New Collection',
  'Abandoned Cart',
  'Welcome Series',
  'Customer Feedback',
  'Seasonal Sale',
  'VIP Exclusive',
];

// Define types
type BlockContent = {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  images?: Array<{
    url: string;
    alt?: string;
    isPrimary?: boolean;
  }>;
  text?: string;
  align?: 'left' | 'center' | 'right';
  fontSize?: string;
  color?: string;
  backgroundColor?: string;
  width?: string;
  height?: string;
  alt?: string;
  productId?: string;
  showPrice?: boolean;
  showDescription?: boolean;
  buttonText?: string;
  button?: {
    text: string;
    style: 'primary' | 'secondary' | 'ghost' | 'gradient' | 'outline' | 'link';
    url?: string;
  };
  gradient?: {
    from: string;
    to: string;
    direction: 'to-right' | 'to-bottom' | 'to-bottom-right';
  };
  overlay?: {
    opacity: number;
  };
  style?: {
    titleColor?: string;
    titleFontSize?: string;
    titleLineHeight?: string;
    titleLetterSpacing?: string;
    subtitleColor?: string;
    subtitleFontSize?: string;
    subtitleLineHeight?: string;
    subtitleMarginTop?: string;
    ctaGradient?: {
      from: string;
      to: string;
    };
    ctaColor?: string;
    ctaFontSize?: string;
    ctaPadding?: string;
    ctaBorderRadius?: string;
    ctaTransition?: string;
    ctaHoverTransform?: string;
  };
  header?: {
    logo?: {
      url: string;
      width?: string;
      height?: string;
      alt?: string;
    };
    navigation?: {
      links: Array<{ text: string; url: string }>;
    };
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    borderBottom?: {
      width: string;
      style: 'solid' | 'dashed' | 'dotted';
      color: string;
    };
  };
  footer?: {
    logo?: {
      url: string;
      width?: string;
      height?: string;
      alt?: string;
    };
    companyName?: string;
    address?: string;
    socialLinks?: {
      [key: string]: string;
    };
    navigation?: {
      links: Array<{ text: string; url: string }>;
    };
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    copyright?: string;
    showUnsubscribe?: boolean;
    unsubscribeText?: string;
  };
  columns?: number;
  buttonStyle?: 'filled' | 'outline' | 'link' | 'gradient';
  discount?: string;
  code?: string;
  expiryDate?: string;
  quote?: string;
  author?: string;
  role?: string;
  avatar?: string;
  rating?: number;
  endDate?: string;
  showDays?: boolean;
  showHours?: boolean;
  showMinutes?: boolean;
  showSeconds?: boolean; 
  borderRadius?: string;
  boxShadow?: boolean;
  padding?: string;
  margin?: string;
  price?: string;
  description?: string;
};

type Block = {
  id: string;
  type: BlockType;
  content: BlockContent;
};

type BlockType = 'hero' | 'featured-collection' | 'promotion' | 'testimonial' | 'countdown' | 'text' | 'image' | 'product' | 'header' | 'footer';

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  lastModified: string;
  blocks: Block[];
  isPreset?: boolean;
  status?: 'draft' | 'published'; // Add status property
}

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => Promise<void>;
  onCancel: () => void;
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template: initialTemplate,
  onSave,
  onCancel,
}) => {
  const router = useRouter();
  const apolloService = new ApolloService();
  const { optimizeText, isOptimizing } = useAI();
  const { loadTemplate, saveTemplate } = useTemplate();
  const { sendEmail } = useResend();
  
  const [template, setTemplate] = useState<Template>(initialTemplate);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [history, setHistory] = useState<Template[]>([]);
  const [redoStack, setRedoStack] = useState<Template[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [testEmailAddress, setTestEmailAddress] = useState('');

  const canUndo = history.length > 0;
  const canRedo = redoStack.length > 0;

  const categories = [
    'All',
    'Product Launch',
    'Limited Time Offer',
    'New Collection',
    'Abandoned Cart',
    'Welcome Series',
    'Customer Feedback',
    'Seasonal Sale',
    'VIP Exclusive',
  ];

  useEffect(() => {
    const loadInitialTemplate = async () => {
      const templateId = window.location.pathname.split('/').pop();
      if (templateId && templateId !== 'new') {
        // Try to load from localStorage first
        const storedTemplate = localStorage.getItem('editingTemplate');
        if (storedTemplate) {
          const parsedTemplate = JSON.parse(storedTemplate);
          setTemplate(parsedTemplate);
          setHistory([parsedTemplate]);
          // Clear the stored template
          localStorage.removeItem('editingTemplate');
          return;
        }
        
        // If not in localStorage, load from API
        const loadedTemplate = await loadTemplate(templateId);
        if (loadedTemplate) {
          setTemplate(loadedTemplate);
          setHistory([loadedTemplate]);
        }
      }
    };

    if (!initialTemplate?.id) {
      loadInitialTemplate();
    }
  }, []);

  const handleUndo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setRedoStack([template, ...redoStack]);
      setHistory(history.slice(0, -1));
      setTemplate(previousState);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0) {
      const nextState = redoStack[0];
      setHistory([...history, template]);
      setRedoStack(redoStack.slice(1));
      setTemplate(nextState);
    }
  };

  const handleTemplateChange = (newTemplate: Template) => {
    setTemplate(newTemplate);
    setHasUnsavedChanges(true);
    
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newTemplate);
    setHistory(newHistory);
    setCurrentIndex(newHistory.length - 1);
  };

  const handleSaveAsDraft = async () => {
      setIsSaving(true);
    try {
      await onSave({ ...template, lastModified: new Date().toISOString() });
      setSaveStatus('saved');
        setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
      setIsSaving(true);
    try {
      await onSave({ ...template, lastModified: new Date().toISOString(), isPreset: false });
      setSaveStatus('published');
        setHasUnsavedChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOptimizeText = async (blockId: string, text: string) => {
      const optimizedText = await optimizeText(text);
      updateBlock(blockId, { text: optimizedText });
  };

  const handleSave = async (isDraft = true) => {
    if (isDraft) {
      await handleSaveAsDraft();
    } else {
      await handlePublish();
    }
  };

  const handleSendTest = async () => {
    if (!testEmailAddress) return;
    
    try {
      await sendEmail({
          to: testEmailAddress,
        subject: template.name,
        template: template,
      });
      
      // Show success message
      alert('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      alert('Failed to send test email. Please try again.');
    }
  };

  const addBlock = (type: BlockType) => {
    const newBlock: Block = {
      id: uuidv4(),
      type,
      content: getInitialBlockContent(type),
    };
    setTemplate(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
  };

  const getInitialBlockContent = (type: BlockType): BlockContent => {
    switch (type) {
      case 'hero':
        return {
          title: 'Welcome to Our Store',
          subtitle: 'Discover the best products for you!',
          imageUrl: 'https://source.unsplash.com/random/1920x1080',
          button: { text: 'Shop Now', style: 'primary' },
        };
      case 'featured-collection':
        return {
          title: 'Featured Products',
          columns: 3,
          showPrice: true,
          showDescription: true,
          buttonStyle: 'filled',
        };
      case 'promotion':
        return {
          title: 'Special Offer',
          discount: '20% OFF',
          code: 'SUMMER20',
          expiryDate: '2023-12-31',
        };
      case 'testimonial':
        return {
          quote: 'This product has transformed our business operations.',
          author: 'John Smith',
          role: 'CEO at Company',
          avatar: 'https://source.unsplash.com/random/100x100',
          rating: 5,
        };
      case 'countdown':
        return {
          title: 'Sale Ends Soon',
          endDate: '2023-12-31T23:59:59',
          showDays: true,
          showHours: true,
          showMinutes: true,
          showSeconds: true,
        };
      case 'text':
        return {
          text: 'This is a customizable text block. You can add any text you want here.',
          align: 'left',
          fontSize: '16px',
          color: '#000000',
          backgroundColor: '#ffffff',
        };
      case 'image':
        return {
          imageUrl: 'https://source.unsplash.com/random/800x600',
          alt: 'Sample Image',
          width: '100%',
          height: 'auto',
        };
      case 'product':
        return {
          productId: '12345',
          title: 'Sample Product',
          description: 'A great product description goes here.',
          price: '$99.99',
          images: [
            { url: 'https://source.unsplash.com/random/800x600', alt: 'Product Image 1', isPrimary: true },
          ],
          showPrice: true,
          showDescription: true,
          buttonText: 'Add to Cart',
          backgroundColor: '#ffffff',
          borderRadius: 'md',
          boxShadow: false,
          columns: 1
        };
      case 'header':
        return {
          header: {
            logo: {
              url: 'https://source.unsplash.com/random/120x40',
              width: '120px',
              height: '40px',
              alt: 'Company Logo',
            },
            navigation: {
              links: [
                { text: 'Home', url: '#' },
                { text: 'Products', url: '#' },
                { text: 'About', url: '#' },
                { text: 'Contact', url: '#' },
              ],
            },
            backgroundColor: '#ffffff',
            textColor: '#1a1a1a',
            padding: '1rem 2rem',
            borderBottom: {
              width: '1px',
              style: 'solid',
              color: '#e5e7eb',
            },
          },
        };
      case 'footer':
        return {
          footer: {
            logo: {
              url: 'https://source.unsplash.com/random/120x40',
              width: '120px',
              height: '40px',
              alt: 'Company Logo',
            },
            companyName: 'Your Company',
            address: '123 Main Street, Anytown, USA',
            socialLinks: {
              facebook: 'https://facebook.com/yourcompany',
              twitter: 'https://twitter.com/yourcompany',
              instagram: 'https://instagram.com/yourcompany',
            },
            navigation: {
              links: [
                { text: 'Home', url: '#' },
                { text: 'Products', url: '#' },
                { text: 'About', url: '#' },
                { text: 'Contact', url: '#' },
              ],
            },
            backgroundColor: '#f9fafb',
            textColor: '#4b5563',
            padding: '3rem 2rem',
            copyright: ' 2024 Your Company. All rights reserved.',
            showUnsubscribe: true,
            unsubscribeText: 'Unsubscribe',
          },
        };
      default:
        return {};
    }
  };

  const updateBlock = (blockId: string, content: Partial<BlockContent>) => {
    setTemplate(prev => ({
      ...prev,
      blocks: (prev.blocks || []).map(block =>
        block.id === blockId ? { ...block, content: { ...block.content, ...content } } : block
      ),
    }));
  };

  const deleteBlock = (blockId: string) => {
    setTemplate(prev => ({
      ...prev,
      blocks: (prev.blocks || []).filter(block => block.id !== blockId),
    }));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const blocks = Array.from(template.blocks);
    const [reorderedBlock] = blocks.splice(result.source.index, 1);
    blocks.splice(result.destination.index, 0, reorderedBlock);

    setTemplate(prev => ({ ...prev, blocks }));
  };

  // Add this inside the TemplateEditor component, after the state declarations
  const loadPresetTemplate = (category: string) => {
    const preset = presetTemplates[category];
    if (preset) {
      setTemplate({
        ...initialTemplate,
        ...preset,
        id: initialTemplate.id,
        blocks: preset.blocks.map(block => ({
          ...block,
          id: uuidv4() // Generate new IDs for the blocks
        }))
      });
      setHasUnsavedChanges(true);
    }
  };

  // Modify the handleImageUpload function
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string, field: 'imageUrl' | 'avatar' | 'header.logo.url' | 'footer.logo.url' | string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Get the current block from template state
    const currentBlock = template.blocks.find(b => b.id === blockId);
    if (!currentBlock) return;

    // Create a temporary URL for immediate preview
    const tempUrl = URL.createObjectURL(file);
    
    // Update the block with temporary URL for immediate preview
    if (field.includes('.')) {
      const [section, subsection, prop] = field.split('.');
      if (field.startsWith('images.')) {
        // Handle product images array
        const imageIndex = parseInt(subsection);
        const images = [...(currentBlock.content.images || [])];
        if (!images[imageIndex]) {
          images[imageIndex] = { url: '', alt: `Product Image ${imageIndex + 1}` };
        }
        images[imageIndex].url = tempUrl;
        updateBlock(blockId, { images });
      } else {
        // Handle nested properties like header.logo.url
        updateBlock(blockId, {
          [section]: {
            ...currentBlock.content[section],
            [subsection]: {
              ...currentBlock.content[section]?.[subsection],
              [prop]: tempUrl
            }
          }
        });
      }
    } else {
      updateBlock(blockId, { [field]: tempUrl });
    }

    try {
      // Upload to your actual storage service
      const uploadedUrl = await cloudinaryService.uploadImage(file);
      
      // Update with the permanent URL
      if (field.includes('.')) {
        const [section, subsection, prop] = field.split('.');
        if (field.startsWith('images.')) {
          // Handle product images array
          const imageIndex = parseInt(subsection);
          const images = [...(currentBlock.content.images || [])];
          if (!images[imageIndex]) {
            images[imageIndex] = { url: '', alt: `Product Image ${imageIndex + 1}` };
          }
          images[imageIndex].url = uploadedUrl;
          updateBlock(blockId, { images });
        } else {
          // Handle nested properties
          updateBlock(blockId, {
            [section]: {
              ...currentBlock.content[section],
              [subsection]: {
                ...currentBlock.content[section]?.[subsection],
                [prop]: uploadedUrl
              }
            }
          });
        }
      } else {
        updateBlock(blockId, { [field]: uploadedUrl });
      }

      // Clean up the temporary URL
      URL.revokeObjectURL(tempUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      // Handle error (show message to user, etc.)
    }
  };

  const renderBlockEditor = (block: Block | undefined) => {
    if (!block) return null;
    
    const commonTextSettings = (
      <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
        <h3 className="font-medium text-gray-900">Text Settings</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Font Size</label>
            <select
              value={block.content.fontSize || '16px'}
              onChange={(e) => updateBlock(block.id, { fontSize: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              {['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Text Align</label>
              <select
              value={block.content.align || 'left'}
              onChange={(e) => updateBlock(block.id, { align: e.target.value as any })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
              </select>
          </div>
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700">Text Color</label>
              <input
            type="color"
            value={block.content.color || '#000000'}
            onChange={(e) => updateBlock(block.id, { color: e.target.value })}
            className="mt-1 block w-full"
              />
                </div>
              </div>
        );

    const commonSpacingSettings = (
      <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
        <h3 className="font-medium text-gray-900">Spacing</h3>
        <div className="grid grid-cols-2 gap-4">
            <div>
            <label className="block text-sm font-medium text-gray-700">Padding</label>
              <input
                type="text"
              value={block.content.padding || '1rem'}
              onChange={(e) => updateBlock(block.id, { padding: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 1rem or 16px"
              />
            </div>
            <div>
            <label className="block text-sm font-medium text-gray-700">Margin</label>
              <input
                type="text"
              value={block.content.margin || '1rem'}
              onChange={(e) => updateBlock(block.id, { margin: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="e.g., 1rem or 16px"
              />
            </div>
            </div>
          </div>
        );

    const buttonSettings = block.content.button || block.content.buttonText ? (
      <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
        <h3 className="font-medium text-gray-900">Button Settings</h3>
            <div>
          <label className="block text-sm font-medium text-gray-700">Button Text</label>
              <input
                type="text"
            value={block.content.button?.text || block.content.buttonText || ''}
            onChange={(e) => {
              if (block.content.button) {
                updateBlock(block.id, { 
                  button: { ...block.content.button, text: e.target.value }
                });
              } else {
                updateBlock(block.id, { buttonText: e.target.value });
              }
            }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700">Button Background Color</label>
              <input
            type="color"
            value={block.content.button?.style === 'gradient' 
              ? block.content.button.gradient?.from 
              : block.content.backgroundColor || '#4F46E5'}
            onChange={(e) => {
              if (block.content.button?.style === 'gradient') {
                updateBlock(block.id, {
                  button: {
                    ...block.content.button,
                    gradient: { ...block.content.button.gradient, from: e.target.value }
                  }
                });
              } else {
                updateBlock(block.id, { backgroundColor: e.target.value });
              }
            }}
            className="mt-1 block w-full"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700">Button Text Color</label>
              <input
            type="color"
            value={block.content.style?.ctaColor || '#ffffff'}
            onChange={(e) => updateBlock(block.id, {
              style: { ...block.content.style, ctaColor: e.target.value }
            })}
            className="mt-1 block w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Button Style</label>
              <select
            value={block.content.button?.style || block.content.buttonStyle || 'primary'}
            onChange={(e) => {
              const value = e.target.value;
              if (block.content.button) {
                updateBlock(block.id, {
                  button: { ...block.content.button, style: value as any }
                });
              } else {
                updateBlock(block.id, { buttonStyle: value as any });
              }
            }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
                <option value="outline">Outline</option>
                <option value="gradient">Gradient</option>
            <option value="link">Link</option>
              </select>
            </div>
          </div>
    ) : null;

    switch (block.type) {
      case 'hero':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Hero Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={block.content.title || ''}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle</label>
              <input
                type="text"
                  value={block.content.subtitle || ''}
                  onChange={(e) => updateBlock(block.id, { subtitle: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Background Image</label>
              <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, block.id, 'imageUrl')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
              {buttonSettings}
            </div>
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Style Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Background Color</label>
              <input
                  type="color"
                  value={block.content.backgroundColor || '#ffffff'}
                  onChange={(e) => updateBlock(block.id, { backgroundColor: e.target.value })}
                  className="mt-1 block w-full"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Title Color</label>
                <input
                  type="color"
                  value={block.content.style?.titleColor || '#000000'}
                  onChange={(e) => updateBlock(block.id, { style: { ...block.content.style, titleColor: e.target.value } })}
                  className="mt-1 block w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle Color</label>
                <input
                  type="color"
                  value={block.content.style?.subtitleColor || '#000000'}
                  onChange={(e) => updateBlock(block.id, { style: { ...block.content.style, subtitleColor: e.target.value } })}
                  className="mt-1 block w-full"
                />
              </div>
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Testimonial Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Quote</label>
              <textarea
                value={block.content.quote || ''}
                onChange={(e) => updateBlock(block.id, { quote: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Author Name</label>
              <input
                type="text"
                value={block.content.author || ''}
                onChange={(e) => updateBlock(block.id, { author: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
              <input
                type="text"
                value={block.content.role || ''}
                onChange={(e) => updateBlock(block.id, { role: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Avatar</label>
              <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, block.id, 'avatar')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Rating</label>
              <select
                value={block.content.rating || 5}
                onChange={(e) => updateBlock(block.id, { rating: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                  {[1, 2, 3, 4, 5].map(rating => (
                    <option key={rating} value={rating}>{rating} Stars</option>
                  ))}
              </select>
            </div>
            </div>
            {buttonSettings}
          </div>
        );

      case 'countdown':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Countdown Settings</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                value={block.content.title || ''}
                onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <input
                type="datetime-local"
                value={block.content.endDate || ''}
                onChange={(e) => updateBlock(block.id, { endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
              <div className="space-y-2">
                <div className="flex items-center">
              <input
                type="checkbox"
                checked={block.content.showDays}
                onChange={(e) => updateBlock(block.id, { showDays: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
                  <label className="ml-2 block text-sm text-gray-700">Show Days</label>
            </div>
                <div className="flex items-center">
              <input
                type="checkbox"
                checked={block.content.showHours}
                onChange={(e) => updateBlock(block.id, { showHours: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
                  <label className="ml-2 block text-sm text-gray-700">Show Hours</label>
            </div>
                <div className="flex items-center">
              <input
                type="checkbox"
                checked={block.content.showMinutes}
                onChange={(e) => updateBlock(block.id, { showMinutes: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
                  <label className="ml-2 block text-sm text-gray-700">Show Minutes</label>
            </div>
                <div className="flex items-center">
              <input
                type="checkbox"
                checked={block.content.showSeconds}
                onChange={(e) => updateBlock(block.id, { showSeconds: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
                  <label className="ml-2 block text-sm text-gray-700">Show Seconds</label>
            </div>
              </div>
            </div>
            {buttonSettings}
          </div>
        );

      case 'promotion':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Promotion Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                  type="text"
                  value={block.content.title || ''}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Discount</label>
                <input
                  type="text"
                  value={block.content.discount || ''}
                  onChange={(e) => updateBlock(block.id, { discount: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., 20% OFF"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Promo Code</label>
              <input
                type="text"
                  value={block.content.code || ''}
                  onChange={(e) => updateBlock(block.id, { code: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
              <input
                  type="date"
                  value={block.content.expiryDate || ''}
                  onChange={(e) => updateBlock(block.id, { expiryDate: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            </div>
            {buttonSettings}
          </div>
        );

      case 'text':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Text Content</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Content</label>
                <textarea
                  value={block.content.text || ''}
                  onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            </div>
            {buttonSettings}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-6">
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Image Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Image</label>
              <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, block.id, 'imageUrl')}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Alt Text</label>
              <input
                type="text"
                value={block.content.alt || ''}
                onChange={(e) => updateBlock(block.id, { alt: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Width</label>
                <input
                  type="text"
                  value={block.content.width || '100%'}
                  onChange={(e) => updateBlock(block.id, { width: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., 100% or 500px"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Height</label>
                <input
                  type="text"
                  value={block.content.height || 'auto'}
                  onChange={(e) => updateBlock(block.id, { height: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., auto or 300px"
                />
              </div>
            </div>
            {buttonSettings}
          </div>
        );

      case 'product':
        return (
          <div className="space-y-6">
            {commonTextSettings}
            {commonSpacingSettings}
            <div className="space-y-4 mb-6 border-b border-gray-200 pb-6">
              <h3 className="font-medium text-gray-900">Product Settings</h3>
            <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                type="text"
                  value={block.content.title || ''}
                  onChange={(e) => updateBlock(block.id, { title: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={block.content.description || ''}
                  onChange={(e) => updateBlock(block.id, { description: e.target.value })}
                  rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Price</label>
              <input
                type="text"
                  value={block.content.price || ''}
                  onChange={(e) => updateBlock(block.id, { price: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Product Images (Max 4)</label>
            <div className="grid grid-cols-2 gap-4">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="relative bg-gray-50 p-4 rounded-lg">
                      {block.content.images?.[index]?.url ? (
                        <div className="relative">
                          <img
                            src={block.content.images[index].url}
                            alt={block.content.images[index].alt || `Product ${index + 1}`}
                            className="w-full h-32 object-cover rounded-md mb-2"
                    />
                    <button
                      onClick={() => {
                              const images = [...(block.content.images || [])];
                              images[index] = { url: '', alt: '' };
                              updateBlock(block.id, { images });
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                      ) : (
                        <div className="flex items-center justify-center h-32 bg-gray-100 rounded-md">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const images = [...(block.content.images || [])];
                              if (!images[index]) {
                                images[index] = { url: '', alt: `Product Image ${index + 1}` };
                              }
                              handleImageUpload(e, block.id, `images.${index}.url`);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div className="text-gray-500 text-sm text-center">
                            <span className="block">Click to upload</span>
                            <span className="block">Product Image {index + 1}</span>
            </div>
            </div>
                      )}
                      {block.content.images?.[index]?.url && (
              <input
                type="text"
                          placeholder="Alt text"
                          value={block.content.images[index].alt || ''}
                          onChange={(e) => {
                            const images = [...(block.content.images || [])];
                            images[index] = { ...images[index], alt: e.target.value };
                            updateBlock(block.id, { images });
                          }}
                          className="mt-2 block w-full text-sm rounded-md border-gray-300"
                        />
                      )}
            </div>
                  ))}
                </div>
                </div>
                <div>
                <label className="block text-sm font-medium text-gray-700">Products per Row</label>
                  <select
                  value={block.content.columns || 1}
                  onChange={(e) => updateBlock(block.id, { columns: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  >
                  <option value={1}>1 Product</option>
                  <option value={2}>2 Products</option>
                  <option value={3}>3 Products</option>
                  <option value={4}>4 Products</option>
                  </select>
                </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={block.content.showPrice}
                    onChange={(e) => updateBlock(block.id, { showPrice: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Show Price</label>
                </div>
                <div className="flex items-center">
              <input
                type="checkbox"
                    checked={block.content.showDescription}
                    onChange={(e) => updateBlock(block.id, { showDescription: e.target.checked })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-700">Show Description</label>
            </div>
            </div>
            </div>
            {buttonSettings}
          </div>
        );

      default:
        return null;
    }
  };

  // Update the renderBlock function to properly handle button colors
  const renderBlock = (block: Block) => {
    const getColumnClass = (columns: number = 2) => {
      switch (columns) {
        case 1: return 'grid-cols-1';
        case 2: return 'grid-cols-1 sm:grid-cols-2';
        case 3: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
        case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';
        default: return 'grid-cols-1 sm:grid-cols-2';
      }
    };

    const getStyles = (content: BlockContent) => ({
      color: content.color || 'inherit',
      fontSize: content.fontSize || 'inherit',
      textAlign: content.align as any || 'left',
      backgroundColor: content.backgroundColor || 'transparent',
      padding: content.padding || '1rem',
      margin: content.margin || '0',
      borderRadius: content.borderRadius === 'none' ? '0' : 
                   content.borderRadius === 'sm' ? '0.25rem' :
                   content.borderRadius === 'md' ? '0.375rem' :
                   content.borderRadius === 'lg' ? '0.5rem' : '0',
      boxShadow: content.boxShadow ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : 'none',
    });

    const renderButton = (buttonConfig: any, style: any = {}) => {
      const buttonStyle = {
        background: buttonConfig.style === 'gradient'
          ? `linear-gradient(to right, ${buttonConfig.gradient?.from || '#4F46E5'}, ${buttonConfig.gradient?.to || '#6366F1'})`
          : buttonConfig.backgroundColor || '#4F46E5',
        color: style?.ctaColor || '#ffffff',
        fontSize: style?.ctaFontSize || '1rem',
        padding: style?.ctaPadding || '0.75rem 1.5rem',
        borderRadius: style?.ctaBorderRadius || '0.375rem',
        transition: 'all 0.3s ease',
        border: buttonConfig.style === 'outline' ? '2px solid currentColor' : 'none',
      };

    return (
        <button 
          className="mt-4 w-full font-medium transition-all transform hover:scale-105"
          style={buttonStyle}
        >
          {buttonConfig.text}
        </button>
      );
    };

    switch (block.type) {
      case 'hero':
        return (
          <div style={getStyles(block.content)} className="relative overflow-hidden">
                {block.content.imageUrl && (
              <div className="absolute inset-0">
                  <img
                    src={block.content.imageUrl}
                  alt={block.content.title || 'Hero'}
                  className="w-full h-full object-cover"
                />
                {block.content.overlay && (
                  <div 
                    className="absolute inset-0 bg-black" 
                    style={{ opacity: block.content.overlay.opacity || 0.5 }}
                  />
                )}
              </div>
            )}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-24">
              <h1 
                className="text-4xl md:text-5xl font-bold"
                  style={{
                  color: block.content.style?.titleColor || '#ffffff',
                  fontSize: block.content.style?.titleFontSize,
                  lineHeight: block.content.style?.titleLineHeight,
                  letterSpacing: block.content.style?.titleLetterSpacing,
                }}
              >
                {block.content.title}
              </h1>
              {block.content.subtitle && (
                <p 
                  className="mt-6 text-xl md:text-2xl"
                  style={{
                    color: block.content.style?.subtitleColor || '#ffffff',
                    fontSize: block.content.style?.subtitleFontSize,
                    lineHeight: block.content.style?.subtitleLineHeight,
                    marginTop: block.content.style?.subtitleMarginTop,
                  }}
                >
                  {block.content.subtitle}
                </p>
              )}
              {block.content.button && (
                renderButton(block.content.button, block.content.style)
                  )}
                </div>
              </div>
        );

      case 'product':
        return (
          <div style={getStyles(block.content)} className="relative">
            <div className={`grid ${getColumnClass(block.content.columns)} gap-6`}>
              {/* Render each product card */}
              {block.content.images?.filter(img => img?.url).map((image, index) => (
                <div key={index} className="space-y-4 bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                  <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden">
                    <img
                      src={image.url}
                      alt={image.alt || `Product Image ${index + 1}`}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-4 space-y-2">
                    <h3 className="text-xl font-semibold">{block.content.title}</h3>
                    {block.content.showDescription && (
                      <p className="text-gray-600">{block.content.description}</p>
                    )}
                    {block.content.showPrice && (
                      <p className="text-lg font-bold">{block.content.price}</p>
                    )}
                    {block.content.buttonText && (
                      renderButton({
                        text: block.content.buttonText,
                        style: block.content.buttonStyle,
                        backgroundColor: block.content.backgroundColor,
                      }, block.content.style)
                    )}
                  </div>
                  </div>
                ))}
              </div>
              </div>
        );

      case 'testimonial':
        return (
          <div style={getStyles(block.content)} className="relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                {block.content.avatar && (
                  <img
                    src={block.content.avatar}
                    alt={block.content.author || 'Testimonial'}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                )}
              </div>
              <blockquote className="text-xl italic text-gray-900">"{block.content.quote}"</blockquote>
              <div className="mt-4">
                <div className="font-semibold text-gray-900">{block.content.author}</div>
                {block.content.role && (
                  <div className="text-gray-500">{block.content.role}</div>
                )}
                {block.content.rating && (
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon
                        key={i}
                        className={`h-5 w-5 ${
                          i < block.content.rating! ? 'text-yellow-400' : 'text-gray-200'
                        }`}
                      />
                    ))}
              </div>
            )}
                </div>
              </div>
              </div>
        );

      case 'countdown':
        return (
          <div style={getStyles(block.content)} className="relative">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">{block.content.title}</h3>
              <div className="grid grid-cols-4 gap-4 max-w-lg mx-auto">
                {block.content.showDays && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-3xl font-bold">00</div>
                    <div className="text-sm text-gray-500">Days</div>
              </div>
            )}
                {block.content.showHours && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-3xl font-bold">00</div>
                    <div className="text-sm text-gray-500">Hours</div>
              </div>
            )}
                {block.content.showMinutes && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-3xl font-bold">00</div>
                    <div className="text-sm text-gray-500">Minutes</div>
                    </div>
                )}
                {block.content.showSeconds && (
                  <div className="bg-white rounded-lg shadow p-4">
                    <div className="text-3xl font-bold">00</div>
                    <div className="text-sm text-gray-500">Seconds</div>
              </div>
            )}
              </div>
            </div>
          </div>
        );

      case 'promotion':
        return (
          <div style={getStyles(block.content)} className="relative">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold">{block.content.title}</h3>
              {block.content.discount && (
                <div className="text-4xl font-bold text-indigo-600">{block.content.discount}</div>
              )}
              {block.content.code && (
                <div className="inline-block bg-gray-100 px-4 py-2 rounded-md">
                  <span className="font-mono font-bold">{block.content.code}</span>
                  </div>
                )}
              {block.content.expiryDate && (
                <p className="text-sm text-gray-500">
                  Expires {new Date(block.content.expiryDate).toLocaleDateString()}
                </p>
                  )}
                </div>
              </div>
        );

      default:
        return null;
    }
  };

  // Add error handling for template rendering
  if (!template) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Template not found</h2>
          <p className="mt-2 text-gray-600">The template you're trying to edit doesn't exist.</p>
          <button
            onClick={onCancel}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Top Bar - Highest z-index */}
      <div className="fixed top-0 left-0 right-0 bg-white border-b px-4 py-2 flex justify-between items-center z-[200]">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded ${
              canUndo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300'
            }`}
            title="Undo"
          >
            <UndoIcon className="h-5 w-5" />
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded ${
              canRedo ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300'
            }`}
            title="Redo"
          >
            <RedoIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            {hasUnsavedChanges ? 'Unsaved changes' : 'All changes saved'}
          </span>
          <button
            onClick={handleSaveAsDraft}
            disabled={isSaving || !hasUnsavedChanges}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Save as Draft
          </button>
          <button
            onClick={handlePublish}
            disabled={isSaving}
            className="px-4 py-2 text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Left Panel - High z-index */}
      <div className={`${
          showLeftPanel ? 'w-64' : 'w-0'
        } bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isMobileView ? 'fixed left-0 z-[150] h-full' : 'relative'
      }`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Blocks</h2>
          {isMobileView && (
            <button
              onClick={() => setShowLeftPanel(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['hero', 'featured-collection', 'promotion', 'testimonial', 'countdown', 'text', 'image', 'product', 'header', 'footer'].map((type) => (
              <button
                key={type}
                onClick={() => addBlock(type)}
                className="p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200"
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative pt-16">
        {/* Top Bar */}
        <div className="bg-white border-b px-4 py-2 flex justify-between items-center z-[100]">
          <div className="flex items-center space-x-2">
            {isMobileView && (
              <button
                onClick={() => setShowLeftPanel(true)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            )}
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                if (presetTemplates[e.target.value]) {
                  if (confirm('Load preset template? This will replace your current template.')) {
                    loadPresetTemplate(e.target.value);
                  }
                }
              }}
              className="rounded-md border-gray-300"
            >
              <option value="all">All Templates</option>
              {Object.keys(presetTemplates).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="email"
              placeholder="Test email address"
              value={testEmailAddress}
              onChange={(e) => setTestEmailAddress(e.target.value)}
              className="rounded-md border-gray-300 text-sm"
            />
            <button
              onClick={handleSendTest}
              disabled={!testEmailAddress || isSaving}
              className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Test Send
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {/* Template Editor Area */}
        <div className="flex-1 overflow-auto p-4">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="blocks">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-4"
                >
                  {(template?.blocks || []).map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`relative bg-white rounded-lg shadow-sm border-2 ${
                            selectedBlockId === block.id ? 'border-blue-500' : 'border-transparent'
                          }`}
                          onClick={() => setSelectedBlockId(block.id)}
                        >
                          {/* Block Controls - Higher z-index than content */}
                          <div className="absolute top-2 right-2 flex items-center space-x-2 z-[120]">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {/* Block Content */}
                          <div className="relative z-[110]">
                          {renderBlock(block)}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Right Panel - High z-index */}
      <div className={`${
          showRightPanel ? 'w-80' : 'w-0'
        } bg-white shadow-lg transition-all duration-300 ease-in-out ${
        isMobileView ? 'fixed right-0 z-[150] h-full' : 'relative'
      }`}>
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Settings</h2>
          {isMobileView && (
            <button
              onClick={() => setShowRightPanel(false)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="p-4 overflow-auto h-full">
          {selectedBlockId && renderBlockEditor(template.blocks.find(b => b.id === selectedBlockId))}
        </div>
      </div>
    </div>
  );
};

export default TemplateEditor;