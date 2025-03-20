import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Draggable, Droppable, DragDropContext, DropResult } from 'react-beautiful-dnd';
import { EllipsisVerticalIcon, ChevronLeftIcon, ChevronDownIcon, TrashIcon, CogIcon, PlusIcon } from '@heroicons/react/24/outline';
import { BlockTypeButtons } from './BlockTypeButtons';
import { BlockEditor } from './BlockEditor';
import { useApolloClient } from '@apollo/client';
import { apolloService } from '@/services/apollo';
import { BlockSettings } from './BlockSettings';
import { TemplateSettings } from './TemplateSettings';
import { nanoid } from 'nanoid';
import { saveTemplate, publishTemplate, getTemplate } from '@/services/template';
import { DynamicIcon } from '@/components/ui/DynamicIcon';
import { formatDistanceToNow } from 'date-fns';
import { EditableText } from '@/components/ui/EditableText';
import { BlockType, BlockContent, Block, Template } from '@/types/extended-template';
import TEMPLATES from '@/data/templates';
import { 
  XMarkIcon,
  Bars3Icon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CubeTransparentIcon
} from '@heroicons/react/24/outline';
import { ABTestingModal } from './ABTestingModal';
import { useSubscription } from '@/hooks/useSubscription';
import { useFeatureAccess } from '@/utils/featureAccess';
import { PublishButton } from './PublishButton';
import { AnalyticsModal } from './AnalyticsModal';
import { aiOptimizationService } from '@/services/ai-optimization';
import { toast } from 'react-hot-toast';
import { Dialog, Transition } from '@headlessui/react';
import { useToast } from '@/hooks/useToast';
import { getPublicImageURL } from '@/services/storage';
import { Fragment } from 'react';
import { CreditService } from '@/services/creditService';

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

// Define the blockTypes array
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
  'advanced-block',
  // Add dropshipping-specific blocks
  'button',
  'social',
  'product-card',
  'shipping-info',
  'inventory-status',
  'price-comparison'
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

const DEFAULT_IMAGE_URL = 'https://source.unsplash.com/random/800x600';

const TemplateEditor: React.FC<TemplateEditorProps> = ({
  template = { blocks: [], name: '', category: '', description: '', status: 'draft' },
  onSave,
  onPreview,
  readOnly = false
}) => {
  const router = useRouter();
  const { subscription, checkFeatureAccess } = useSubscription();
  
  // Use safe property access with defaults
  const maxBlocks = subscription?.limits || 10; // Default fallback
  const maxPersonalizationFields = subscription?.maxPersonalizationFields || 3;

  // Add new state for feature restriction modal
  const [showFeatureRestrictModal, setShowFeatureRestrictModal] = useState(false);
  const [restrictedFeature, setRestrictedFeature] = useState<{
    type: string;
    requiredTier: string;
    description: string;
  } | null>(null);

  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);
  const [deletedBlocks, setDeletedBlocks] = useState<Block[]>([]);

  // Add delete confirmation functions
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
    const requiredTier = getMinimumTierForBlock(type);
    // Use consistent feature check method
    const hasAccess = checkFeatureAccess(requiredTier);
    
    if (!hasAccess) {
      setRestrictedFeature({
        type,
        requiredTier,
        description: `This block type requires a ${requiredTier} plan or higher.`
      });
      setShowFeatureRestrictModal(true);
      return false;
    }

    return true;
  };

  // Ensure template is not undefined and has a blocks array
  const defaultTemplate = template || { blocks: [] };
  const [blocks, setBlocks] = useState(defaultTemplate.blocks || []);
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
    consent: true
  });

  // Add state for estimated audience size and SMS credits
  const [audienceEstimate, setAudienceEstimate] = useState(500); // Default estimated audience size
  const [smsCredits, setSmsCredits] = useState({ 
    available: 0, 
    sufficient: false, 
    loading: true 
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
    const { subscription, checkFeatureAccess } = useSubscription();
    // Use safe property access
    const maxFields = subscription?.maxPersonalizationFields || 3;

    // Logic to limit the number of personalization fields
    const [personalizationFields, setPersonalizationFields] = useState<string[]>([]);
    
    // Check if user can add more personalization fields
    const canAddMoreFields = personalizationFields.length < maxFields;

    const addPersonalizationField = () => {
      if (!canAddMoreFields) {
        toast.error(`You can only add up to ${maxFields} personalization fields with your current plan.`);
        return;
      }
      
      const fieldName = prompt('Enter the personalization field name:');
      if (fieldName && !personalizationFields.includes(fieldName)) {
        setPersonalizationFields([...personalizationFields, fieldName]);
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
  const SMSModal = () => {
    const [smsText, setSmsText] = useState(smsSettings.message || '');
    const [charactersLeft, setCharactersLeft] = useState(160 - (smsSettings.message?.length || 0));
    const charLimit = 160;
    
    // Calculate estimated cost (assuming 1 credit per message)
    const estimatedCredits = audienceEstimate;
    const sufficientCredits = smsCredits.available >= estimatedCredits;
    
    const handleSmsTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = e.target.value;
      setSmsText(text);
      setCharactersLeft(charLimit - text.length);
    };
    
    const handleSaveClick = () => {
                      setSmsSettings({
                        ...smsSettings,
        enabled: true,
        message: smsText
      });
      setShowSmsModal(false);
    };
    
    useEffect(() => {
      // Fetch SMS credits when modal opens
      const fetchSmsCredits = async () => {
        if (!user) return;
        
        try {
          setSmsCredits(prev => ({ ...prev, loading: true }));
          
          // Get available credits
          const availableCredits = await CreditService.getAvailableCredits(user.uid);
          
          // Check if user has enough credits based on audience estimate
          const creditCheck = await CreditService.checkSufficientCredits(
            user.uid,
            0, // No email credits needed for SMS check
            audienceEstimate,
            0 // No leads needed
          );
          
          setSmsCredits({
            available: availableCredits.sms,
            sufficient: creditCheck.sufficient.sms,
            loading: false
          });
        } catch (error) {
          console.error('Error checking SMS credits:', error);
          setSmsCredits(prev => ({ ...prev, loading: false }));
        }
      };
      
      fetchSmsCredits();
    }, [user, audienceEstimate]);
    
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowSmsModal(false)}></div>
        <div className="relative bg-white w-11/12 md:w-2/3 lg:w-1/2 xl:w-1/3 rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add SMS Message</h3>
          
          <textarea
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your SMS message..."
            rows={4}
            value={smsText}
            onChange={handleSmsTextChange}
            maxLength={charLimit}
          ></textarea>
          
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{charactersLeft} characters left</span>
            <span>1 message per recipient</span>
            </div>
              
          {/* Credits information */}
          <div className={`mt-4 p-3 rounded-lg ${sufficientCredits ? 'bg-green-50' : 'bg-red-50'}`}>
            <h4 className="text-sm font-medium mb-1">SMS Credits</h4>
            
            {smsCredits.loading ? (
              <p className="text-sm flex items-center">
                <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                Loading credit information...
              </p>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <p className="text-sm">
                    {sufficientCredits
                      ? `You have ${smsCredits.available.toLocaleString()} credits available`
                      : `You need ${estimatedCredits.toLocaleString()} credits, but only have ${smsCredits.available.toLocaleString()}`}
                  </p>
                  
                  {!sufficientCredits && (
                    <a
                      href="/dashboard/billing"
                      className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Get More Credits
                    </a>
                  )}
              </div>
                
                <p className="text-xs mt-2">
                  {`Estimated audience: ${audienceEstimate.toLocaleString()} recipients`}
                </p>
              </>
            )}
            </div>
            
          <div className="mt-6 flex justify-end space-x-3">
                <button 
              className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={() => setShowSmsModal(false)}
            >
              Cancel
                </button>
                <button 
              className={`px-4 py-2 text-sm rounded-md text-white 
                ${sufficientCredits && smsText.trim().length > 0
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-gray-400 cursor-not-allowed'}`}
              onClick={handleSaveClick}
              disabled={!sufficientCredits || smsText.trim().length === 0}
            >
              Save
                </button>
              </div>
            </div>
              </div>
    );
  };

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

  // Add the getInitialBlockContent method to handle the new block types
  const getInitialBlockContent = (type: BlockType): BlockContent => {
    switch (type) {
      // Existing cases...
      
      // Add product card case
      case 'product-card':
        return {
          title: 'Product Name',
          description: 'Product description goes here.',
          image: DEFAULT_IMAGE_URL,
          price: '29.99',
          compareAtPrice: '39.99',
          inventory: 25,
          shippingDays: '7-10',
          buttonText: 'Add to Cart',
          buttonUrl: '#'
        };
      
      // Add shipping info case
      case 'shipping-info':
        return {
          title: 'Shipping Information',
          methods: [
            {
              name: 'Standard Shipping',
              deliveryTime: '7-14 days',
              price: '0.00'
            },
            {
              name: 'Express Shipping',
              deliveryTime: '3-5 days',
              price: '9.99'
            }
          ]
        };
      
      // Add inventory status case
      case 'inventory-status':
        return {
          title: 'Limited Stock',
          itemsLeft: 5,
          showCounter: true,
          urgencyText: 'Order soon before we sell out!'
        };
      
      // Add price comparison case
      case 'price-comparison':
        return {
          retailPrice: '99.99',
          yourPrice: '49.99',
          savingsText: 'You save 50%',
          currency: '$',
          showSavingsPercentage: true
        };
        
      // Default case
      default:
        return {
          text: 'Add your content here',
          fontSize: '16px',
          color: '#000000',
          alignment: 'left'
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
          <div className="relative overflow-hidden group transition-all duration-300">
            {extendedContent.imageUrl && (
              <div className="absolute inset-0">
                <img
                  src={extendedContent.imageUrl}
                  alt={extendedContent.alt || 'Hero background'}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60"></div>
              </div>
            )}
            <div className="relative px-4 sm:px-8 py-12 sm:py-16 md:py-20 text-center max-w-4xl mx-auto">
              {extendedContent.title && (
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">{extendedContent.title}</h1>
              )}
              {extendedContent.subtitle && (
                <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8">{extendedContent.subtitle}</p>
              )}
              {extendedContent.button && (
                <button className={`px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-medium transform transition-all duration-300 hover:scale-105 ${
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
          <div className="p-4 sm:p-8">
            {extendedContent.title && (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {extendedContent.products?.map((product, index) => (
                <div key={index} className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="aspect-w-4 aspect-h-3 rounded-t-lg overflow-hidden bg-gray-100">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="object-cover object-center transform transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{product.title}</h3>
                    <p className="text-lg font-medium text-gray-900 mb-3">{product.price}</p>
                    {product.button && (
                      <button className="w-full text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 py-2 rounded-md transition-colors duration-300">
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
          <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 text-white p-4 sm:p-8 rounded-lg">
            <div className="max-w-3xl mx-auto text-center">
            {extendedContent.title && (
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{extendedContent.title}</h2>
            )}
            {extendedContent.description && (
                <p className="text-lg sm:text-xl mb-4 sm:mb-6 text-white/90">{extendedContent.description}</p>
            )}
            {extendedContent.code && (
                <div className="inline-block bg-white text-indigo-700 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-mono text-lg sm:text-xl font-bold transform transition-transform duration-300 hover:scale-105">
                {extendedContent.code}
              </div>
            )}
            </div>
          </div>
        );

      case 'testimonial':
        return (
          <div className="p-4 sm:p-8 bg-gray-50 rounded-lg">
            <div className="max-w-2xl mx-auto text-center">
            {extendedContent.quote && (
                <blockquote className="text-lg sm:text-xl text-gray-900 italic mb-4 sm:mb-6">
                "{extendedContent.quote}"
              </blockquote>
            )}
            <div className="flex items-center justify-center">
              {extendedContent.avatar && (
                <img
                  src={extendedContent.avatar}
                  alt={extendedContent.author || 'Testimonial author'}
                    className="h-12 w-12 rounded-full mr-4 border-2 border-white shadow-sm"
                />
              )}
              <div>
                {extendedContent.author && (
                  <div className="font-medium text-gray-900">{extendedContent.author}</div>
                )}
                {extendedContent.role && (
                    <div className="text-gray-500 text-sm">{extendedContent.role}</div>
                )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className={`p-4 sm:p-8 ${extendedContent.backgroundColor ? `bg-${extendedContent.backgroundColor}` : ''}`}>
            <div className={`prose max-w-none ${extendedContent.align ? `text-${extendedContent.align}` : ''}`}>
              {extendedContent.text && (
                <div 
                  className="text-base sm:text-lg"
                  style={{
                    color: extendedContent.textColor || 'inherit',
                    fontSize: extendedContent.fontSize || 'inherit'
                  }}
                  dangerouslySetInnerHTML={{ __html: extendedContent.text }} 
                />
              )}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="p-4 sm:p-8">
            {extendedContent.imageUrl && (
              <img
                src={extendedContent.imageUrl}
                alt={extendedContent.alt || 'Image'}
                className="w-full rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300"
                style={{
                  maxWidth: extendedContent.width || '100%',
                  margin: extendedContent.align === 'center' ? '0 auto' : undefined,
                  borderRadius: extendedContent.borderRadius || undefined
                }}
              />
            )}
          </div>
        );

      case 'product':
        return (
          <div className="p-4 sm:p-8">
            <div className="flex flex-col md:flex-row gap-6 sm:gap-8 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300">
              {extendedContent.imageUrl && (
                <div className="flex-1">
                  <img
                    src={extendedContent.imageUrl}
                    alt={extendedContent.title || 'Product'}
                    className="w-full rounded-lg object-cover aspect-square md:aspect-auto"
                  />
                </div>
              )}
              <div className="flex-1 p-4 sm:p-6">
                {extendedContent.title && (
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">{extendedContent.title}</h2>
                )}
                {extendedContent.description && (
                  <p className="text-gray-600 mb-4">{extendedContent.description}</p>
                )}
                {extendedContent.price && (
                  <div className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">{extendedContent.price}</div>
                )}
                {extendedContent.button && (
                  <button className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors duration-300">
                    {extendedContent.button.text}
                  </button>
                )}
              </div>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="p-4 sm:p-8">
            {extendedContent.title && (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 text-center">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {extendedContent.features?.map((feature, index) => (
                <div key={index} className="text-center p-4 sm:p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 text-sm sm:text-base">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        );

      case 'newsletter-signup':
        return (
          <div className="p-4 sm:p-8 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg">
            <div className="max-w-2xl mx-auto text-center">
            {extendedContent.title && (
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">{extendedContent.title}</h2>
              )}
              {extendedContent.description && (
                <p className="text-lg mb-4 sm:mb-6 opacity-90">{extendedContent.description}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder={extendedContent.placeholder || "Enter your email"}
                  className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button className="px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors duration-300 whitespace-nowrap">
                  {extendedContent.button?.text || "Subscribe"}
                </button>
                    </div>
            </div>
          </div>
        );

      case 'countdown':
        return (
          <div className="p-4 sm:p-8 text-center rounded-lg" style={{ backgroundColor: extendedContent.backgroundColor || '#ffffff' }}>
            <div className="max-w-2xl mx-auto">
            {extendedContent.title && (
                <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6" style={{ color: extendedContent.textColor || '#000000' }}>
                {extendedContent.title}
              </h2>
            )}
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {['days', 'hours', 'minutes', 'seconds'].map((unit) => (
                  <div key={unit} className="bg-gray-800 text-white p-3 sm:p-4 rounded-lg min-w-[80px]">
                    <div className="text-2xl sm:text-3xl font-bold">{extendedContent[unit] || '00'}</div>
                    <div className="text-xs sm:text-sm uppercase">{unit}</div>
                </div>
              ))}
            </div>
            {extendedContent.button && (
                <button className={`mt-6 sm:mt-8 px-6 py-3 rounded-lg font-medium transform transition-all duration-300 hover:scale-105 ${
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

      case 'social-share':
        return (
          <div className="p-4 sm:p-8 text-center">
            {extendedContent.title && (
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">{extendedContent.title}</h2>
            )}
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              {['facebook', 'twitter', 'linkedin', 'instagram'].map((platform) => (
                <a
                  key={platform}
                  href={extendedContent[`${platform}Url`] || '#'}
                  className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors duration-300"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={`/icons/${platform}.svg`}
                    alt={`Share on ${platform}`}
                    className="w-5 h-5 sm:w-6 sm:h-6"
                  />
                </a>
              ))}
            </div>
          </div>
        );

      case 'menu':
        return (
          <div className="p-4 sm:p-8">
            {extendedContent.title && (
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">{extendedContent.title}</h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {extendedContent.items?.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{item.name}</h3>
                    <p className="text-gray-500 text-sm">{item.description}</p>
                  </div>
                  <div className="text-lg font-bold text-indigo-600">{item.price}</div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="p-4 border border-dashed border-gray-300 text-gray-500 text-center rounded-lg">
            {type} block - Click to edit
          </div>
        );
    }
  };

  const renderBlockEditor = (block: Template['blocks'][number] | undefined) => {
    if (!block) return null;
    const { type, content } = block;
    
    // Simplified direct update function
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>, field: string) => {
      const value = e.target.value;
      setBlocks(prev => prev.map(b => 
        b.id === block.id 
          ? { 
              ...b, 
              content: { 
                ...b.content, 
                [field]: value 
              } 
            }
          : b
      ));
    };

    // Button content update function
    const handleButtonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>, field: string) => {
      const value = e.target.value;
      setBlocks(prev => prev.map(b => 
        b.id === block.id 
          ? { 
              ...b, 
              content: { 
                ...b.content, 
                button: {
                  ...b.content.button,
                  [field]: value
                }
              } 
            }
          : b
      ));
    };

    // Enhanced input component
    const Input = ({ 
      label, 
      value, 
      onChange, 
      field, 
      type = 'text',
      multiline = false,
      placeholder = '',
      className = ''
    }) => (
      <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
        {multiline ? (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e, field)}
            className={`w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${className}`}
            placeholder={placeholder}
          />
        ) : (
          <input
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e, field)}
            className={`w-full px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${className}`}
            placeholder={placeholder}
          />
        )}
      </div>
    );

    // Enhanced select component
    const Select = ({ label, value, onChange, field, options }) => (
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">
          {label}
          </label>
              <select
          value={value || ''}
          onChange={(e) => onChange(e, field)}
          className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
              </select>
            </div>
    );

    // Block settings section component
    const BlockSettings = ({ title, children }) => (
      <div className="space-y-4 border-t border-gray-200 pt-4 mt-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <div className="space-y-4">
          {children}
            </div>
            </div>
    );
    
    return (
      <div className="space-y-6 p-4">
        {/* Block Type Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            {type.charAt(0).toUpperCase() + type.slice(1)} Block
          </h2>
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-700">
            {type}
          </span>
              </div>

        {/* Block-specific settings */}
        {type === 'hero' && (
          <>
            <BlockSettings title="Content">
              <Input
                label="Title"
                value={content.title}
                onChange={handleChange}
                field="title"
                placeholder="Enter hero title"
              />
              <Input
              label="Subtitle"
                value={content.subtitle}
                onChange={handleChange}
              field="subtitle"
                placeholder="Enter subtitle"
                multiline
              />
              <Input
                label="Image URL"
                value={content.imageUrl}
                onChange={handleChange}
                field="imageUrl"
                placeholder="https://..."
              />
            </BlockSettings>

            <BlockSettings title="Button">
              <Input
                label="Button Text"
                value={content.button?.text}
                onChange={handleButtonChange}
              field="text"
                placeholder="Click Here"
              />
              <Select
                label="Button Style"
                value={content.button?.style}
                onChange={handleButtonChange}
                field="style"
                options={[
                  { value: 'primary', label: 'Primary' },
                  { value: 'secondary', label: 'Secondary' },
                  { value: 'outline', label: 'Outline' },
                  { value: 'link', label: 'Link' }
                ]}
              />
              <Input
                label="Button URL"
                value={content.button?.url}
                onChange={handleButtonChange}
                field="url"
                placeholder="https://..."
              />
            </BlockSettings>

            <BlockSettings title="Style">
              <Input
                label="Background Color"
                value={content.backgroundColor}
                onChange={handleChange}
                field="backgroundColor"
                type="color"
                className="h-10"
              />
              <Input
                label="Text Color"
                value={content.textColor}
                onChange={handleChange}
                field="textColor"
                type="color"
                className="h-10"
              />
            </BlockSettings>
          </>
        )}

        {/* Add settings for other block types following the same pattern */}
        {/* Featured Collection Settings */}
        {type === 'featured-collection' && (
          <>
            <BlockSettings title="Content">
              <Input
                label="Section Title"
                value={content.title}
                onChange={handleChange}
                field="title"
                placeholder="Featured Products"
              />
              {/* Product settings would go here */}
            </BlockSettings>
            <BlockSettings title="Layout">
              <Select
                label="Products Per Row"
                value={content.columns?.toString()}
                onChange={handleChange}
                field="columns"
                options={[
                  { value: '2', label: '2 Columns' },
                  { value: '3', label: '3 Columns' },
                  { value: '4', label: '4 Columns' }
                ]}
              />
            </BlockSettings>
          </>
        )}

        {/* Promotion Settings */}
        {type === 'promotion' && (
          <>
            <BlockSettings title="Content">
              <Input
                label="Title"
                value={content.title}
                onChange={handleChange}
                field="title"
                placeholder="Special Offer"
              />
              <Input
                label="Description"
                value={content.description}
                onChange={handleChange}
                field="description"
                multiline
                placeholder="Describe your promotion"
              />
              <Input
                label="Promo Code"
                value={content.code}
                onChange={handleChange}
                field="code"
                placeholder="SAVE20"
              />
            </BlockSettings>
            <BlockSettings title="Style">
              <Input
                label="Background Color"
                value={content.backgroundColor}
                onChange={handleChange}
                field="backgroundColor"
                type="color"
              />
              <Input
                label="Text Color"
                value={content.textColor}
                onChange={handleChange}
                field="textColor"
                type="color"
              />
            </BlockSettings>
          </>
        )}

        {/* Newsletter Settings */}
        {type === 'newsletter-signup' && (
          <>
            <BlockSettings title="Content">
              <Input
                label="Title"
                value={content.title}
                onChange={handleChange}
                field="title"
                placeholder="Join Our Newsletter"
              />
              <Input
                label="Description"
                value={content.description}
                onChange={handleChange}
                field="description"
                multiline
                placeholder="Enter description"
              />
              <Input
                label="Input Placeholder"
                value={content.placeholder}
                onChange={handleChange}
                field="placeholder"
                placeholder="Enter your email..."
              />
              <Input
                label="Button Text"
                value={content.button?.text}
                onChange={handleButtonChange}
                field="text"
                placeholder="Subscribe"
              />
            </BlockSettings>
            <BlockSettings title="Style">
              <Select
                label="Layout"
                value={content.layout}
                onChange={handleChange}
                field="layout"
                options={[
                  { value: 'centered', label: 'Centered' },
                  { value: 'image-left', label: 'Image Left' },
                  { value: 'image-right', label: 'Image Right' }
                ]}
              />
            </BlockSettings>
          </>
        )}

        {/* Menu Settings */}
        {type === 'menu' && (
          <>
            <BlockSettings title="Content">
              <Input
                label="Menu Title"
                value={content.title}
                onChange={handleChange}
                field="title"
                placeholder="Our Menu"
              />
              {/* Menu items would be managed here */}
            </BlockSettings>
            <BlockSettings title="Layout">
              <Select
                label="Layout Style"
                value={content.layout}
                onChange={handleChange}
                field="layout"
                options={[
                  { value: 'grid', label: 'Grid' },
                  { value: 'list', label: 'List' },
                  { value: 'carousel', label: 'Carousel' }
                ]}
              />
            </BlockSettings>
          </>
        )}

        {/* Common settings for all blocks */}
        <BlockSettings title="Spacing">
          <Input
            label="Padding"
            value={content.padding}
            onChange={handleChange}
            field="padding"
            placeholder="16px"
          />
          <Input
            label="Margin"
            value={content.margin}
            onChange={handleChange}
            field="margin"
            placeholder="16px"
          />
        </BlockSettings>
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
              lastModified: new Date().toISOString()
            };
            
            // Save the template
            await onSave(savedTemplate);
            
            // Also save to the API to ensure it's available in the TemplatePicker
            try {
              await apolloService.saveTemplate(savedTemplate);
            } catch (apiError) {
              console.error('Error saving template to API:', apiError);
              // Continue even if API save fails - the template is already saved via onSave
            }
            
            toast.success('Template saved successfully!');
          } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template. Please try again.');
          }
        };

  const openAutomationModal = () => {
    if (checkFeatureAccess('abTesting')) {
      setShowAutomationModal(true);
    } else {
      toast.error('A/B Testing features are available on Growth and Pro plans.');
    }
  };

  const openSmsModal = () => {
    if (checkFeatureAccess('smsIntegration')) {
      setShowSmsModal(true);
    } else {
      toast.error('SMS features are available on Growth and Pro plans.');
    }
  };

  const openAnalyticsModal = () => {
    if (checkFeatureAccess('analytics')) {
      setShowAnalyticsModal(true);
    } else {
      toast.error('Advanced analytics are available on Growth and Pro plans.');
    }
  };

  const openPersonalizationModal = () => {
    if (checkFeatureAccess('personalization')) {
      setShowPersonalizationModal(true);
    } else {
      toast.error('Personalization features are available on Growth and Pro plans.');
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
              <p className="text-sm text-gray-500 mt-1">{defaultTemplate.category || 'All Industries'}</p>
            </div>
            <div className="border rounded-lg p-4">
              <h5 className="font-medium text-gray-900">Customer Type</h5>
              <p className="text-sm text-gray-500 mt-1">{defaultTemplate.audienceType || 'All Customers'}</p>
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Delete Block
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this block? This action can be undone by clicking the undo button that will appear.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md border border-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
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
                {defaultTemplate.id ? 'Edit Template' : 'Create New Template'}
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
                          className={`relative group ${selectedBlockIndex === block.id ? 'ring-2 ring-indigo-500' : ''} hover:bg-gray-50`}
                          onClick={() => setSelectedBlockIndex(block.id)}
                        >
                          <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const optimizeBlock = async () => {
                                  try {
                                    const { optimizedTemplate } = await aiOptimizationService.optimizeEmailContent(
                                      { ...defaultTemplate, blocks: [block] },
                                      { id: '', name: '', email: '' }
                                    );
                                    
                                    // Add null checks for optimizedTemplate and its blocks property
                                    if (optimizedTemplate && optimizedTemplate.blocks && optimizedTemplate.blocks.length > 0) {
                                      setBlocks(prev => prev.map(b => 
                                        b.id === block.id ? optimizedTemplate.blocks[0] : b
                                      ));
                                      toast.success('Block optimized successfully!');
                                    } else {
                                      toast.error('Optimization returned invalid data');
                                    }
                                  } catch (error) {
                                    console.error('Error optimizing block:', error);
                                    toast.error('Failed to optimize block');
                                  }
                                };
                                optimizeBlock();
                              }}
                              className="p-2 bg-white rounded-lg shadow-sm hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 border border-gray-200 hover:border-indigo-200 transition-colors duration-200"
                              title="AI Optimize"
                            >
                              <SparklesIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setBlockToDelete(block.id);
                                setShowDeleteConfirm(true);
                              }}
                              className="p-2 bg-white rounded-lg shadow-sm hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 hover:border-red-200 transition-colors duration-200"
                              title="Delete block"
                            >
                              <TrashIcon className="w-5 h-5" />
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
      <SMSModal />
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