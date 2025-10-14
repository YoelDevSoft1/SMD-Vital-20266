import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

interface SelectContentProps {
  children: React.ReactNode;
}

interface SelectItemProps extends React.OptionHTMLAttributes<HTMLOptionElement> {
  children: React.ReactNode;
  value: string;
}

interface SelectValueProps {
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
  return (
    <select
      className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
};

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {children}
    </div>
  );
};

export const SelectContent: React.FC<SelectContentProps> = ({ children }) => {
  return <>{children}</>;
};

export const SelectItem: React.FC<SelectItemProps> = ({ children, ...props }) => {
  return <option {...props}>{children}</option>;
};

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <option value="">{placeholder}</option>;
};
