import { cn } from '@/shared/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  color?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function Spinner({ size = 'md', className, color = "rgb(var(--color-primary-500))" }: SpinnerProps) {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        className={cn('animate-spin', sizeClasses[size])}
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: color }}
      >
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
    </div>
  );
}
