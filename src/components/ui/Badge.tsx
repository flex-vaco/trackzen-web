import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        draft: 'bg-gray-100 text-gray-700',
        submitted: 'bg-brand-primary/10 text-brand-primary',
        approved: 'bg-brand-success/10 text-brand-success',
        rejected: 'bg-brand-danger/10 text-brand-danger',
        pending: 'bg-brand-secondary/10 text-brand-secondary',
        cancelled: 'bg-gray-200 text-gray-500',
      },
    },
    defaultVariants: {
      variant: 'draft',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant,
  ...props
}) => {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
};
