import React from 'react';
import { motion } from 'framer-motion';

const StatCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-primary',
      iconBg: 'bg-blue-100 text-blue-700',
    },
    green: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      iconBg: 'bg-emerald-100 text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      iconBg: 'bg-amber-100 text-amber-700',
    },
    red: {
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      iconBg: 'bg-rose-100 text-rose-700',
    },
  };

  const scheme = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white rounded-xl border border-border p-5 shadow-sm transition-all flex items-start justify-between"
    >
      <div className="space-y-1">
        <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">{title}</p>
        <div className="text-2xl font-bold text-text-dark tracking-tight">{value}</div>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        {trend && (
          <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
            <span>↑</span> {trend}
          </div>
        )}
      </div>

      {Icon && (
        <div className={`p-3 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
};

export default StatCard;
