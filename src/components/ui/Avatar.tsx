import React from 'react';
import { cn } from '../../utils/cn';

const sizeMap = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
} as const;

export interface AvatarProps {
  name: string;
  size?: keyof typeof sizeMap;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  size = 'md',
  className,
}) => {
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
      : (parts[0]?.[0] ?? '').toUpperCase();

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full bg-gradient-to-br from-brand-primary to-brand-primary-dk font-semibold text-white',
        sizeMap[size],
        className,
      )}
      title={name}
      aria-label={name}
    >
      {initials}
    </div>
  );
};
