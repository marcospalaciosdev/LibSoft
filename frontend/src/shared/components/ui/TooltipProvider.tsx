import type { ReactNode } from 'react';
import { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  position: 'top' | 'bottom';
  className?: string;
  fontSize?: string | number;
}

interface TooltipContextValue {
  showTooltip: (params: { text: string; anchorRect: DOMRect; className?: string; fontSize?: string | number }) => void;
  hideTooltip: () => void;
}

const TooltipContext = createContext<TooltipContextValue | null>(null);

export function TooltipProvider({ children }: { children: ReactNode }) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const showTooltip = useCallback(({ text, anchorRect, className, fontSize }: { text: string; anchorRect: DOMRect; className?: string; fontSize?: string | number }) => {
    const padding = 12;
    const centerX = anchorRect.left + anchorRect.width / 2;
    const maxX = window.innerWidth - padding;
    const minX = padding;
    const x = Math.min(Math.max(centerX, minX), maxX);

    const topY = anchorRect.top - 12;
    const bottomY = anchorRect.bottom + 12;
    const position = topY < 44 ? 'bottom' : 'top';
    const y = position === 'top' ? topY : bottomY;

    setTooltip({
      text,
      x,
      y,
      position,
      className,
      fontSize,
    });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(null);
  }, []);

  return (
    <TooltipContext.Provider value={{ showTooltip, hideTooltip }}>
      {children}
      {typeof document !== 'undefined' && tooltip
        ? createPortal(
          <div
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: tooltip.position === 'top'
                ? 'translate(-50%, -100%)'
                : 'translate(-50%, 0)',
            }}
          >
            <div
              className={`max-w-[260px] rounded-md border border-[rgb(var(--color-border))]/80 bg-[rgb(var(--color-bg-secondary))] px-2.5 py-1.5 text-xs text-[rgb(var(--color-text))] text-nowrap shadow-xl ${tooltip.className ?? ''}`}
              role="tooltip"
              style={{
                fontSize: tooltip.fontSize,
              }}
            >
              {tooltip.text}
            </div>
          </div>,
          document.body,
        )
        : null}
    </TooltipContext.Provider>
  );
}

export function useTooltipContext() {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltipContext must be used within TooltipProvider');
  }
  return context;
}
