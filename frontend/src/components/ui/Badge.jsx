import React from 'react';

const variantClasses = {
  success: 'bg-green-100 text-success border border-green-200',
  warning: 'bg-amber-100 text-amber-700 border border-amber-200',
  error: 'bg-red-100 text-error border border-red-200',
  info: 'bg-blue-100 text-blue-700 border border-blue-200',
  default: 'bg-gray-100 text-text-secondary border border-gray-200',
  primary: 'bg-primary-light text-primary border border-blue-200',
};

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

const Badge = ({ children, variant = 'default', size = 'md', className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${variantClasses[variant] || variantClasses.default} ${sizes[size] || sizes.md} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
