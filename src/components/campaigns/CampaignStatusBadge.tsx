import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  PaperAirplaneIcon,
  ExclamationCircleIcon,
  PauseCircleIcon,
  PencilIcon,
} from '@heroicons/react/24/outline';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'paused' | 'failed';

interface CampaignStatusBadgeProps {
  status: CampaignStatus;
  className?: string;
  showIcon?: boolean;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const CampaignStatusBadge: React.FC<CampaignStatusBadgeProps> = ({
  status,
  className = '',
  showIcon = true,
  showText = true,
  size = 'md',
}) => {
  // Define status configurations
  const statusConfig = {
    draft: {
      label: 'Draft',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-700',
      icon: <PencilIcon className="h-full w-full" />,
    },
    scheduled: {
      label: 'Scheduled',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-700',
      icon: <ClockIcon className="h-full w-full" />,
    },
    sending: {
      label: 'Sending',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-700',
      icon: <PaperAirplaneIcon className="h-full w-full" />,
    },
    sent: {
      label: 'Sent',
      bgColor: 'bg-green-100',
      textColor: 'text-green-700',
      icon: <CheckCircleIcon className="h-full w-full" />,
    },
    paused: {
      label: 'Paused',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-700',
      icon: <PauseCircleIcon className="h-full w-full" />,
    },
    failed: {
      label: 'Failed',
      bgColor: 'bg-red-100',
      textColor: 'text-red-700',
      icon: <ExclamationCircleIcon className="h-full w-full" />,
    },
  };

  const config = statusConfig[status] || statusConfig.draft;

  // Size classes for the entire badge
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2',
  };

  // Size classes for just the icon
  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${config.bgColor} ${
        config.textColor
      } ${sizeClasses[size]} ${className}`}
    >
      {showIcon && (
        <span className={`${iconSizeClasses[size]} ${showText ? 'mr-1.5' : ''}`}>
          {config.icon}
        </span>
      )}
      {showText && config.label}
    </span>
  );
};

export default CampaignStatusBadge; 