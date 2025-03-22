import React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'success' | 'warning';
  children: React.ReactNode;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'default',
  children,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-blue-50 text-blue-800 border-blue-200',
    destructive: 'bg-red-50 text-red-800 border-red-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-md border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

export const AlertTitle: React.FC<AlertTitleProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h5
      className={`font-medium mb-1 ${className}`}
      {...props}
    >
      {children}
    </h5>
  );
};

interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

export const AlertDescription: React.FC<AlertDescriptionProps> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`text-sm ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}; 