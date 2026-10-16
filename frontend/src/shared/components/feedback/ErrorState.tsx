import { Button } from '@/shared/components/ui';

interface ErrorStateProps {
  title?: string;
  message: string;
  retryLabel: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({ title, message, retryLabel, onRetry, className }: ErrorStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center w-full h-full ${className ?? ''}`}>
      <span className="material-symbols-outlined text-(length:--fs-icon-lg) text-[rgb(var(--color-text-muted))] mb-2">error</span>
      {title && (
        <h2 className="text-(length:--fs-body-lg)! font-bold text-[rgb(var(--color-text))] mb-1.5">{title}</h2>
      )}
      <p className="text-(length:--fs-caption)! text-[rgb(var(--color-text-muted))] max-w-[75%] text-center leading-relaxed mb-5">
        {message}
      </p>
      <div className="flex flex-row gap-2">
        <Button
          size="sm"
          leftIcon={<span className="material-symbols-outlined">refresh</span>}
          onClick={onRetry}
        >
          <span className="text-(length:--fs-caption)!">{retryLabel}</span>
        </Button>
      </div>
    </div>
  );
}
