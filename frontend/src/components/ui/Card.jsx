import React from 'react';

const Card = ({
  children,
  className = '',
  padding = true,
  hover = false,
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white border border-border rounded-xl shadow-sm
        ${padding ? 'p-6' : ''}
        ${hover ? 'hover:shadow-md hover:border-primary/30 transition-all duration-200 cursor-pointer' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`flex items-center justify-between mb-4 ${className}`}>
    {children}
  </div>
);

Card.Title = ({ children, className = '' }) => (
  <h3 className={`text-base font-semibold text-text-dark ${className}`}>
    {children}
  </h3>
);

Card.Body = ({ children, className = '' }) => (
  <div className={className}>{children}</div>
);

export default Card;
