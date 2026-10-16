import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Badge, Button, Input } from "@/shared/components/ui";
import { cn } from "@/shared/utils";
import { firstCap } from "@/shared/utils/firstCap";
import type { BookCopy } from "@LibSoft/shared-types";

interface CopyTableRowProps {
    ref: React.RefObject<HTMLDivElement | null> | null;
    unit: BookCopy;
    isEditing: boolean;
    onEdit?: () => void;
    onCancel: () => void;
    onSave: (inventoryNumber: string) => void;
    onDelete?: () => void;
    onInputChange: (inventoryNumber: string) => void;
    onSelect?: (copyId: string) => void;
    onClick?: (copyId: string) => void
    isSelected?: boolean;
    error?: string;
}

export function CopyTableRow({
    ref,
    unit,
    isEditing,
    onEdit,
    onCancel,
    onSave,
    onDelete,
    onInputChange,
    onSelect,
    onClick,
    error,
    isSelected,
}: CopyTableRowProps) {
    const { t } = useTranslation();
    const [tempInventoryNumber, setTempInventoryNumber] = useState(unit.inventoryNumber || "");

    useEffect(() => {
        if (isEditing) setTempInventoryNumber(unit.inventoryNumber || "");
    }, [isEditing, unit.inventoryNumber]);

    const handleSave = () => onSave(tempInventoryNumber);

    const excludedRefs = useRef<(HTMLElement | null)[]>([]);

    const handleParentClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const shouldIgnore = excludedRefs.current.some((ref) => ref && ref.contains(e.target as Node));
        if (shouldIgnore) return;
        onClick?.(unit.id!)
    };

    return (
        <div
            onClick={handleParentClick}
            ref={ref}
            className="border-b border-[rgb(var(--color-border))]/30 cursor-pointer">
            <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] items-center px-4 py-3 hover:bg-[rgb(var(--color-surface))]/30 transition-all duration-200 group">
                <span className="material-symbols-outlined text-[rgb(var(--color-text-muted))]/40 text-sm group-hover:text-[rgb(var(--color-primary-500))]/60 transition-colors cursor-grab">
                    drag_indicator
                </span>
                <div className="flex items-center gap-3">
                    {isEditing ? (
                        <div className="flex flex-col gap-2">
                            <div className=" flex items-center gap-2">
                                <Input
                                    type="text"
                                    value={tempInventoryNumber}
                                    onChange={(e) => {
                                        onInputChange(e.target.value);
                                        setTempInventoryNumber(e.target.value)
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                                    className="w-32 p-0"
                                    inputClassName="h-8 text-sm bg-[rgb(var(--color-bg))] border-[rgb(var(--color-primary-500))]/50 focus:ring-1 ring-[rgb(var(--color-primary-500))]/20"
                                    autoFocus
                                />
                                <Button
                                    className={`${error ? 'text-red-500 hover:text-red-600' : 'text-green-500 hover:text-green-600'} transition-colors`}
                                    onClick={handleSave}
                                    variant="default"
                                    tooltip={{
                                        text: firstCap(t('common.actions.save')),
                                        className: 'text-nowrap',
                                        fontSize: '10px'
                                    }}
                                    disabled={error ? true : false}
                                >
                                    <span className="material-symbols-outlined text-lg leading-none">
                                        {error ? 'error' : 'check_circle'}
                                    </span>
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <span className="text-sm font-medium text-[rgb(var(--color-text))] font-mono">
                            {unit.inventoryNumber}
                        </span>
                    )}
                </div>
                <div className="flex justify-center">
                    <Badge
                        variant={unit.isAvailable ? 'success' : 'warning'}
                        className="min-w-20 justify-center"
                    >
                        {unit.isAvailable ? firstCap(t('common.statusValues.available')) : firstCap(t('common.borrowed', { count: 1 }))}
                    </Badge>
                </div>
                <div className="flex justify-center">
                    <span className="text-sm text-[rgb(var(--color-text-muted))]">
                        {unit.timesLoaned}
                    </span>
                </div>
                <div className="flex justify-center items-center gap-1 relative">
                    <Button
                        ref={(el) => { excludedRefs.current[1] = el; }}
                        variant="default"
                        onClick={isEditing ? onCancel : onEdit}
                        className={cn(
                            "aspect-square p-1.5! rounded-md transition-all duration-200 flex items-center justify-center ",
                            isEditing
                                ? "text-red-500 hover:bg-[rgb(var(--color-surface))]/50"
                                : "text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-primary-500))] hover:bg-[rgb(var(--color-primary-500))]/10"
                        )}
                        tooltip={{
                            text: firstCap(isEditing ? t('common.actions.cancel') : t('books.actions.editCopy')),
                            className: 'text-nowrap',
                            fontSize: '10px'
                        }}
                    >
                        <span className="material-symbols-outlined text-lg leading-none">
                            {isEditing ? 'close' : 'edit'}
                        </span>
                    </Button>
                    <Button
                        ref={(el) => { excludedRefs.current[1] = el; }}
                        variant="default"
                        onClick={onDelete}
                        className="aspect-square p-1.5! rounded-md text-[rgb(var(--color-text-muted))] hover:text-red-500 hover:bg-[rgb(var(--color-surface))]/50 transition-all duration-200 flex items-center justify-center "
                        tooltip={{
                            text: firstCap(t('books.actions.deleteCopy')),
                            className: 'text-nowrap',
                            fontSize: '10px'
                        }}
                    >
                        <span className="material-symbols-outlined text-lg leading-none">delete</span>
                    </Button>
                    <div
                        onClick={() => { onSelect?.(unit.id!); }}
                        className={` transition-colors duration-200 absolute right-3 h-3.5 w-3.5 flex items-center justify-center rounded-sm
                        ${isSelected ? 'bg-[rgb(var(--color-primary-500))]' : 'border border-[rgb(var(--color-text-soft))]'}
                    `}>
                        {
                            isSelected &&
                            <span className="material-symbols-outlined text-md leading-none text-white">
                                check
                            </span>
                        }
                    </div>
                </div>
            </div>
            {error && (
                <div className="grid grid-cols-[30px_1fr_1fr_1fr_1fr] w-full py-2">
                    <span className="col-start-2 col-end-3 text-red-500 text-xs pl-4">{error}</span>
                </div>
            )}
        </div>
    );
}
