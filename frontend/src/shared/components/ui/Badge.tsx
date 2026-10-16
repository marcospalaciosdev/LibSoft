import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[rgb(var(--color-surface))] text-[rgb(var(--color-text-muted))]',
  success: 'bg-green-500/20 text-green-500',
  warning: 'bg-amber-500/20 text-amber-500',
  error: 'bg-red-500/20 text-red-500',
  info: 'bg-[rgb(var(--color-primary-500))]/20 text-[rgb(var(--color-primary-500))]',
};

export function Badge({ variant = 'default', children, className, style }: BadgeProps) {
  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
