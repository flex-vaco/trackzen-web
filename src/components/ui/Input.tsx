import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 transition-colors',
              'focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30',
              icon && 'pl-10',
              error && 'border-brand-danger focus:border-brand-danger focus:ring-brand-danger/30',
              className,
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1 text-sm text-brand-danger">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
