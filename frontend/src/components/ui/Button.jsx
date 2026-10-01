import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-primary text-white hover:bg-primary-hover focus:ring-primary disabled:bg-primary/50',
  secondary:
    'bg-white text-primary border border-border hover:bg-primary-light focus:ring-primary disabled:opacity-50',
  danger:
    'bg-error text-white hover:bg-red-700 focus:ring-error disabled:bg-error/50',
  ghost:
    'text-text-secondary hover:bg-gray-100 hover:text-text-dark focus:ring-gray-300 disabled:opacity-50',
  success:
    'bg-success text-white hover:bg-green-700 focus:ring-success disabled:bg-success/50',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

const Button = React.forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon,
      rightIcon,
      className = '',
      type = 'button',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer select-none';

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : leftIcon ? (
          <span className="flex-shrink-0">{leftIcon}</span>
        ) : null}
        {children}
        {!isLoading && rightIcon && (
          <span className="flex-shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
