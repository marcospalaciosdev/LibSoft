import type { ReactNode } from 'react';
import { cn } from '@/shared/utils';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: '✅',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: '❌',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: '⚠️',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'ℹ️',
  },
};

export function Alert({ variant = 'info', title, children, className, onClose }: AlertProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border animate-fade-in',
        styles.container,
        className,
      )}
      role="alert"
    >
      <span className="text-lg shrink-0 mt-0.5">{styles.icon}</span>
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-sm">{children}</div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-current opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
          aria-label="Cerrar"
        >
          ✕
        </button>
      )}
    </div>
  );
}
