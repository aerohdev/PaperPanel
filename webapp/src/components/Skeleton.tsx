import React from 'react';

/**
 * Skeleton loading components for consistent loading states
 */

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-700 rounded w-20"></div>
        <div className="h-6 w-6 bg-gray-700 rounded"></div>
      </div>
      <div className="h-8 bg-gray-700 rounded w-24 mb-2"></div>
      <div className="h-3 bg-gray-700 rounded w-32"></div>
    </div>
  );
};

export const SkeletonStat: React.FC = () => {
  return (
    <div className="bg-dark-surface p-6 rounded-lg border border-dark-border animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-gray-700 rounded w-16"></div>
        <div className="h-6 w-6 bg-gray-700 rounded-full"></div>
      </div>
      <div className="h-9 bg-gray-700 rounded w-20 mb-1"></div>
      <div className="h-3 bg-gray-700 rounded w-28"></div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-dark-surface rounded-lg border border-dark-border overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-dark-border p-4 flex gap-4 bg-dark-bg animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-32"></div>
        <div className="h-4 bg-gray-700 rounded w-24"></div>
        <div className="h-4 bg-gray-700 rounded w-40"></div>
        <div className="h-4 bg-gray-700 rounded flex-1"></div>
      </div>
      
      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="border-b border-dark-border p-4 flex gap-4 animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-32"></div>
          <div className="h-4 bg-gray-700 rounded w-24"></div>
          <div className="h-4 bg-gray-700 rounded w-40"></div>
          <div className="h-4 bg-gray-700 rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-dark-surface p-4 rounded-lg border border-dark-border animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 bg-gray-700 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-64"></div>
            </div>
            <div className="h-8 bg-gray-700 rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonLogLine: React.FC = () => {
  return (
    <div className="font-mono text-sm py-1 animate-pulse flex gap-2">
      <div className="h-4 bg-gray-700 rounded w-16"></div>
      <div className="h-4 bg-gray-700 rounded w-24"></div>
      <div className="h-4 bg-gray-700 rounded flex-1"></div>
    </div>
  );
};

export const SkeletonLogViewer: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search Bar Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 bg-dark-surface border border-dark-border rounded flex-1 animate-pulse"></div>
        <div className="h-10 bg-dark-surface border border-dark-border rounded w-32 animate-pulse"></div>
      </div>
      
      {/* Log Content Skeleton */}
      <div className="bg-dark-surface rounded-lg border border-dark-border p-4 space-y-2">
        {Array.from({ length: 20 }).map((_, index) => (
          <SkeletonLogLine key={index} />
        ))}
      </div>
    </div>
  );
};

interface SkeletonGridProps {
  columns?: number;
  rows?: number;
}

export const SkeletonGrid: React.FC<SkeletonGridProps> = ({ 
  columns = 4, 
  rows = 1 
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  }[columns] || 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4';

  return (
    <div className={`grid ${gridCols} gap-4`}>
      {Array.from({ length: columns * rows }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export const SkeletonInfoCard: React.FC = () => {
  return (
    <div className="bg-dark-surface p-4 rounded-lg border border-dark-border animate-pulse">
      <div className="flex items-center mb-2">
        <div className="h-5 w-5 bg-gray-700 rounded mr-2"></div>
        <div className="h-4 bg-gray-700 rounded w-32"></div>
      </div>
      <div className="h-6 bg-gray-700 rounded w-20"></div>
    </div>
  );
};
