import React, { useState, useRef, useEffect } from 'react';

const Tooltip = ({ children, content, placement = 'top', className = '' }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  if (!content) return <>{children}</>;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      ref={ref}
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div
          role="tooltip"
          className={`absolute z-50 pointer-events-none ${positions[placement] || positions.top}`}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-lg max-w-xs">
            {content}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tooltip;
