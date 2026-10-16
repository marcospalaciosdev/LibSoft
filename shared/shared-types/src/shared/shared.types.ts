export type MetricItem = {
    metricKey: string;
    value: string | number | undefined;
    valueType?: 'number' | 'percentage' | 'currency' | 'string';
    icon?: string;
    severity?: 'good' | 'normal' | 'warning' | 'danger';
    className?: string;
};

export type DataStatus = 'loading' | 'idle' | 'success' | 'error';