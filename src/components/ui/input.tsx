import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  // Any additional custom props can go here
}

export const Input: React.FC<InputProps> = ({ 
  className = '', 
  ...props 
}) => {
  return (
    <input
      className={`block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm ${className}`}
      {...props}
    />
  );
};

export default Input; 