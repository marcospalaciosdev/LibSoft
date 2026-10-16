import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
}

const maxWidthClasses = {
  'sm': 'max-w-sm',
  'md': 'max-w-md',
  'lg': 'max-w-lg',
  'xl': 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
};

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className,
  maxWidth = 'lg',
}: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);


  const handleBackdropClick = (e: React.MouseEvent) => { if (e.target === overlayRef.current) onClose() };

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className={cn(
        'fixed w-full h-[calc(100%-44px)] z-9998 bottom-0 flex items-center justify-center',
        'bg-black/50 backdrop-blur-sm',
        'animate-[fadeIn_200ms_ease-out]',
      )}
    >
      <div
        ref={modalRef}
        className={cn(
          'w-full rounded-2xl shadow-2xl overflow-hidden',
          'bg-[rgb(var(--color-bg))]',
          'animate-[slideUp_250ms_ease-out]',
          maxWidthClasses[maxWidth],
          className,
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-[rgb(var(--color-border))]/40">
            <div>
              <h2 className="text-lg font-semibold text-[rgb(var(--color-text))]">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[rgb(var(--color-text-muted))]/80 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="aspect-square rounded-full text-[rgb(var(--color-text-muted))]/60 hover:text-[rgb(var(--color-text))] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          </div>
        )}

        {/* Body */}
        <div className="">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
