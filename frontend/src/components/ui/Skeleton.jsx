import React from 'react';

const Skeleton = ({ className = '', count = 1 }) => {
  const base = `animate-pulse bg-gray-200 rounded-lg ${className}`;

  if (count === 1) return <div className={base} />;

  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={base} />
      ))}
    </div>
  );
};

export const SkeletonCard = ({ lines = 3 }) => (
  <div className="bg-white border border-border rounded-xl p-6 space-y-3 animate-pulse">
    <Skeleton className="h-5 w-1/3" />
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-4 w-${i % 2 === 0 ? 'full' : '3/4'}`} />
    ))}
  </div>
);

export const SkeletonStat = () => (
  <div className="bg-white border border-border rounded-xl p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-10 rounded-xl" />
    </div>
    <Skeleton className="h-8 w-20 mb-2" />
    <Skeleton className="h-3 w-32" />
  </div>
);

export default Skeleton;
