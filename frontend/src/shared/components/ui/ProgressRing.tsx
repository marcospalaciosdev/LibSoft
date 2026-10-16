import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type ProgressRingProps = {
  progress: number;
  size?: number;
  thickness?: number;
  children?: ReactNode;
  showLegend?: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColor?: string;
  trackColor?: string;
  className?: string;
};

export function ProgressRing({
  progress,
  size = 120,
  thickness = 8,
  children,
  showLegend = false,
  primaryLabel = 'Completado',
  secondaryLabel = 'Restante',
  primaryColor = 'rgb(var(--color-primary-500))',
  trackColor = 'rgb(var(--color-bg-secondary))',
  className = '',
}: ProgressRingProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const strokeDashoffset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Ring Container */}
      <div className="relative flex justify-center items-center hover:transform hover:scale-105 transition-all duration-300 ease-out" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Background Track Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={trackColor}
            strokeWidth={thickness}
          />
          {/* Progress Ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={primaryColor}
            strokeWidth={thickness}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Inner Content */}
        <div className="absolute flex flex-col items-center justify-center text-center animate-fade-in">
          {children}
        </div>
      </div>

      {/* Optional Legend */}
      {showLegend && (
        <div className="flex flex-row items-center gap-5 mt-5 text-sm animate-fade-in">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm"
              style={{ backgroundColor: primaryColor }}
            ></span>
            <span className="text-[rgb(var(--color-text))] font-medium text-nowrap">{primaryLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shadow-sm border border-[rgb(var(--color-border))]/50"
              style={{ backgroundColor: trackColor }}
            ></span>
            <span className="text-[rgb(var(--color-text-muted))] text-nowrap">{secondaryLabel}</span>
          </div>
        </div>
      )}
    </div>
  );
}