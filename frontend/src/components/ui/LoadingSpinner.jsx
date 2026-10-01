import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingSpinner = ({
  size = 'md',
  overlay = false,
  label = 'Loading...',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`} role="status" aria-label={label}>
      <Loader2 className={`animate-spin text-primary ${sizes[size] || sizes.md}`} />
      {size !== 'sm' && (
        <span className="text-sm text-text-secondary">{label}</span>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-40 bg-white/70 backdrop-blur-sm flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
