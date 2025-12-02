import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  gradient?: boolean;
  glow?: boolean;
}

export function Card({ children, className = '', gradient = false, glow = false }: CardProps) {
  return (
    <div
      className={`
        rounded-2xl p-6
        ${gradient
          ? 'bg-gradient-to-br from-primary-500/10 to-accent-purple/10 dark:from-primary-600/20 dark:to-accent-purple/20'
          : 'bg-white dark:bg-[#1a1a1a]'
        }
        border border-light-border dark:border-[#2a2a2a]
        shadow-soft hover:shadow-medium dark:shadow-dark-soft dark:hover:shadow-dark-medium
        ${glow ? 'shadow-glow' : ''}
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  icon?: ReactNode;
  gradient?: 'blue' | 'purple' | 'pink' | 'orange' | 'green';
}

export function StatCard({ title, value, change, changeType, icon, gradient = 'blue' }: StatCardProps) {
  const gradientClasses = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-blue-500',
    pink: 'from-pink-500 to-rose-500',
    orange: 'from-orange-500 to-yellow-500',
    green: 'from-emerald-500 to-teal-500',
  };

  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2">
            {value}
          </h3>
          {change && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${
                changeType === 'up' ? 'text-emerald-500' : 'text-emerald-500'
              }`}>
                {changeType === 'up' ? '' : ''} {change}
              </span>
            </div>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradientClasses[gradient]} shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`
        rounded-2xl p-6
        bg-white/10 dark:bg-black/20
        backdrop-blur-xl
        border border-white/20 dark:border-white/10
        shadow-medium hover:shadow-strong dark:shadow-dark-medium dark:hover:shadow-dark-strong
        transition-shadow duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
}
