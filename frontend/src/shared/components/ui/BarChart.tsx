import { useState, useRef, useEffect, useCallback } from 'react';


export type BarChartDataset = {
  label: string;
  color: string;
};

export type BarChartDataPoint = {
  label: string;
  sum?: any;
  values: number[];
};

type BarChartProps = {
  /** Array of data points. Each has a label (x-axis) and values[] matching datasets order */
  data: BarChartDataPoint[];
  /** Dataset definitions (label + color) — one per value in each data point */
  datasets: BarChartDataset[];
  /** Optional title displayed above the chart */
  title?: string;
  /** Height of the chart area in pixels (also supports "100%" via CSS on parent) */
  height?: number;
  /** Whether to show the legend */
  showLegend?: boolean;
  /** Whether to show value labels on top of each bar */
  showValues?: boolean;
  /** Custom CSS class for wrapper */
  className?: string;
  /** Y-axis label */
  yAxisLabel?: string;
  /** Minimum spacing in px between Y-axis labels. More height → more labels. */
  yLabelMinGap?: number;
};



/** Compute a "nice" step for axis ticks given a raw max and desired tick count */
function niceStep(rawMax: number, desiredTicks: number): number {
  if (rawMax <= 0) return 1;
  const rawStep = rawMax / desiredTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const residual = rawStep / magnitude;

  let niceRes: number;
  if (residual <= 1) niceRes = 1;
  else if (residual <= 2) niceRes = 2;
  else if (residual <= 5) niceRes = 5;
  else niceRes = 10;

  return niceRes * magnitude;
}

/** Build an array of tick values from 0 to niceMax */
function buildTicks(rawMax: number, desiredTicks: number): { ticks: number[]; niceMax: number } {
  const step = niceStep(rawMax, desiredTicks);
  const niceMax = Math.ceil(rawMax / step) * step;
  const count = Math.round(niceMax / step);
  const ticks: number[] = [];
  for (let i = 0; i <= count; i++) {
    ticks.push(Math.round(step * i));
  }
  return { ticks, niceMax };
}


export function BarChart({
  data,
  datasets,
  title,
  height: heightProp,
  showLegend = true,
  showValues = true,
  className = '',
  yAxisLabel,
  yLabelMinGap = 32,
}: BarChartProps) {
  const [animReady, setAnimReady] = useState(false);
  const [chartHeight, setChartHeight] = useState(heightProp ?? 260);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    label: string;
    value: number;
    color: string;
    dataLabel: string;
  } | null>(null);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (heightProp !== undefined) {
      setChartHeight(heightProp);
      return;
    }
    const el = chartAreaRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h > 0) setChartHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [heightProp]);


  useEffect(() => {
    const t = setTimeout(() => setAnimReady(true), 80);
    return () => clearTimeout(t);
  }, []);


  const allValues = data.flatMap((d) => d.values);
  const rawMax = Math.max(...allValues, 1);


  const desiredTicks = Math.max(2, Math.floor(chartHeight / yLabelMinGap));
  const { ticks, niceMax } = buildTicks(rawMax, desiredTicks);

  const barCount = datasets.length;
  const groupGap = barCount > 1 ? 6 : 0;


  const handleBarEnter = useCallback(
    (e: React.MouseEvent, datasetLabel: string, value: number, color: string, dataLabel: string) => {
      if (!wrapperRef.current) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 10,
        label: datasetLabel,
        value,
        color,
        dataLabel,
      });
    },
    [],
  );

  const handleBarMove = useCallback(
    (e: React.MouseEvent) => {
      if (!wrapperRef.current || !tooltip) return;
      const rect = wrapperRef.current.getBoundingClientRect();
      setTooltip((prev) =>
        prev ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top - 10 } : null,
      );
    },
    [tooltip],
  );

  const handleBarLeave = useCallback(() => setTooltip(null), []);


  const yAxisWidth = Math.max(28, `${niceMax}`.length * 8 + 8);

  return (
    <div className={`flex flex-col select-none ${className}`} ref={wrapperRef} style={{ position: 'relative' }}>
      {/* Title */}
      {title && (
        <h3 className="text-[rgb(var(--color-text))] font-semibold text-sm mb-2">{title}</h3>
      )}

      {/* Main chart row: Y-axis + chart area */}
      <div className="flex flex-row items-stretch">
        {/* Y-axis */}
        <div
          className="relative shrink-0 flex flex-col justify-between items-end"
          style={{ width: yAxisWidth, height: chartHeight }}
        >
          {ticks
            .slice()
            .reverse()
            .map((val, i) => {
              const pct = niceMax === 0 ? 0 : (val / niceMax) * 100;
              return (
                <span
                  key={i}
                  className="absolute right-0 text-[rgb(var(--color-text-muted))]/60 leading-none pr-2"
                  style={{
                    fontSize: 'var(--fs-caption-sm)',
                    top: `${100 - pct}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {val}
                </span>
              );
            })}
        </div>

        {/* Chart area */}
        <div
          ref={chartAreaRef}
          className="flex-1 relative border-l border-b border-[rgb(var(--color-border))]/40"
          style={{ height: chartHeight }}
        >
          {/* Grid lines */}
          {ticks.map((val, i) => {
            const pct = niceMax === 0 ? 0 : (val / niceMax) * 100;
            return (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-[rgb(var(--color-border))]/20"
                style={{ bottom: `${pct}%` }}
              />
            );
          })}

          {/* Bar groups */}
          <div
            className="absolute inset-0 grid px-2"
            style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
          >
            {data.map((point, pi) => (
              <div
                key={pi}
                className="flex items-end justify-center h-full"
                style={{ gap: `${groupGap}px` }}
              >
                {point.values.map((val, vi) => {
                  const pct = niceMax === 0 ? 0 : (val / niceMax) * 100;
                  const ds = datasets[vi];
                  return (
                    <div
                      key={vi}
                      className="flex flex-col items-center justify-end h-full"
                      style={{
                        minWidth: barCount > 1 ? 12 : 24,
                        maxWidth: barCount > 1 ? 26 : 52,
                      }}
                    >
                      {/* Value on top */}
                      {showValues && (
                        <span
                          className={`text-[rgb(var(--color-text-muted))]/70 font-semibold mb-0.5 absolute transition-opacity duration-500 ${barCount > 1 ? 'text-xs' : 'text-sm'}`}
                          style={{
                            fontSize: 'var(--fs-caption-sm)',
                            opacity: animReady ? 1 : 0,
                            bottom: `${pct}%`,
                          }}
                        >
                          {val}
                        </span>
                      )}
                      {/* Bar */}
                      <div
                        className="w-full rounded-t cursor-pointer transition-all duration-700 ease-[cubic-bezier(.23,1,.32,1)]"
                        style={{
                          height: animReady ? `${pct}%` : '0%',
                          backgroundColor: ds.color,
                          transitionDelay: `${pi * 50 + vi * 25}ms`,
                          boxShadow: `0 0 8px -2px ${ds.color}44`,
                        }}
                        onMouseEnter={(e) => handleBarEnter(e, ds.label, val, ds.color, point.label)}
                        onMouseMove={handleBarMove}
                        onMouseLeave={handleBarLeave}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex flex-row">
        <div className="shrink-0" style={{ width: yAxisWidth }} />
        <div
          className="flex-1 grid px-2 pt-2"
          style={{ gridTemplateColumns: `repeat(${data.length}, 1fr)` }}
        >
          {data.map((point, i) => (
            <div
              key={i}
              className="text-[rgb(var(--color-text-muted))]/70 text-center leading-tight font-medium justify-self-center flex flex-col items-center gap-1"
              style={{ fontSize: 'var(--fs-caption-sm)', maxWidth: 80 }}
            >
              <span className='text-nowrap w-full overflow-hidden text-ellipsis' title={point.label}>{point.label}</span>
              {point.sum && (
                <span>
                  {point.sum}
                </span>
              )
              }
            </div>
          ))}
        </div>
      </div>

      {/* Y-axis label (bottom-left) */}
      {yAxisLabel && (
        <div className="flex flex-row mt-0.5">
          <span
            className="text-[rgb(var(--color-text-muted))]/40 font-medium text-nowrap"
            style={{ fontSize: 'var(--fs-caption-sm)', width: yAxisWidth, textAlign: 'right', paddingRight: 8 }}
          >
            {yAxisLabel}
          </span>
        </div>
      )}

      {/* Legend */}
      {showLegend && datasets.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 mt-3">
          {datasets.map((ds, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm shrink-0"
                style={{ backgroundColor: ds.color }}
              />
              <span
                className="text-[rgb(var(--color-text-muted))] font-medium"
                style={{ fontSize: 'var(--fs-caption-sm)' }}
              >
                {ds.label}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Tooltip */}
      {tooltip?.visible && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-1.5 rounded-lg shadow-xl border border-[rgb(var(--color-border))]/40 backdrop-blur-lg backdrop-brightness-50"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            backgroundColor: 'rgba(var(--color-bg), 0.95)',
          }}
        >
          <div className="flex items-center h-full gap-2">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tooltip.color }} />
            <span className="text-white font-semibold whitespace-nowrap" style={{ fontSize: 'var(--fs-caption)' }}>
              {tooltip.dataLabel}
            </span>
            <span className="text-white/60 whitespace-nowrap" style={{ fontSize: 'var(--fs-caption-sm)' }}>
              {tooltip.label}:
            </span>
            <span className="text-white font-bold whitespace-nowrap" style={{ fontSize: 'var(--fs-caption)' }}>
              {tooltip.value}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
