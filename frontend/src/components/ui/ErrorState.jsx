import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

const ErrorState = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-error" />
      </div>
      <h3 className="text-base font-semibold text-text-dark mb-1">Something went wrong</h3>
      <p className="text-sm text-text-secondary max-w-xs mb-4">{message}</p>
      {onRetry && (
        <Button
          variant="secondary"
          onClick={onRetry}
          leftIcon={<RefreshCw className="w-4 h-4" />}
          size="sm"
        >
          Try Again
        </Button>
      )}
    </div>
  );
};

export default ErrorState;
