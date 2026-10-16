import { Button } from "@/shared/components/ui";
import { useTranslation } from "react-i18next";

import { firstCap } from "@/shared/utils/firstCap";

interface SelectThemeButtonProps {
    theme: {
        id: string;
        previewClass: string;
    };
    isSelected?: boolean;
    className?: string;
    onSelect?: (theme: string) => void;
    style?: React.CSSProperties;
}

export function SelectThemeButton({
    theme,
    isSelected,
    onSelect,
    className,
    style,
}: SelectThemeButtonProps) {
    const { t } = useTranslation();

    return (
        <Button
            variant="default"
            key={theme.id}
            onClick={() => {
                onSelect?.(theme.id);
            }}
            className={`${theme?.previewClass} ${className} group relative p-3.5! rounded-2xl bg-(--p-bg) transition-all duration-200 text-left flex flex-col gap-3 outline-none cursor-pointer shadow-xs`}
            style={style}
        >
            <div className="flex items-center justify-between w-full px-0.5">
                <span
                    className="text-xs font-bold tracking-wide transition-colors"
                    style={{ color: 'var(--p-text)' }}
                >
                    {
                        theme.id ? firstCap(t(`settings.appearance.theme.options.${theme.id}`)) : ''
                    }
                </span>
                <div
                    style={{
                        color: isSelected ? 'var(--p-bg)' : 'transparent',
                        backgroundColor: isSelected ? 'var(--p-accent)' : 'transparent',
                        borderColor: isSelected ? 'var(--p-accent)' : 'var(--p-border)'
                    }}
                    className="w-5 h-5 rounded-full flex items-center justify-center border transition-all duration-200"
                >
                    {isSelected && (
                        <span className="material-symbols-outlined text-xs font-bold">check</span>
                    )}
                </div>
            </div>
            <div
                className="w-full h-28 rounded-xl p-3 flex flex-col gap-2 transition-all duration-200 shadow-inner group-hover:opacity-90"
                style={{
                    backgroundColor: 'var(--p-card)',
                    border: '1px solid var(--p-border)'
                }}
            >
                <div className="flex justify-between items-center pb-1.5 border-b border-(--p-border)/40">
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--p-text)', opacity: 0.2 }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--p-text)', opacity: 0.2 }} />
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--p-text)', opacity: 0.2 }} />
                    </div>
                    <div className="w-10 h-2 rounded bg-(--p-accent) opacity-80" />
                </div>

                <div className="w-full h-full rounded-lg p-2 flex flex-col gap-1.5 bg-(--p-bg) border border-(--p-border)/30 shadow-xs">
                    <div className="w-full flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded bg-(--p-accent) opacity-50 shrink-0" />
                        <div className="w-3/4 h-1.5 rounded" style={{ backgroundColor: 'var(--p-text)', opacity: 0.3 }} />
                    </div>
                    <div className="space-y-1 pl-3.5">
                        <div className="w-full h-1 rounded" style={{ backgroundColor: 'var(--p-text)', opacity: 0.15 }} />
                        <div className="w-4/5 h-1 rounded" style={{ backgroundColor: 'var(--p-text)', opacity: 0.15 }} />
                    </div>
                </div>
            </div>
        </Button>
    );
}