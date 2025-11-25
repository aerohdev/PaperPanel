import React from 'react';

/**
 * Skeleton loading components for consistent loading states
 */

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-light-border dark:border-[#2a2a2a] animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-20"></div>
        <div className="h-6 w-6 bg-light-hover dark:bg-[#2a2a2a] rounded"></div>
      </div>
      <div className="h-8 bg-light-hover dark:bg-[#2a2a2a] rounded w-24 mb-2"></div>
      <div className="h-3 bg-light-hover dark:bg-[#2a2a2a] rounded w-32"></div>
    </div>
  );
};

export const SkeletonStat: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] p-6 rounded-lg border border-light-border dark:border-[#2a2a2a] animate-shimmer">
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-16"></div>
        <div className="h-6 w-6 bg-light-hover dark:bg-[#2a2a2a] rounded-full"></div>
      </div>
      <div className="h-9 bg-light-hover dark:bg-[#2a2a2a] rounded w-20 mb-1"></div>
      <div className="h-3 bg-light-hover dark:bg-[#2a2a2a] rounded w-28"></div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-light-border dark:border-[#2a2a2a] overflow-hidden">
      {/* Table Header */}
      <div className="border-b border-light-border dark:border-[#2a2a2a] p-4 flex gap-4 bg-light-hover dark:bg-[#0a0a0a] animate-pulse">
        <div className="h-4 bg-light-border dark:bg-[#2a2a2a] rounded w-32"></div>
        <div className="h-4 bg-light-border dark:bg-[#2a2a2a] rounded w-24"></div>
        <div className="h-4 bg-light-border dark:bg-[#2a2a2a] rounded w-40"></div>
        <div className="h-4 bg-light-border dark:bg-[#2a2a2a] rounded flex-1"></div>
      </div>

      {/* Table Rows */}
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="border-b border-light-border dark:border-[#2a2a2a] p-4 flex gap-4 animate-pulse">
          <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-32"></div>
          <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-24"></div>
          <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-40"></div>
          <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded flex-1"></div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonList: React.FC<{ items?: number }> = ({ items = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-light-border dark:border-[#2a2a2a] animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-5 bg-light-hover dark:bg-[#2a2a2a] rounded w-48 mb-2"></div>
              <div className="h-3 bg-light-hover dark:bg-[#2a2a2a] rounded w-64"></div>
            </div>
            <div className="h-8 bg-light-hover dark:bg-[#2a2a2a] rounded w-20"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonLogLine: React.FC = () => {
  return (
    <div className="font-mono text-sm py-1 animate-pulse flex gap-2">
      <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-16"></div>
      <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-24"></div>
      <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded flex-1"></div>
    </div>
  );
};

export const SkeletonLogViewer: React.FC = () => {
  return (
    <div className="space-y-4">
      {/* Search Bar Skeleton */}
      <div className="flex gap-4">
        <div className="h-10 bg-white dark:bg-[#1a1a1a] border border-light-border dark:border-[#2a2a2a] rounded flex-1 animate-pulse"></div>
        <div className="h-10 bg-white dark:bg-[#1a1a1a] border border-light-border dark:border-[#2a2a2a] rounded w-32 animate-pulse"></div>
      </div>

      {/* Log Content Skeleton */}
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-light-border dark:border-[#2a2a2a] p-4 space-y-2">
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
    <div className="bg-white dark:bg-[#1a1a1a] p-4 rounded-lg border border-light-border dark:border-[#2a2a2a] animate-pulse">
      <div className="flex items-center mb-2">
        <div className="h-5 w-5 bg-light-hover dark:bg-[#2a2a2a] rounded mr-2"></div>
        <div className="h-4 bg-light-hover dark:bg-[#2a2a2a] rounded w-32"></div>
      </div>
      <div className="h-6 bg-light-hover dark:bg-[#2a2a2a] rounded w-20"></div>
    </div>
  );
};
