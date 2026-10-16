import type { ReactNode } from 'react';

type ValueInput = number | string | null | undefined;
type ChangeDirection = 'up' | 'down' | 'neutral';
type ChangeFormat = 'delta' | 'percent' | 'number';

type LegacyChange = {
    value: string;
    color: string;
};

type RichChange = {
    value: ValueInput;
    direction?: ChangeDirection;
    betterWhen?: ChangeDirection;
    format?: ChangeFormat;
    suffix?: string;
    prefix?: string;
    label?: string;
    showArrow?: boolean;
    color?: string;
};

type MinimalMetricProps = {
    label: string;
    value: ValueInput;
    icon?: string;
    subtitle?: string;
    change?: RichChange | LegacyChange;
    footer?: ReactNode;
    className?: string;
    onClick?: () => void;
    placeholder?: string;
    valueFormatter?: (value: ValueInput) => string;
};

export function MinimalMetric({
    label,
    value,
    icon,
    subtitle: _subtitle,
    change: _change,
    className,
    onClick,
}: MinimalMetricProps) {

    return (
        <div
            className={`flex flex-col gap-3 rounded-2xl border border-[rgb(var(--color-border))]/70 bg-[rgb(var(--color-bg))] p-4 shadow-sm transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-[rgb(var(--color-primary-500))]/40 hover:shadow-md' : ''} ${className ?? ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center">
                            <span className="text-xs font-semibold uppercase text-[rgb(var(--color-text-muted))]">
                                {label}
                            </span>
                            {icon && (
                                <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] ml-2">
                                    {icon}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <div className="">
                <span className="text-2xl font-bold text-[rgb(var(--color-text))]">
                    {value}
                </span>
            </div>
        </div>
    );
}