import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { Spinner } from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary:
          'bg-brand-primary text-white hover:bg-brand-primary-dk focus:ring-brand-primary',
        'outline-primary':
          'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white focus:ring-brand-primary',
        success:
          'bg-brand-success text-white hover:opacity-90 focus:ring-brand-success',
        danger:
          'bg-brand-danger text-white hover:opacity-90 focus:ring-brand-danger',
        ghost:
          'bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
      },
      size: {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <Spinner size="sm" className="mr-2" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
