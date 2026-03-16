import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const statCardVariants = cva(
  'rounded-xl p-5 shadow-sm',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-br from-brand-primary to-brand-primary-dk text-white',
        secondary:
          'bg-gradient-to-br from-brand-secondary to-brand-secondary/80 text-white',
        success:
          'bg-gradient-to-br from-brand-success to-brand-success/80 text-white',
        neutral: 'bg-white text-gray-900',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

export interface StatCardProps extends VariantProps<typeof statCardVariants> {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant,
  className,
}) => {
  const isNeutral = variant === 'neutral' || !variant;

  return (
    <div className={cn(statCardVariants({ variant }), className)}>
      <div className="flex items-start justify-between">
        <div>
          <p
            className={cn(
              'text-sm font-medium',
              isNeutral ? 'text-gray-500' : 'text-white/80',
            )}
          >
            {title}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold">{value}</p>
          {subtitle && (
            <p
              className={cn(
                'mt-1 text-sm',
                isNeutral ? 'text-gray-400' : 'text-white/70',
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg',
              isNeutral ? 'bg-gray-100 text-gray-500' : 'bg-white/20 text-white',
            )}
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};
