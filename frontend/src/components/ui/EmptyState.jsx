import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no records to display.',
  action,
  actionLabel,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-text-secondary" />
      </div>
      <h3 className="text-base font-semibold text-text-dark mb-1">{title}</h3>
      <p className="text-sm text-text-secondary max-w-xs">{description}</p>
      {React.isValidElement(action) ? (
        <div className="mt-4">{action}</div>
      ) : action ? (
        <Button onClick={action} className="mt-4" size="sm">
          {actionLabel || 'Add New'}
        </Button>
      ) : null}
    </div>
  );
};

export default EmptyState;
