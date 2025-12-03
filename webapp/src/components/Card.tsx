import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'solid' | 'glass' | 'gradient';
  glow?: boolean;
}

export function Card({ children, className = '', variant = 'glass', glow = false }: CardProps) {
  const baseStyles = "rounded-2xl p-6 transition-all duration-300";

  const variantStyles = {
    solid: "bg-gray-900 border border-gray-800",
    glass: `
      bg-gradient-to-br from-gray-900/40 via-black/50 to-gray-900/40
      backdrop-blur-3xl backdrop-saturate-150
      border border-white/20
      shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]
      hover:shadow-[0_8px_32px_0_rgba(0,0,0,0.7),0_0_80px_0_rgba(138,92,246,0.2),inset_0_1px_0_0_rgba(255,255,255,0.25)]
      transition-all duration-300
    `,
    gradient: `
      bg-gradient-to-br from-purple-900/30 via-gray-900/40 to-blue-900/30
      backdrop-blur-3xl backdrop-saturate-150
      border border-white/20
      shadow-[0_8px_32px_0_rgba(0,0,0,0.6),0_0_60px_0_rgba(138,92,246,0.15),inset_0_1px_0_0_rgba(255,255,255,0.2)]
    `
  };

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${glow ? 'shadow-glow' : ''} ${className}`}>
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
    <Card variant="glass">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-300 mb-1">
            {title}
          </p>
          <h3 className="text-3xl font-bold text-white mb-2">
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
