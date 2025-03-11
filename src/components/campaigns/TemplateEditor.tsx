import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable, Droppable, DragDropContext, DropResult } from 'react-beautiful-dnd';
import { 
  TrashIcon, 
  SunIcon as UndoIcon, 
  RadioIcon as RedoIcon,
  SparklesIcon,
  ChevronLeftIcon, 
  ChevronRightIcon,
  ViewColumnsIcon,
  DevicePhoneMobileIcon,
  DeviceTabletIcon,
  ComputerDesktopIcon,
  UserIcon,
  ChartBarIcon,
  ClockIcon,
  UserGroupIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
  ArrowLeftIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { v4 as uuidv4 } from 'uuid';
import { cloudinaryService } from './cloudinaryService';
import { ApolloService } from '../../services/apollo';
import { useResend } from '../../hooks/useResend';
import { useAI } from '../../hooks/useAI';
import { useTemplate } from '../../hooks/useTemplate';
import { StarIcon } from '@heroicons/react/24/solid';
import { presetTemplates, responsiveStyles, templateFeatures } from './presetTemplates';
import Modal from '../../components/Modal';
import { Template, Block, BlockType, BlockContent } from '@/types/template';
import Joyride, { Step } from 'react-joyride';
import { useAuth } from '@/contexts/AuthContext';
import { apolloService } from '@/services/apollo';
import { useSubscription } from '@/hooks/useSubscription';
import { Subscription } from '@/types/subscription'; // Import Subscription type from the new file
import { fetchSavedTemplates } from '../../services/api'; // Updated to new service file
import { aiOptimizationService } from '@/services/ai-optimization';
import { toast } from 'react-hot-toast';

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

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => Promise<void>;
  onPreview?: () => void;
  readOnly?: boolean;
}

const blockTypes: BlockType[] = [
  'hero',
  'featured-collection',
  'promotion',
  'testimonial',
  'countdown',
  'text',
  'image',
  'product',
  'header',
  'footer',
  'social-proof',
  'cart',
  'grid',
  'product-grid',
  'features',
  'benefits',
  'newsletter-signup',
  'divider',
  'spacer',
  'video',
  'social-share',
  'menu',
  'custom-block',
  'advanced-block'
];

type TriggerType = 'immediate' | 'scheduled' | 'event-based';
type SendTimeType = 'with-email' | 'before-email' | 'after-email';

// Extend the BlockContent type with additional properties
interface ExtendedBlockContent extends BlockContent {
  avatar?: string;
  borderRadius?: string;
  price?: string;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
}

// Move the getMinimumTierForBlock function to the top
function getMinimumTierForBlock(type: BlockType): string {
  switch (type) {
    // Free tier blocks
    case 'hero':
    case 'text':
    case 'image':
    case 'button':
    case 'spacer':
    case 'divider':
      return 'free';
    
    // Starter tier blocks
    case 'social':
    case 'video':
    case 'testimonial':
    case 'featured-collection':
      return 'starter';
    
    // Growth tier blocks
    case 'countdown':
    case 'product-grid':
    case 'cart':
    case 'benefits':
    case 'newsletter-signup':
      return 'growth';
    
    // Pro tier blocks
    case 'custom-block':
    case 'advanced-block':
    case 'menu':
      return 'pro';
    
    // Default to free tier if not specified
    default:
      return 'free';
  }
}

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template,
  onSave,
  onPreview,
  readOnly = false
}) => {
  const router = useRouter();
  const { subscription } = useSubscription();
  const maxBlocks = subscription ? subscription.limits.maxBlocks : 0;
  const maxPersonalizationFields = subscription ? subscription.limits.personalizationFields : 0;

  // Add new state for feature restriction modal
  const [showFeatureRestrictModal, setShowFeatureRestrictModal] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<{
    type: string;
    requiredTier: string;
    description: string;
  } | null>(null);

  // Add FeatureRestrictModal component
  const FeatureRestrictModal = () => (
    <Modal
      isOpen={showFeatureRestrictModal}
      onClose={() => setShowFeatureRestrictModal(false)}
      title="Feature Not Available"
      className="w-full max-w-md mx-auto"
    >
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-indigo-100 rounded-full">
            <LockClosedIcon className="w-6 h-6 text-indigo-600" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-center text-gray-900">
            Upgrade Required
          </h3>
          <p className="mt-2 text-sm text-center text-gray-500">
            {restrictedFeature?.description || 'This feature requires a higher subscription tier.'}
          </p>
        </div>
        
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            {restrictedFeature?.requiredTier.charAt(0).toUpperCase() + restrictedFeature?.requiredTier.slice(1)} Tier Features:
          </h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {restrictedFeature?.requiredTier === 'starter' && (
              <>
                <li>• Access to social media blocks</li>
                <li>• Video embedding</li>
                <li>• Testimonial layouts</li>
                <li>• Featured collections</li>
              </>
            )}
            {restrictedFeature?.requiredTier === 'growth' && (
              <>
                <li>• Countdown timers</li>
                <li>• Product grid layouts</li>
                <li>• Shopping cart integration</li>
                <li>• Advanced newsletter signup</li>
              </>
            )}
            {restrictedFeature?.requiredTier === 'pro' && (
              <>
                <li>• Custom HTML blocks</li>
                <li>• Advanced layouts</li>
                <li>• Custom menu blocks</li>
                <li>• Priority support</li>
              </>
            )}
          </ul>
        </div>

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={() => setShowFeatureRestrictModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setShowFeatureRestrictModal(false);
              router.push('/dashboard/subscription');
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </Modal>
  );

  const handleFeatureAttempt = (type: BlockType): boolean => {
    const currentTier = subscription?.tier || 'free';
    const requiredTier = getMinimumTierForBlock(type);
    
    // Define tier levels for comparison
    const tierLevels = {
      'free': 0,
      'starter': 1,
      'growth': 2,
      'pro': 3
    };

    if (tierLevels[currentTier] < tierLevels[requiredTier]) {
      setRestrictedFeature({
        type,
        requiredTier,
        description: `The ${type} block is only available in the ${requiredTier} tier and above. Upgrade your subscription to access this feature.`
      });
      setShowFeatureRestrictModal(true);
      return false;
    }

    return true;
  };

  const [blocks, setBlocks] = useState(template.blocks);
  const [personalizationFields, setPersonalizationFields] = useState<string[]>([]);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null); // Renamed to avoid conflict

  // New state for saved templates
  const [savedTemplates, setSavedTemplates] = useState<Template[]>([]);

  useEffect(() => {
    const loadSavedTemplates = async () => {
      try {
        const templates = await fetchSavedTemplates();
        setSavedTemplates(templates);
      } catch (error) {
        console.error('Error fetching saved templates:', error);
        setLocalError('Failed to load templates.'); // Set error message
      }
    };
    loadSavedTemplates();
  }, []);

  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showAutomationModal, setShowAutomationModal] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [showAudienceModal, setShowAudienceModal] = useState(false);
  const [utmParams, setUtmParams] = useState<{
    source?: string;
    medium?: string;
    campaign?: string;
  }>({});

  // Update automation settings with proper types
  const [automationSettings, setAutomationSettings] = useState<{
    triggerType: TriggerType;
    scheduledDate: string;
    scheduledTime: string;
    eventTrigger: string;
    delay: number;
    conditions: string[];
  }>({
    triggerType: 'immediate',
    scheduledDate: '',
    scheduledTime: '',
    eventTrigger: '',
    delay: 0,
    conditions: [],
  });

  // Update SMS settings with proper types
  const [smsSettings, setSmsSettings] = useState<{
    enabled: boolean;
    message: string;
    sendTime: SendTimeType;
    delay: number;
    consent: boolean;
  }>({
    enabled: false,
    message: '',
    sendTime: 'with-email',
    delay: 0,
    consent: true,
  });

  // Update analytics settings type
  const [analyticsSettings, setAnalyticsSettings] = useState({
    enableTracking: true,
    trackOpens: true,
    trackClicks: true,
    trackConversions: true,
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
  });

  // Add toolbar buttons
  const toolbarButtons = [
    {
      icon: <QuestionMarkCircleIcon className="w-5 h-5 md:hidden" />,
      label: 'Guide',
      onClick: () => setRunTour(true),
    },
    {
      icon: <DevicePhoneMobileIcon className="w-5 h-5 md:hidden" />,
      label: 'Mobile',
      onClick: () => setPreviewDevice('mobile'),
      active: previewDevice === 'mobile',
    },
    {
      icon: <DeviceTabletIcon className="w-5 h-5 md:hidden" />,
      label: 'Tablet',
      onClick: () => setPreviewDevice('tablet'),
      active: previewDevice === 'tablet',
    },
    {
      icon: <ComputerDesktopIcon className="w-5 h-5 md:hidden" />,
      label: 'Desktop',
      onClick: () => setPreviewDevice('desktop'),
      active: previewDevice === 'desktop',
    },
    {
      icon: <UserIcon className="w-5 h-5 md:hidden" />,
      label: 'Personalization',
      onClick: () => setShowPersonalizationModal(true),
    },
    {
      icon: <ClockIcon className="w-5 h-5 md:hidden" />,
      label: 'Automation',
      onClick: () => setShowAutomationModal(true),
    },
    {
      icon: <DevicePhoneMobileIcon className="w-5 h-5 md:hidden" />,
      label: 'SMS',
      onClick: () => setShowSmsModal(true),
    },
    {
      icon: <ChartBarIcon className="w-5 h-5 md:hidden" />,
      label: 'Analytics',
      onClick: () => setShowAnalyticsModal(true),
    },
    {
      icon: <UserGroupIcon className="w-5 h-5 md:hidden" />,
      label: 'Audience',
      onClick: () => setShowAudienceModal(true),
    },
  ];

  // Enhancing Personalization Fields
  const PersonalizationModal = () => {
    const { subscription } = useSubscription();
    const maxPersonalizationFields = subscription ? subscription.limits.personalizationFields : 0;

    // Logic to limit the number of personalization fields
    const [personalizationFields, setPersonalizationFields] = useState<string[]>([]);

    const addPersonalizationField = () => {
        if (personalizationFields.length < maxPersonalizationFields) {
            setPersonalizationFields([...personalizationFields, '']);
        } else {
            alert('You have reached the limit for personalization fields.');
        }
    };

    return (
    <Modal
      isOpen={showPersonalizationModal}
      onClose={() => setShowPersonalizationModal(false)}
      title="Personalization Fields"
      className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
    >
      <div className="space-y-4 max-h-[80vh] overflow-y-auto px-3 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2">
          <input
            type="text"
            placeholder="Add field (e.g., firstName)"
            className="w-full sm:flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const value = e.currentTarget.value;
                if (value) {
                  setPersonalizationFields([...personalizationFields, value]);
                  e.currentTarget.value = '';
                }
              }
            }}
            onChange={(e) => e.preventDefault()}
          />
          <button
            onClick={(e) => {
              const value = (e.currentTarget.previousElementSibling as HTMLInputElement).value;
              if (value) {
                setPersonalizationFields([...personalizationFields, value]);
                (e.currentTarget.previousElementSibling as HTMLInputElement).value = '';
              }
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Add
          </button>
        </div>
        <div className="space-y-2 mt-4">
          {personalizationFields.map((field, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <span className="text-sm sm:text-base">{field}</span>
              <button
                onClick={() => {
                  const newFields = [...personalizationFields];
                  newFields.splice(index, 1);
                  setPersonalizationFields(newFields);
                }}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
};

  // Update the event handlers to use proper types
  const handleAutomationTypeChange = (value: string) => {
    if (value === 'immediate' || value === 'scheduled' || value === 'event-based') {
      setAutomationSettings({
        ...automationSettings,
        triggerType: value
      });
    }
  };

  const handleSmsTimeChange = (value: string) => {
    if (value === 'with-email' || value === 'before-email' || value === 'after-email') {
      setSmsSettings({
        ...smsSettings,
        sendTime: value
      });
    }
  };

  // Automation modal
  const AutomationModal = () => (
    <Modal
      isOpen={showAutomationModal}
      onClose={() => setShowAutomationModal(false)}
      title="Automation Settings"
      className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto px-3 sm:px-6 py-4">
      <div className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trigger Type</label>
          <select
            value={automationSettings.triggerType}
            onChange={(e) => handleAutomationTypeChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="immediate">Send Immediately</option>
            <option value="scheduled">Schedule</option>
            <option value="event-based">Event Based</option>
          </select>
        </div>

        {automationSettings.triggerType === 'scheduled' && (
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={automationSettings.scheduledDate}
                onChange={(e) => setAutomationSettings({
                  ...automationSettings,
                  scheduledDate: e.target.value
                })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={automationSettings.scheduledTime}
                onChange={(e) => setAutomationSettings({
                  ...automationSettings,
                  scheduledTime: e.target.value
                })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            </div>
        )}

        {automationSettings.triggerType === 'event-based' && (
            <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Event Trigger</label>
              <select
                value={automationSettings.eventTrigger}
                onChange={(e) => setAutomationSettings({
                  ...automationSettings,
                  eventTrigger: e.target.value
                })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="cart-abandoned">Cart Abandoned</option>
                <option value="purchase-complete">Purchase Complete</option>
                <option value="email-opened">Email Opened</option>
                <option value="link-clicked">Link Clicked</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay (hours)</label>
              <input
                type="number"
                value={automationSettings.delay}
                onChange={(e) => setAutomationSettings({
                  ...automationSettings,
                  delay: parseInt(e.target.value)
                })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                min="0"
              />
            </div>
            </div>
        )}
        </div>
      </div>
    </Modal>
  );

  // SMS modal
  const SmsModal = () => (
    <Modal
      isOpen={showSmsModal}
      onClose={() => setShowSmsModal(false)}
      title="SMS Integration"
      className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto px-3 sm:px-6 py-4">
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={smsSettings.enabled}
            onChange={(e) => setSmsSettings({
              ...smsSettings,
              enabled: e.target.checked
            })}
            className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
          />
          <label className="text-sm sm:text-base text-gray-900">
            Enable SMS with this campaign
          </label>
        </div>

        {smsSettings.enabled && (
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={smsSettings.message}
                onChange={(e) => setSmsSettings({
                  ...smsSettings,
                  message: e.target.value
                })}
                rows={4}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Enter your SMS message..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Send Time</label>
              <select
                value={smsSettings.sendTime}
                onChange={(e) => handleSmsTimeChange(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="with-email">Send with Email</option>
                <option value="before-email">Send before Email</option>
                <option value="after-email">Send after Email</option>
              </select>
            </div>
            {smsSettings.sendTime !== 'with-email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Delay (hours)</label>
                <input
                  type="number"
                  value={smsSettings.delay}
                  onChange={(e) => setSmsSettings({
                    ...smsSettings,
                    delay: parseInt(e.target.value)
                  })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  min="0"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );

  // Improving UTM Parameters
  const AnalyticsModal = () => (
    <Modal
      isOpen={showAnalyticsModal}
      onClose={() => setShowAnalyticsModal(false)}
      title="Analytics & Tracking"
      className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto px-3 sm:px-6 py-4">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            placeholder="UTM Source"
            value={analyticsSettings.utmSource}
            onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, utmSource: e.target.value })}
            className="h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            title="The source of your traffic (e.g., Google, newsletter)"
          />
          <input
            type="text"
            placeholder="UTM Medium"
            value={analyticsSettings.utmMedium}
            onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, utmMedium: e.target.value })}
            className="h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            title="The medium of your traffic (e.g., email, cpc)"
          />
          <input
            type="text"
            placeholder="UTM Campaign"
            value={analyticsSettings.utmCampaign}
            onChange={(e) => setAnalyticsSettings({ ...analyticsSettings, utmCampaign: e.target.value })}
            className="h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            title="The name of your campaign (e.g., spring_sale)"
          />
        </div>
        <button
          onClick={() => {
            if (!analyticsSettings.utmSource || !analyticsSettings.utmMedium || !analyticsSettings.utmCampaign) {
              alert('Please fill in all UTM parameters.');
              return;
            }
            alert('UTM parameters saved successfully!');
          }}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded"
        >
          Save UTM Parameters
        </button>
      </div>
    </Modal>
  );

  // Update preview container with device preview
  const getPreviewScale = () => {
    switch (previewDevice) {
      case 'mobile':
        return 'max-w-sm';
      case 'tablet':
        return 'max-w-2xl';
      default:
        return 'max-w-4xl';
    }
  };

  const getInitialBlockContent = (type: BlockType): BlockContent => {
    switch (type) {
      case 'hero':
        return {
          title: 'Welcome to Our Store',
          subtitle: 'Discover the best products for you!',
          imageUrl: 'https://source.unsplash.com/random/1920x1080',
          button: { 
            text: 'Shop Now', 
            style: 'primary',
            url: '#'
          },
          backgroundColor: '#f8fafc',
          textColor: '#1a202c'
        };
      case 'featured-collection':
        return {
          title: 'Featured Products',
          products: [
            {
              id: '1',
              title: 'Product 1',
              description: 'Amazing product description',
              price: '$99.99',
              imageUrl: 'https://source.unsplash.com/random/800x600',
              url: '#',
              button: { text: 'View Details', style: 'primary' }
            }
          ],
          backgroundColor: '#ffffff'
        };
      case 'promotion':
        return {
          title: 'Special Offer',
          description: 'Get 20% off on your first purchase',
          code: 'WELCOME20',
          backgroundColor: '#4f46e5',
          textColor: '#ffffff'
        };
      case 'testimonial':
        return {
          quote: 'This product changed my life!',
          author: 'John Doe',
          role: 'Happy Customer',
          avatar: 'https://source.unsplash.com/random/100x100',
          backgroundColor: '#f9fafb'
        };
      case 'text':
        return {
          text: 'Enter your content here...',
          align: 'left',
          fontSize: '16px',
          color: '#1a202c',
          backgroundColor: '#ffffff'
        };
      case 'image':
        return {
          imageUrl: 'https://source.unsplash.com/random/1200x800',
          alt: 'Beautiful image',
          width: '100%',
          height: 'auto',
          borderRadius: '8px'
        };
      case 'product':
        return {
          title: 'Amazing Product',
          description: 'This is an amazing product that will solve all your problems.',
          price: '$199.99',
          imageUrl: 'https://source.unsplash.com/random/800x600',
          button: {
            text: 'Buy Now',
            style: 'primary',
            url: '#'
          },
          showPrice: true,
          showDescription: true,
          backgroundColor: '#ffffff'
        };
      case 'features':
        return {
          title: 'Key Features',
          features: [
            {
              icon: '⚡',
              title: 'Fast',
              description: 'Lightning quick delivery'
            },
            {
              icon: '🛡️',
              title: 'Secure',
              description: 'Bank-level security'
            },
            {
              icon: '💎',
              title: 'Premium',
              description: 'Top-quality service'
            }
          ],
          backgroundColor: '#ffffff'
        };
      case 'social-proof':
        return {
          title: 'Customer Reviews',
          reviews: [
            {
              text: 'This product is amazing! I love it so much.',
              author: 'John Doe',
              date: 'January 1, 2024',
              rating: 5,
              avatar: 'https://source.unsplash.com/random/100x100'
            },
            {
              text: 'I highly recommend this product. It exceeded my expectations.',
              author: 'Jane Smith',
              date: 'December 15, 2023',
              rating: 4,
              avatar: 'https://source.unsplash.com/random/100x100'
            },
            {
              text: 'This is the best purchase I have ever made. 100% recommended.',
              author: 'Bob Johnson',
              date: 'November 20, 2023',
              rating: 5,
              avatar: 'https://source.unsplash.com/random/100x100'
            }
          ],
          backgroundColor: '#ffffff'
        };
      case 'countdown':
        return {
          title: 'Sale Ends in',
          button: {
            text: 'Shop Now',
            style: 'primary',
            url: '#'
          },
          backgroundColor: '#4f46e5',
          textColor: '#ffffff'
        };
      case 'newsletter-signup':
        return {
          title: 'Join Our Newsletter',
          description: 'Get exclusive deals and updates right in your inbox.',
          button: {
            text: 'Subscribe',
            style: 'primary',
            url: '#'
          },
          placeholder: 'Enter your email'
        };
      case 'divider':
        return {
          color: '#e5e7eb',
          style: 'solid',
          margin: '1rem 0'
        };
      case 'spacer':
        return {
          height: '2rem'
        };
      case 'video':
        return {
          title: 'Watch Our Video',
          videoUrl: 'https://example.com/video.mp4',
          videoThumbnail: 'https://example.com/video-thumbnail.jpg',
          description: 'A short video about our product'
        };
      case 'social-share':
        return {
          title: 'Share This Product',
          facebookUrl: 'https://www.facebook.com/sharer/sharer.php?u=https://example.com',
          twitterUrl: 'https://twitter.com/intent/tweet?url=https://example.com',
          linkedinUrl: 'https://www.linkedin.com/shareArticle?url=https://example.com',
          instagramUrl: 'https://www.instagram.com/sharer/sharer.php?u=https://example.com'
        };
      case 'menu':
        return {
          title: 'Menu',
          items: [
            {
              name: 'Burger',
              description: 'A delicious burger with fries',
              price: '$12.99'
            },
            {
              name: 'Salad',
              description: 'A fresh salad with dressing',
              price: '$8.99'
            },
            {
              name: 'Pizza',
              description: 'A cheesy pizza with toppings',
              price: '$15.99'
            }
          ] as Array<{ name: string; description: string; price: string; }>
        };
      default:
        return {
          title: 'New Block',
          text: 'Click to edit this block',
          backgroundColor: '#ffffff'
        };
    }
  };

  // Update button type handling
  const updateButtonContent = (
    currentButton: BlockContent['button'],
    updates: Partial<Required<NonNullable<BlockContent['button']>>>
  ): BlockContent['button'] => {
    return {
      text: updates.text || currentButton?.text || 'Click Here',
      style: updates.style || currentButton?.style || 'primary',
      url: updates.url || currentButton?.url || '#',
      gradient: updates.gradient || currentButton?.gradient
    };
  };

  const addBlock = (type: BlockType) => {
    if (!handleFeatureAttempt(type)) return;

    // Add the new block without checking for maximum limits
    const newBlock = { 
      id: uuidv4(),
      type,
      content: getInitialBlockContent(type)
    };
    setBlocks([...blocks, newBlock]);
  };

  const deleteBlock = (blockId: string) => {
    setBlockToDelete(blockId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!blockToDelete) return;
    
    const blockIndex = blocks.findIndex(b => b.id === blockToDelete);
    const deletedBlock = blocks[blockIndex];
    
    setBlocks(prevBlocks => prevBlocks.filter(block => block.id !== blockToDelete));
    setDeletedBlocks(prev => [...prev, deletedBlock]);
    
    toast.success(
      <div className="flex items-center gap-2">
        Block deleted
        <button 
          onClick={() => undoDelete()} 
          className="text-indigo-600 hover:text-indigo-500 font-medium"
        >
          Undo
        </button>
      </div>,
      { duration: 5000 }
    );
    
    setShowDeleteConfirm(false);
    setBlockToDelete(null);
  };

  const undoDelete = () => {
    if (deletedBlocks.length === 0) return;
    
    const lastDeleted = deletedBlocks[deletedBlocks.length - 1];
    setBlocks(prev => [...prev, lastDeleted]);
    setDeletedBlocks(prev => prev.slice(0, -1));
    
    toast.success('Block restored');
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setBlocks(items); // Update to setBlocks correctly
  };

  const renderBlock = (block: Block) => {
    if (!isBlockTypeAvailable(block.type)) {
      return (
        <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
          <p className="text-sm text-gray-600">
            This block type requires a {getMinimumTierForBlock(block.type)} subscription.
            <button
              onClick={() => router.push('/dashboard/subscription')}
              className="ml-2 text-indigo-600 hover:text-indigo-500"
            >
              Upgrade now →
            </button>
          </p>
        </div>
      );
    }

    const { type, content } = block;
    const extendedContent = content as ExtendedBlockContent;
    
    switch (type) {
      case 'hero':
        return (
          <div className="relative overflow-hidden">
            {extendedContent.imageUrl && (
              <div className="absolute inset-0">
                <img
                  src={extendedContent.imageUrl}
                  alt={extendedContent.alt || 'Hero background'}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-40"></div>
              </div>
            )}
            <div className="relative px-8 py-16 text-center">
              {extendedContent.title && (
                <h1 className="text-4xl font-bold text-white mb-4">{extendedContent.title}</h1>
              )}
              {extendedContent.subtitle && (
                <p className="text-xl text-white mb-8">{extendedContent.subtitle}</p>
              )}
              {extendedContent.button && (
                <button className={`px-8 py-3 rounded-lg font-medium ${
                  extendedContent.button.style === 'primary' 
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-white text-gray-900 hover:bg-gray-100'
                }`}>
                  {extendedContent.button.text}
                </button>
              )}
            </div>
          </div>
        );

      case 'featured-collection':
        return (
          <div className="p-8">
            {extendedContent.title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {extendedContent.products?.map((product, index) => (
                <div key={index} className="group relative">
                  <div className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="object-cover object-center"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-gray-900">{product.title}</h3>
                    <p className="text-lg font-medium text-gray-900">{product.price}</p>
                    {product.button && (
                      <button className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        {product.button.text}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'promotion':
        return (
          <div className="bg-indigo-700 text-white p-8 text-center">
            {extendedContent.title && (
              <h2 className="text-3xl font-bold mb-4">{extendedContent.title}</h2>
            )}
            {extendedContent.description && (
              <p className="text-xl mb-6">{extendedContent.description}</p>
            )}
            {extendedContent.code && (
              <div className="inline-block bg-white text-indigo-700 px-6 py-3 rounded-lg font-mono text-lg font-bold">
                {extendedContent.code}
              </div>
            )}
          </div>
        );

      case 'testimonial':
        return (
          <div className="p-8 bg-gray-50">
            {extendedContent.quote && (
              <blockquote className="text-xl text-gray-900 text-center italic mb-6">
                "{extendedContent.quote}"
              </blockquote>
            )}
            <div className="flex items-center justify-center">
              {extendedContent.avatar && (
                <img
                  src={extendedContent.avatar}
                  alt={extendedContent.author || 'Testimonial author'}
                  className="h-12 w-12 rounded-full mr-4"
                />
              )}
              <div>
                {extendedContent.author && (
                  <div className="font-medium text-gray-900">{extendedContent.author}</div>
                )}
                {extendedContent.role && (
                  <div className="text-gray-500">{extendedContent.role}</div>
                )}
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`p-8 ${extendedContent.backgroundColor ? `bg-${extendedContent.backgroundColor}` : ''}`}>
            <div className={`prose max-w-none ${extendedContent.align ? `text-${extendedContent.align}` : ''}`}>
              {extendedContent.text && (
                <div dangerouslySetInnerHTML={{ __html: extendedContent.text }} />
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-8">
            {extendedContent.imageUrl && (
              <img
                src={extendedContent.imageUrl}
                alt={extendedContent.alt || 'Image'}
                className={`w-full ${extendedContent.borderRadius ? `rounded-${extendedContent.borderRadius}` : ''}`}
                style={{
                  maxWidth: extendedContent.width || 'none',
                  margin: extendedContent.align === 'center' ? '0 auto' : undefined
                }}
              />
            )}
          </div>
        );

      case 'product':
        return (
          <div className="p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {extendedContent.imageUrl && (
                <div className="flex-1">
                  <img
                    src={extendedContent.imageUrl}
                    alt={extendedContent.title || 'Product'}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              <div className="flex-1 space-y-4">
                {extendedContent.title && (
                  <h2 className="text-2xl font-bold text-gray-900">{extendedContent.title}</h2>
                )}
                {extendedContent.description && (
                  <p className="text-gray-600">{extendedContent.description}</p>
                )}
                {extendedContent.price && (
                  <div className="text-2xl font-bold text-gray-900">{extendedContent.price}</div>
                )}
                {extendedContent.button && (
                  <button className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">
                    {extendedContent.button.text}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="p-8">
            {extendedContent.title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {extendedContent.features?.map((feature, index) => (
                <div key={index} className="text-center">
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'social-proof':
        return (
          <div className="p-8 bg-white">
            {extendedContent.title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {extendedContent.reviews?.map((review, index) => (
                <div key={index} className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center mb-4">
                    {review.avatar && (
                      <img src={review.avatar} alt={review.name} className="h-12 w-12 rounded-full mr-4" />
                    )}
            <div>
                      <div className="font-medium text-gray-900">{review.name}</div>
                      <div className="text-gray-500">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex text-yellow-400 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <StarIcon key={i} className={`h-5 w-5 ${i < (review.rating || 5) ? 'text-yellow-400' : 'text-gray-300'}`} />
                    ))}
            </div>
                  <p className="text-gray-600">{review.text}</p>
          </div>
              ))}
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="p-8 text-center" style={{ backgroundColor: extendedContent.backgroundColor || '#ffffff' }}>
            {extendedContent.title && (
              <h2 className="text-2xl font-bold mb-4" style={{ color: extendedContent.textColor || '#000000' }}>
                {extendedContent.title}
              </h2>
            )}
            <div className="flex justify-center space-x-4">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                <div key={unit} className="bg-gray-800 text-white p-4 rounded-lg">
                  <div className="text-3xl font-bold">{extendedContent[unit] || '00'}</div>
                  <div className="text-sm uppercase">{unit}</div>
                </div>
              ))}
            </div>
            {extendedContent.button && (
              <button className={`mt-8 px-6 py-3 rounded-lg font-medium ${
                extendedContent.button.style === 'primary' 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-white text-gray-900 hover:bg-gray-100'
              }`}>
                {extendedContent.button.text}
              </button>
            )}
          </div>
        );

      case 'newsletter-signup':
        return (
          <div className="p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-center">
            {extendedContent.title && (
              <h2 className="text-3xl font-bold mb-4">{extendedContent.title}</h2>
            )}
            {extendedContent.description && (
              <p className="text-lg mb-6 opacity-90">{extendedContent.description}</p>
            )}
            <div className="max-w-md mx-auto">
              <div className="flex gap-2">
              <input
                  type="email"
                  placeholder={extendedContent.placeholder || "Enter your email"}
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900"
                />
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100">
                  {extendedContent.button?.text || "Subscribe"}
                </button>
              </div>
                </div>
              </div>
        );

      case 'divider':
        return (
          <div className="py-4">
            <hr className="border-t" style={{
              borderColor: extendedContent.color || '#e5e7eb',
              borderStyle: extendedContent.style || 'solid',
              margin: extendedContent.margin || '1rem 0'
            }} />
          </div>
        );

      case 'spacer':
        return (
          <div style={{ height: extendedContent.height || '2rem' }} />
        );

      case 'video':
        return (
          <div className="p-8">
            {extendedContent.title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{extendedContent.title}</h2>
            )}
            <div className="relative aspect-w-16 aspect-h-9">
              {extendedContent.videoUrl && (
                <iframe
                  src={extendedContent.videoUrl}
                  className="absolute inset-0 w-full h-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {extendedContent.videoThumbnail && !extendedContent.videoUrl && (
                <div className="absolute inset-0 bg-black">
                  <img
                    src={extendedContent.videoThumbnail}
                    alt="Video thumbnail"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <div className="w-0 h-0 border-t-8 border-b-8 border-l-12 border-transparent border-l-indigo-600 ml-1" />
            </div>
                  </div>
                </div>
              )}
            </div>
            {extendedContent.description && (
              <p className="mt-4 text-gray-600">{extendedContent.description}</p>
            )}
          </div>
        );

      case 'social-share':
        return (
          <div className="p-8 text-center">
            {extendedContent.title && (
              <h2 className="text-xl font-bold text-gray-900 mb-4">{extendedContent.title}</h2>
            )}
            <div className="flex justify-center space-x-4">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map((platform) => (
                <a
                  key={platform}
                  href={extendedContent[`${platform}Url`] || '#'}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`/icons/${platform}.svg`}
                    alt={`Share on ${platform}`}
                    className="w-6 h-6"
                  />
                </a>
              ))}
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="p-8">
            {extendedContent.title && (
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {extendedContent.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-gray-500">{item.description}</p>
                  </div>
                  <div className="text-lg font-bold text-indigo-600">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 text-gray-500 text-center">
            {type} block - Click to edit
          </div>
        );
    }
  };

  const renderBlockEditor = (block: Template['blocks'][number] | undefined) => {
    if (!block) return null;
    const { type, content } = block;
    
    const updateContent = (updates: Partial<BlockContent>) => {
      setBlocks(prev => prev.map(b => 
        b.id === block.id ? { ...b, content: { ...content, ...updates } } : b
      ));
    };

    const handleAIOptimize = async (field: string, text: string, textType: 'title' | 'description' | 'quote' | 'button' | 'feature') => {
      try {
        const result = await aiOptimizationService.optimizeBlockText({
          text,
          type: textType,
          context: {
            industry: template.industry,
            tone: template.tone,
            purpose: template.purpose,
            targetAudience: template.targetAudience
          }
        });

        // Update the content with optimized text
        updateContent({ [field]: result.optimizedText });

        // Show suggestions in a modal
        setOptimizationResult({
          field,
          originalText: text,
          ...result
        });
        setShowOptimizationModal(true);
      } catch (error) {
        console.error('Error optimizing text:', error);
        // Show error message
      }
    };

    const AIOptimizeButton = ({ field, text, type }: { field: string; text: string; type: 'title' | 'description' | 'quote' | 'button' | 'feature' }) => (
      <button
        onClick={() => handleAIOptimize(field, text, type)}
        className="absolute right-2 top-2 p-1 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-gray-100"
        title="Optimize with AI"
      >
        <SparklesIcon className="w-5 h-5" />
      </button>
    );

    const TextInputWithAI = ({ 
      label, 
      value, 
      onChange, 
      field, 
      type,
      multiline = false
    }: { 
      label: string;
      value: string;
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
      field: string;
      type: 'title' | 'description' | 'quote' | 'button' | 'feature';
      multiline?: boolean;
    }) => (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {multiline ? (
          <textarea
            value={value}
            onChange={onChange}
            className="w-full rounded-md border-gray-300 pr-10"
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            className="w-full rounded-md border-gray-300 pr-10"
          />
        )}
        <AIOptimizeButton field={field} text={value} type={type} />
      </div>
    );

    // Common style options that apply to most blocks
    const CommonStyleOptions = () => (
      <div className="space-y-4 border-t pt-4 mt-4">
        <h3 className="font-medium text-gray-900">Style Options</h3>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Background Color
          </label>
              <input
            type="color"
            value={content.backgroundColor || '#ffffff'}
            onChange={(e) => updateContent({ backgroundColor: e.target.value })}
            className="h-8 w-full rounded-md"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text Color
          </label>
              <input
            type="color"
            value={content.textColor || '#000000'}
            onChange={(e) => updateContent({ textColor: e.target.value })}
            className="h-8 w-full rounded-md"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Padding
          </label>
              <input
            type="text"
            value={content.padding || '1rem'}
            onChange={(e) => updateContent({ padding: e.target.value })}
            className="w-full rounded-md border-gray-300"
            placeholder="e.g., 1rem or 16px"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Border Radius
          </label>
          <input
            type="text"
            value={content.borderRadius || '0'}
            onChange={(e) => updateContent({ borderRadius: e.target.value })}
            className="w-full rounded-md border-gray-300"
            placeholder="e.g., 0.5rem or 8px"
          />
        </div>
      </div>
    );

    // Button style options
    const ButtonStyleOptions = () => (
      <div className="space-y-4 border-t pt-4 mt-4">
        <h3 className="font-medium text-gray-900">Button Style</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Style
          </label>
              <select
            value={content.button?.style || 'primary'}
            onChange={(e) => updateContent({ 
              button: updateButtonContent(content.button, { 
                style: e.target.value as 'primary' | 'secondary' | 'ghost' | 'gradient' | 'outline' | 'link'
              })
            })}
            className="w-full rounded-md border-gray-300"
              >
            <option value="primary">Primary</option>
            <option value="secondary">Secondary</option>
            <option value="ghost">Ghost</option>
                <option value="gradient">Gradient</option>
            <option value="outline">Outline</option>
            <option value="link">Link</option>
              </select>
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Text
          </label>
              <input
                type="text"
            value={content.button?.text || ''}
            onChange={(e) => updateContent({ 
              button: updateButtonContent(content.button, { text: e.target.value })
            })}
            className="w-full rounded-md border-gray-300"
            placeholder="Button text"
              />
            </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            URL
          </label>
              <input
                type="text"
            value={content.button?.url || ''}
            onChange={(e) => updateContent({ 
              button: updateButtonContent(content.button, { url: e.target.value })
            })}
            className="w-full rounded-md border-gray-300"
            placeholder="https://..."
              />
            </div>
            </div>
    );
    
    return (
            <div className="space-y-4">
        {/* Block Type */}
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Block Type
          </label>
          <div className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded">
            {type}
            </div>
              </div>

        {/* Block-specific fields */}
        {type === 'hero' && (
          <>
              <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
                <input
            type="text"
            value={content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
            className="w-full rounded-md border-gray-300"
                />
              </div>
            <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subtitle
          </label>
              <input
                type="text"
            value={content.subtitle || ''}
                onChange={(e) => updateContent({ subtitle: e.target.value })}
            className="w-full rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={content.imageUrl || ''}
                onChange={(e) => updateContent({ imageUrl: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <ButtonStyleOptions />
            <CommonStyleOptions />
          </>
        )}

        {type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                value={content.text || ''}
                onChange={(e) => updateContent({ text: e.target.value })}
                rows={4}
                className="w-full rounded-md border-gray-300"
                  />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text Alignment
              </label>
              <select
                value={content.align || 'left'}
                onChange={(e) => updateContent({ align: e.target.value as 'left' | 'center' | 'right' })}
                className="w-full rounded-md border-gray-300"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Font Size
              </label>
              <input
                type="text"
                value={content.fontSize || '1rem'}
                onChange={(e) => updateContent({ fontSize: e.target.value })}
                className="w-full rounded-md border-gray-300"
                placeholder="e.g., 1rem or 16px"
              />
            </div>
            <CommonStyleOptions />
          </>
        )}

        {type === 'image' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const imageUrl = await handleImageUpload(file);
                      if (imageUrl) {
                        updateContent({ imageUrl });
                      }
                    }
                  }}
                  className="w-full"
                />
                {content.imageUrl && (
                  <button
                    onClick={() => updateContent({ imageUrl: '' })}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
              {content.imageUrl && (
                <img 
                  src={content.imageUrl} 
                  alt="Preview" 
                  className="mt-2 max-w-full h-auto rounded"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Text
              </label>
              <input
                type="text"
                value={content.alt || ''}
                onChange={(e) => updateContent({ alt: e.target.value })}
                className="w-full rounded-md border-gray-300"
                placeholder="Describe the image for accessibility"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width
                </label>
                <select
                  value={content.width || '100%'}
                  onChange={(e) => updateContent({ width: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                >
                  <option value="100%">Full Width</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="25%">25%</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alignment
                </label>
                <select
                  value={content.align || 'center'}
                  onChange={(e) => updateContent({ align: e.target.value })}
                  className="w-full rounded-md border-gray-300"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </select>
              </div>
            </div>
            <CommonStyleOptions />
          </>
        )}

        {type === 'product' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Product Title
              </label>
              <input
                  type="text"
                value={content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={content.description || ''}
                onChange={(e) => updateContent({ description: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300"
                />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <input
                type="text"
                value={content.price || ''}
                onChange={(e) => updateContent({ price: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Image URL
              </label>
              <input
                type="text"
                value={content.imageUrl || ''}
                onChange={(e) => updateContent({ imageUrl: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <ButtonStyleOptions />
            <CommonStyleOptions />
          </>
        )}

        {type === 'testimonial' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quote
              </label>
                <textarea
                value={content.quote || ''}
                onChange={(e) => updateContent({ quote: e.target.value })}
                rows={3}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Name
              </label>
              <input
                type="text"
                value={content.author || ''}
                onChange={(e) => updateContent({ author: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Author Role
              </label>
                <input
                  type="text"
                value={content.role || ''}
                onChange={(e) => updateContent({ role: e.target.value })}
                className="w-full rounded-md border-gray-300"
                />
              </div>
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avatar URL
              </label>
                <input
                  type="text"
                value={content.avatar || ''}
                onChange={(e) => updateContent({ avatar: e.target.value })}
                className="w-full rounded-md border-gray-300"
                />
              </div>
            <CommonStyleOptions />
          </>
        )}

        {type === 'features' && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section Title
              </label>
              <input
                type="text"
                value={content.title || ''}
                onChange={(e) => updateContent({ title: e.target.value })}
                className="w-full rounded-md border-gray-300"
              />
            </div>
            <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
                Features
            </label>
              {(content.features || []).map((feature: any, index: number) => (
                <div key={index} className="space-y-2 p-3 border rounded-md">
              <input
                type="text"
                    value={feature.icon || ''}
                            onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, icon: e.target.value };
                      updateContent({ features: newFeatures });
              }}
              className="w-full rounded-md border-gray-300"
                    placeholder="Feature icon (emoji or icon class)"
            />
              <input
                type="text"
                    value={feature.title || ''}
                          onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, title: e.target.value };
                      updateContent({ features: newFeatures });
              }}
              className="w-full rounded-md border-gray-300"
                    placeholder="Feature title"
                  />
                  <textarea
                    value={feature.description || ''}
                    onChange={(e) => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures[index] = { ...feature, description: e.target.value };
                      updateContent({ features: newFeatures });
                    }}
                    className="w-full rounded-md border-gray-300"
                    placeholder="Feature description"
                    rows={2}
                  />
                  <button
                    onClick={() => {
                      const newFeatures = [...(content.features || [])];
                      newFeatures.splice(index, 1);
                      updateContent({ features: newFeatures });
                    }}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove Feature
                  </button>
                </div>
              ))}
          <button
                onClick={() => {
                  const newFeatures = [...(content.features || []), { icon: '', title: '', description: '' }];
                  updateContent({ features: newFeatures });
                }}
                className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Add Feature
          </button>
        </div>
            <CommonStyleOptions />
          </>
        )}

        {/* Add more block-specific editors here */}
      </div>
    );
  };

  // Add responsive state
  const [isMobile, setIsMobile] = useState(false);
  const [showPanelControls, setShowPanelControls] = useState(false);

  // Add useEffect for responsive handling
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        // On mobile, default to hiding panels
        setShowLeftPanel(false);
        setShowRightPanel(false);
      } else {
        // On desktop, default to showing panels
        setShowLeftPanel(true);
        setShowRightPanel(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Add panel controls for mobile
  const PanelControls = () => (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-white rounded-lg shadow-lg p-2 ${isMobile ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}>
        <button 
        onClick={() => setShowLeftPanel(!showLeftPanel)}
        className={`p-2 rounded ${showLeftPanel ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
        title="Toggle Block Types"
        >
        <ViewColumnsIcon className="w-5 h-5" />
        </button>
      <button
        onClick={() => setShowRightPanel(!showRightPanel)}
        className={`p-2 rounded ${showRightPanel ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
        title="Toggle Block Settings"
      >
        <ChevronRightIcon className="w-5 h-5" />
      </button>
              </div>
        );

        const handleSaveTemplate = async () => {
          try {
            const savedTemplate = {
              ...template,
              blocks,
            };
            await onSave(savedTemplate);
            alert('Template saved successfully!');
          } catch (error) {
            console.error('Error saving template:', error);
            alert('Failed to save template.');
          }
        };

  const openAutomationModal = () => {
    if (subscription && (subscription.tier === 'pro' || subscription.tier === 'premium')) {
      setShowAutomationModal(true);
    } else {
      alert('This feature is only available for premium users. Please upgrade your subscription.');
    }
  };

  const openSmsModal = () => {
    if (subscription && (subscription.tier === 'premium' || subscription.tier === 'pro')) {
      setShowSmsModal(true);
    } else {
      alert('This feature is only available for premium users. Please upgrade your subscription.');
    }
  };

  const openAnalyticsModal = () => {
    if (subscription && (subscription.tier === 'premium' || subscription.tier === 'pro')) {
      setShowAnalyticsModal(true);
    } else {
      alert('This feature is only available for premium users. Please upgrade your subscription.');
    }
  };

  const openPersonalizationModal = () => {
    if (subscription && (subscription.tier === 'premium' || subscription.tier === 'pro')) {
      setShowPersonalizationModal(true);
    } else {
      alert('This feature is only available for premium users. Please upgrade your subscription.');
    }
  };

  const [runTour, setRunTour] = useState(false);
  const [tourReady, setTourReady] = useState(false);

  useEffect(() => {
    // Wait for elements to be mounted
    const timer = setTimeout(() => {
      setTourReady(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const steps: Step[] = [
    {
      target: '.template-editor-main',
      content: 'Welcome to the Template Editor! Here you can create beautiful, responsive email templates with our drag-and-drop interface.',
      placement: 'center',
      disableBeacon: true
    },
    {
      target: '.blocks-section',
      content: 'Add different types of content blocks to build your email template. Tap the + button to explore available blocks.',
      placement: isMobile ? 'bottom-start' : 'right',
      disableBeacon: true
    },
    {
      target: '.hero-block',
      content: 'Choose from various block types:\n• Hero sections\n• Text content\n• Images\n• Products\n• Collections\n• Testimonials\n• And more!',
      placement: isMobile ? 'bottom-start' : 'right',
      disableBeacon: true
    },
    {
      target: '.preview-section',
      content: 'Your template preview updates in real-time as you make changes.',
      placement: isMobile ? 'top' : 'left',
      disableBeacon: true
    },
    {
      target: '.device-preview-controls',
      content: 'Test your template on different devices to ensure it looks great everywhere.',
      placement: isMobile ? 'bottom' : 'bottom',
      disableBeacon: true
    },
    {
      target: '.block-settings',
      content: 'Customize your blocks:\n• Colors\n• Typography\n• Spacing\n• Borders\n• Layout\n• Responsiveness',
      placement: isMobile ? 'bottom-end' : 'left',
      disableBeacon: true
    },
    {
      target: '.template-editor-main',
      content: 'Additional Features Available:\n\n• Personalization: Add dynamic content like customer names and order details\n• Automation: Set up rules to trigger emails based on behavior\n• SMS Integration: Configure text message notifications\n• Analytics: Track performance metrics\n• Audience Targeting: Define and segment your email list\n\nAccess these features through the toolbar above.',
      placement: 'center',
      disableBeacon: true
    }
  ];

  // Audience Modal Component
  const AudienceModal = () => (
    <Modal
      isOpen={showAudienceModal}
      onClose={() => setShowAudienceModal(false)}
      title="Template Audience"
      className="w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl mx-auto"
    >
      <div className="space-y-6 max-h-[80vh] overflow-y-auto px-3 sm:px-6 py-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-yellow-800">About Template Audience</h3>
          <p className="mt-2 text-sm text-yellow-700">
            Audience selection happens during campaign creation. This template can be used with any audience segment.
            When you create a campaign using this template, you'll be able to:
          </p>
          <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
            <li>Select specific audience segments</li>
            <li>Filter by engagement levels</li>
            <li>Target based on customer behavior</li>
            <li>Set up A/B testing groups</li>
          </ul>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900">Recommended For</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Industry</h5>
              <p className="text-sm text-gray-500 mt-1">{template.category || 'All Industries'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Customer Type</h5>
              <p className="text-sm text-gray-500 mt-1">{template.audienceType || 'All Customers'}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={async () => {
              try {
                await handleSaveTemplate();
                setShowAudienceModal(false);
              } catch (error) {
                console.error('Error saving template:', error);
              }
            }}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Create Campaign with this Template
          </button>
        </div>
      </div>
    </Modal>
  );

  // Update the main layout with responsive classes
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add FeatureRestrictModal to the component */}
      <FeatureRestrictModal />
      
      {/* Header with Back Button */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.back()}
                className="mr-4 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-900">
                {template.id ? 'Edit Template' : 'Create New Template'}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Rest of the template editor content */}
      <div className="template-editor-main">
        {tourReady && (
          <Joyride
            steps={steps}
            run={runTour}
            continuous
            showProgress
            showSkipButton
            hideCloseButton
            disableOverlayClose
            disableScrolling={false}
            styles={{
              options: {
                zIndex: 10000,
                primaryColor: '#4F46E5',
                overlayColor: 'rgba(0, 0, 0, 0.5)',
              },
              tooltip: {
                width: isMobile ? '90vw' : '350px',
                padding: '1.5rem',
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
              },
              tooltipContent: {
                padding: '0.5rem 0',
                fontSize: '0.875rem',
                lineHeight: '1.5'
              },
              buttonNext: {
                backgroundColor: '#4F46E5',
                fontSize: '14px',
                padding: '8px 16px',
                borderRadius: '0.375rem'
              },
              buttonBack: {
                color: '#4F46E5',
                fontSize: '14px',
                marginRight: '8px'
              },
              buttonSkip: {
                color: '#6B7280',
                fontSize: '14px'
              }
            }}
            floaterProps={{
              disableAnimation: true,
              hideArrow: isMobile,
              styles: {
                floater: {
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))'
                }
              }
            }}
            callback={({ status, type }) => {
              if (['finished', 'skipped'].includes(status) || type === 'tour:end') {
                setRunTour(false);
                // Remove any inline styles that might affect scrolling
                document.body.style.removeProperty('overflow');
                document.body.style.removeProperty('position');
                document.body.style.removeProperty('top');
                document.body.style.removeProperty('width');
                document.body.style.removeProperty('height');
                document.body.style.removeProperty('margin');
                
                // Ensure the toolbar container is visible and scrollable
                const toolbarContainer = document.querySelector('.toolbar-container');
                if (toolbarContainer) {
                  toolbarContainer.removeAttribute('style');
                }
                
                // Force a small delay to ensure all styles are properly reset
                setTimeout(() => {
                  window.dispatchEvent(new Event('resize'));
                }, 100);
              }
            }}
          />
        )}

    <div className="flex h-screen bg-gray-50">
      {/* Left Panel - Block Types */}
      <div 
        className={`${
          showLeftPanel ? 'w-64' : 'w-0'
        } bg-white border-r border-gray-200 overflow-hidden transition-all duration-300 ${
          isMobile ? 'fixed left-0 top-0 h-full z-50' : 'relative'
            } blocks-section`}
      >
        {showLeftPanel && (
          <div className="p-4 h-full overflow-y-auto">
            {isMobile && (
            <button
              onClick={() => setShowLeftPanel(false)}
                    className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
              {blockTypes.map((type) => (
              <button
                key={type}
                  onClick={() => {
                    addBlock(type as BlockType);
                    if (isMobile) setShowLeftPanel(false);
                  }}
                      className={`p-3 text-sm bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 ${type === 'hero' ? 'hero-block' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
            <div className="bg-white border-b">
              <div className="flex items-center justify-between p-4">
                <div className="toolbar-container flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-200">
                  <div className="flex items-center space-x-4 min-w-max pb-2">
              {toolbarButtons.map((button, index) => (
              <button
                  key={index}
                  onClick={button.onClick}
                        className={`flex-shrink-0 flex items-center p-2 rounded whitespace-nowrap ${
                    button.active ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'
                        } ${button.label.toLowerCase()}-button device-preview-controls`}
                >
                        {button.icon}
                        <span className="ml-2">{button.label}</span>
              </button>
              ))}
          </div>
                </div>
                <div className="flex-shrink-0 flex items-center space-x-2 ml-4 pl-4 border-l">
            <button
                onClick={handleSaveTemplate}
                    className="save-template-button px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Save Template
            </button>
                  <button
                    onClick={handleSaveTemplate}
                    className="save-button px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                  >
                    Save
            </button>
            </div>
          </div>
        </div>

        {/* Preview Area */}
        <div 
              className="flex-1 bg-gray-100 overflow-auto p-4 md:p-8 preview-section"
          onMouseEnter={() => setShowPanelControls(true)}
          onMouseLeave={() => setShowPanelControls(false)}
        >
          <div className={`mx-auto bg-white shadow-lg rounded-lg ${getPreviewScale()}`}>
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="blocks">
              {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    {blocks.map((block, index) => (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                                className={`relative ${selectedBlockIndex === block.id ? 'ring-2 ring-indigo-500' : ''} drag-handle`}
                          onClick={() => setSelectedBlockIndex(block.id)}
                        >
                            <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteBlock(block.id);
                              }}
                                className="p-1 bg-white rounded-full shadow hover:bg-red-50 text-red-600"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                          {renderBlock(block)}
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
      </div>

      {/* Right Panel - Block Settings */}
      <div 
        className={`${
          showRightPanel ? 'w-80' : 'w-0'
        } bg-white border-l border-gray-200 overflow-hidden transition-all duration-300 ${
          isMobile ? 'fixed right-0 top-0 h-full z-50' : 'relative'
            } block-settings`}
          >
            {showRightPanel && (
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-medium text-gray-900">Block Settings</h3>
            <button
              onClick={() => setShowRightPanel(false)}
                    className="p-2 rounded-full hover:bg-gray-100"
            >
                <XMarkIcon className="w-5 h-5" />
            </button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedBlockIndex ? (
                    renderBlockEditor(blocks.find(b => b.id === selectedBlockIndex))
                  ) : (
                    <div className="text-center text-gray-500 mt-4">
                      Select a block to customize
                    </div>
                  )}
                </div>
        </div>
        )}
        </div>

      {/* Mobile Panel Controls */}
      {isMobile && <PanelControls />}

      {/* Modals */}
      <PersonalizationModal />
      <AutomationModal />
      <SmsModal />
      <AnalyticsModal />
          <AudienceModal />
        </div>
      </div>
    </div>
  );
};

const isBlockTypeAvailable = (type: BlockType): boolean => {
  // Define the logic to check if the block type is available
  return blockTypes.includes(type);
};

const tierFeatures = {
  free: { maxBlocks: 5 },
  starter: { maxBlocks: 10 },
  growth: { maxBlocks: 20 },
  pro: { maxBlocks: 50 },
};

export default TemplateEditor;