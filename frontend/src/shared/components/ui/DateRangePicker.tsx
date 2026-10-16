import { useState, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';

interface DateRangePickerProps {
    startDate?: string;
    endDate?: string;
    onChange: (range: { startDate: string; endDate: string }) => void;
    children?: ReactNode;
    className?: string;
}

export function DateRangePicker({
    startDate = '',
    endDate = '',
    onChange,
    children,
    className = '',
}: DateRangePickerProps) {

    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const [tempStart, setTempStart] = useState(startDate);
    const [tempEnd, setTempEnd] = useState(endDate);

    useOutsideClick([containerRef], () => setIsOpen(false));

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    const handlePreset = (days: number | 'all') => {
        if (days === 'all') {
            setTempStart('');
            setTempEnd('');
            onChange({ startDate: '', endDate: '' });
            setIsOpen(false);
            return;
        }

        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);

        const startStr = formatDate(start);
        const endStr = formatDate(end);

        setTempStart(startStr);
        setTempEnd(endStr);
        onChange({ startDate: startStr, endDate: endStr });
        setIsOpen(false);
    };

    const handleApply = () => {
        onChange({ startDate: tempStart, endDate: tempEnd });
        setIsOpen(false);
    };

    const handleClear = () => {
        setTempStart('');
        setTempEnd('');
        onChange({ startDate: '', endDate: '' });
        setIsOpen(false);
    };

    return (
        <div className={`relative inline-block w-full h-full ${className}`} ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 min-w-0 truncate w-fit h-full bg-[rgb(var(--color-bg-secondary))]/40 hover:bg-[rgb(var(--color-bg-secondary))]/70 text-[rgb(var(--color-text))] rounded-md text-xs border border-[rgb(var(--color-border))]/50 transition-colors cursor-pointer select-none px-3"
            >
                <div className="flex items-center gap-2 min-w-0 truncate">
                    <span className="material-symbols-outlined text-base text-[rgb(var(--color-text-muted))] shrink-0">
                        calendar_today
                    </span>
                    {children}
                </div>
                <span className={`transition-transform duration-200 material-symbols-outlined text-sm text-[rgb(var(--color-text-muted))] shrink-0 ${isOpen ? '-rotate-90' : ''}`}>
                    chevron_left
                </span>
            </button>
            {isOpen && (
                <div className="absolute right-0 sm:left-0 mt-2 w-72 z-50 p-4 bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] rounded-2xl shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between border-b border-[rgb(var(--color-border))]/40 pb-2">
                        <span className="text-xs font-semibold text-[rgb(var(--color-text))]">
                            Rango de fechas
                        </span>
                        {(tempStart || tempEnd) && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-[11px] text-[rgb(var(--color-primary-500))] hover:underline cursor-pointer"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <button
                            type="button"
                            onClick={() => handlePreset(0)}
                            className="px-2 py-1.5 text-[11px] font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] bg-[rgb(var(--color-bg-secondary))]/40 hover:bg-[rgb(var(--color-bg-secondary))] rounded-lg transition-colors text-left"
                        >
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePreset(7)}
                            className="px-2 py-1.5 text-[11px] font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] bg-[rgb(var(--color-bg-secondary))]/40 hover:bg-[rgb(var(--color-bg-secondary))] rounded-lg transition-colors text-left"
                        >
                            Últimos 7 días
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePreset(30)}
                            className="px-2 py-1.5 text-[11px] font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] bg-[rgb(var(--color-bg-secondary))]/40 hover:bg-[rgb(var(--color-bg-secondary))] rounded-lg transition-colors text-left"
                        >
                            Últimos 30 días
                        </button>
                        <button
                            type="button"
                            onClick={() => handlePreset('all')}
                            className="px-2 py-1.5 text-[11px] font-medium text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] bg-[rgb(var(--color-bg-secondary))]/40 hover:bg-[rgb(var(--color-bg-secondary))] rounded-lg transition-colors text-left"
                        >
                            Todo el historial
                        </button>
                    </div>
                    <div className="space-y-2.5 pt-1 border-t border-[rgb(var(--color-border))]/30">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[rgb(var(--color-text-muted))]">
                            Personalizado
                        </span>
                        <div className="space-y-2">
                            <Input
                                label={<span className="text-[11px]">Desde</span>}
                                type="date"
                                value={tempStart}
                                onChange={(e) => setTempStart(e.target.value)}
                                inputClassName="text-xs h-8 rounded-lg bg-[rgb(var(--color-bg-secondary))]/30 border-[rgb(var(--color-border))]/50"
                            />
                            <Input
                                label={<span className="text-[11px]">Hasta</span>}
                                type="date"
                                value={tempEnd}
                                onChange={(e) => setTempEnd(e.target.value)}
                                inputClassName="text-xs h-8 rounded-lg bg-[rgb(var(--color-bg-secondary))]/30 border-[rgb(var(--color-border))]/50"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-[rgb(var(--color-border))]/40">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsOpen(false)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-[rgb(var(--color-border))]/50"
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleApply}
                            className="text-xs px-3 py-1.5 rounded-lg bg-[rgb(var(--color-primary-500))] text-white hover:bg-[rgb(var(--color-primary-600))]"
                        >
                            Aplicar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}