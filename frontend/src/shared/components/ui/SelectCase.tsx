import { useState } from "react";

interface SelectCaseProps {
    label?: React.ReactNode;
    defaultIsActive?: boolean;
    onClick?: (value: boolean) => void;
}

export function SelectCase({
    label,
    defaultIsActive = false,
    onClick,
}: SelectCaseProps) {

    const [isSelected, setIsSelected] = useState<boolean>(defaultIsActive);

    const handleSelect = () => {
        const newValue = !isSelected;
        setIsSelected(newValue);
        onClick?.(newValue);
    }

    return (
        <div className="flex flex-row items-center gap-2">
            <div
                className={`w-4 h-4 border rounded-sm cursor-pointer flex items-center justify-center transition-all duration-300 ${isSelected
                    ? 'bg-[rgb(var(--color-primary-500))] border-[rgb(var(--color-primary-500))]'
                    : 'border-[rgb(var(--color-border))] hover:border-[rgb(var(--color-primary-500))]'
                    }`}
                onClick={handleSelect}
            >
                {isSelected && (
                    <span className="material-symbols-outlined text-base text-white">
                        check
                    </span>
                )}
            </div>
            <div
                className="flex items-center h-full cursor-pointer"
                onClick={handleSelect}
            >
                {label}
            </div>
        </div>
    )
}