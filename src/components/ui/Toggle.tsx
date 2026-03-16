import React from 'react';
import { cn } from '../../utils/cn';

export interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  checked,
  onChange,
  disabled = false,
  className,
}) => {
  const handleChange = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <label
      className={cn(
        'inline-flex cursor-pointer items-center gap-2',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <div
        className={cn(
          'relative h-6 w-11 rounded-full transition-colors',
          checked ? 'bg-brand-primary' : 'bg-gray-300',
        )}
      >
        <div
          className={cn(
            'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
            checked && 'translate-x-5',
          )}
        />
      </div>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
};
