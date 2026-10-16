import type { ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { cn } from '@/shared/utils';
import { useTooltip } from '@/shared/hooks/useTooltip';

type ButtonVariant = 'default' | 'primary' | 'invertedPrimary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'unstyled';
type ButtonSize = 'sm' | 'md' | 'lg' | 'fit';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: React.Ref<HTMLButtonElement>;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  tooltip?: {
    text: string;
    className?: string;
    fontSize?: string | number;
  };
  children: ReactNode;
  isDisabled?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  default: '',
  primary: 'bg-[rgb(var(--color-primary-500))] text-white hover:bg-[rgb(var(--color-primary-600))] active:bg-white active:text-[rgb(var(--color-primary-500))] shadow-sm',
  invertedPrimary: 'bg-[rgb(var(--color-bg))] text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))] hover:text-white',
  secondary: 'bg-[rgb(var(--color-secondary))] text-[rgb(var(--color-text))] hover:bg-[rgb(var(--color-border-soft))] active:bg-[rgb(var(--color-border-soft))]',
  outline: 'border-2 border-[rgb(var(--color-primary-500))] text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-600))] active:bg-[rgb(var(--color-bg))]',
  ghost: 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] active:bg-[rgb(var(--color-border-soft))]',
  danger: 'text-[rgb(var(--color-text-muted))] hover:bg-red-500/10 hover:text-red-500 active:text-red-600 hover:bg-red-600/20',
  unstyled: '',
};

const sizeClasses: Record<ButtonSize, string> = {
  fit: 'w-fit h-fit',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
};

export function Button({
  ref,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  tooltip,
  children,
  className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  isDisabled,
  ...props
}: ButtonProps) {
  const { showTooltip, hideTooltip } = useTooltip();

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    if (tooltip?.text) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({ text: tooltip.text, anchorRect: rect, className: tooltip.className, fontSize: tooltip.fontSize });
    }
    onMouseEnter?.(event as any);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    hideTooltip();
    onMouseLeave?.(event as any);
  };

  const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
    if (tooltip?.text) {
      const rect = event.currentTarget.getBoundingClientRect();
      showTooltip({ text: tooltip.text, anchorRect: rect, className: tooltip.className });
    }
    onFocus?.(event as any);
  };

  const handleBlur = (event: React.FocusEvent<HTMLButtonElement>) => {
    hideTooltip();
    onBlur?.(event as any);
  };

  return (
    <button
      type={type}
      ref={ref}
      onClick={(e) => {
        if (isDisabled || isLoading) return;
        onClick?.(e);
        hideTooltip();
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn(
        variant !== 'unstyled' && 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        (isLoading || isDisabled) && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {isLoading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {rightIcon}
    </button>
  );
}
