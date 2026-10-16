type ActionMetricProps = {
    title: string;
    value: string | number;
    valueType?: 'number' | 'percentage' | 'currency' | 'string';
    isNegative?: boolean;
    severity?: 'good' | 'normal' | 'warning' | 'danger';
    trend?: {
        value: number;
        positive: boolean;
        type?: 'percentage' | 'number';
    };
    icon?: string;
    className?: string;
    onClick?: () => void;
}

export function ActionMetric({
    title,
    value,
    valueType = 'number',
    isNegative = false,
    severity = 'normal',
    trend,
    icon,
    className = '',
    onClick
}: ActionMetricProps) {
    const formatMetricValue = (metricValue: string | number) => {
        if (typeof metricValue === 'number') {
            if (valueType === 'percentage') {
                return `${metricValue}%`;
            }
            if (valueType === 'currency') {
                return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(metricValue);
            }
            return metricValue;
        }

        if (typeof metricValue === 'string') {
            if (valueType === 'percentage') {
                return metricValue.includes('%') ? metricValue : `${metricValue}%`;
            }
            if (valueType === 'currency') {
                const parsed = Number(metricValue);
                return Number.isFinite(parsed)
                    ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(parsed)
                    : metricValue;
            }
        }

        return metricValue;
    };

    const formattedValue = formatMetricValue(value);

    const effectiveSeverity = isNegative ? 'danger' : severity;

    return (
        <div className={`
            p-4
            flex
            flex-col
            gap-3
            group
            ${className}
        `}>
            <div className={`flex items-center justify-between text-[rgb(var(--color-text-muted))] ${onClick ? 'hover:text-[rgb(var(--color-primary-500))] hover:scale-102 transition-all duration-200 cursor-pointer' : ''}`} onClick={onClick}>
                <span className="
                    text-xs
                    font-medium
                ">
                    {title}
                </span>
                {onClick && (
                    <span className="material-symbols-outlined text-sm cursor-pointer">
                        chevron_right
                    </span>
                )
                }
            </div>

            <div className="flex flex-row items-center gap-3">
                {icon && (
                    <span className={`material-symbols-outlined text-sm ${effectiveSeverity === 'good' ? 'text-[rgb(var(--color-success-500))]' : effectiveSeverity === 'danger' ? 'text-[rgb(var(--color-error-500))]' : effectiveSeverity === 'warning' ? 'text-[rgb(var(--color-warning-500))]' : 'text-[rgb(var(--color-text-muted))]'}`}>
                        {icon}
                    </span>
                )}
                <div className="flex items-end gap-2">
                    <span className={`
                        text-[length:var(--fs-display)]
                        font-semibold
                        ${effectiveSeverity === 'good' ? 'text-[rgb(var(--color-success-500))]' : effectiveSeverity === 'danger' ? 'text-[rgb(var(--color-error-500))]' : effectiveSeverity === 'warning' ? 'text-[rgb(var(--color-warning-500))]' : 'text-[rgb(var(--color-text))]'}
                    `}>
                        {formattedValue}
                    </span>

                    {trend && (
                        <span
                            className={`
                                text-sm
                                font-medium
                                ${trend.positive
                                    ? 'text-green-500'
                                    : 'text-red-500'}
                            `}
                        >
                            {trend.value}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}