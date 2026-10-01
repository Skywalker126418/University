import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

const icons = {
  success: <CheckCircle className="w-5 h-5 text-success" />,
  error: <XCircle className="w-5 h-5 text-error" />,
  warning: <AlertTriangle className="w-5 h-5 text-warning" />,
  info: <Info className="w-5 h-5 text-blue-500" />,
};

const bgClasses = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  warning: 'bg-amber-50 border-amber-200',
  info: 'bg-blue-50 border-blue-200',
};

const Toast = ({ id, type = 'info', title, message, onRemove }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg bg-white min-w-[300px] max-w-sm ${bgClasses[type] || bgClasses.info}`}
      role="alert"
    >
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-text-dark">{title}</p>}
        {message && <p className="text-sm text-text-secondary">{message}</p>}
      </div>
      <button
        onClick={() => onRemove(id)}
        className="flex-shrink-0 p-0.5 rounded text-text-secondary hover:text-text-dark transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default Toast;
