import React, { useState, useRef } from 'react';

import { useOutsideClick } from '@/shared/hooks/useOutsideClick';

interface DropDownMenuLabel {
    content: React.ReactNode;
    className?: string;
    position?: "top" | "right" | "bottom" | "left";
}

interface DropDownMenuProps {
    id?: string;
    name?: string;
    children: React.ReactNode;
    className?: string;
    mainClassName?: string;
    label?: React.ReactNode | DropDownMenuLabel;
    options: {
        label: string;
        value: string;
    }[];
    color?: string;
    onSelect: (value: string, label: string) => void;
    position?: "top" | "bottom";
    fontSize?: string;
    height?: string;
    width?: string;
    error?: string;
    isDisabled?: boolean;
}

function isDropDownMenuLabel(value: React.ReactNode | DropDownMenuLabel): value is DropDownMenuLabel {
    return typeof value === 'object' && value !== null && 'content' in value;
}

export function DropDownMenu({
    id,
    children,
    mainClassName,
    className,
    label,
    options,
    onSelect,
    position = "bottom",
    color = "var(--color-text-muted)",
    fontSize = '16px',
    height,
    width = '100%',
    error,
    isDisabled = false,
}: DropDownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const labelRef = useRef<HTMLDivElement>(null);

    useOutsideClick([menuRef, labelRef], () => setIsOpen(false));

    const handleSelect = (value: string, label: string) => {
        onSelect(value, label);
        setIsOpen(false);
    };

    const labelObject = isDropDownMenuLabel(label) ? label : undefined;
    const labelNode: React.ReactNode = labelObject ? labelObject.content : (label as React.ReactNode);
    const labelClass = ['cursor-pointer', labelObject?.className].filter(Boolean).join(' ');
    const labelPosition = labelObject?.position ?? 'top';
    const isVertical = labelPosition === 'top' || labelPosition === 'bottom';
    const labelBefore = labelPosition === 'top' || labelPosition === 'left';

    return (
        <div
            ref={menuRef}
            id={id}
            style={{ width: width }}
            className={`${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} flex ${isVertical ? 'flex-col' : 'flex-row items-center gap-2'} ${mainClassName}`}
        >
            {labelNode && labelBefore && (
                <span
                    ref={labelRef}
                    className={labelClass + `h-fit w-fit cursor-pointer`}
                    data-label-position={labelPosition}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {labelNode}
                </span>
            )}
            <div
                className={`${className} relative border border-[rgb(var(--color-border))] rounded-md flex items-center justify-center flex-row ${isVertical && label ? 'mt-1' : ''}`}
            >
                <div
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex flex-row items-center gap-1 justify-between text-sm cursor-pointer hover:bg-[rgb(var(--color-bg-secondary))] px-3 py-1 transition-colors duration-200 rounded-md w-full"
                    style={{ fontSize, height: height ?? undefined }}
                >
                    <span style={{ color: color }}>{children}</span>
                    <span
                        style={{ color: color }}
                        className={`material-symbols-outlined text-sm transition-transform duration-300 
                            ${isOpen && !isDisabled && position === 'bottom' ? '-rotate-90' : ''}
                            ${isOpen && !isDisabled && position === 'top' ? 'rotate-90' : ''}
                        `}>
                        keyboard_arrow_left
                    </span>
                </div>
                <div className={`
                    absolute min-w-full max-w-75 left-0 z-50
                    max-h-50 overflow-y-auto text-sm 
                    bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-border))] rounded-md 
                    flex flex-col gap-1 shadow-md
                    transition-all duration-200 ease-in-out
                    ${position === 'bottom' ? 'top-full mt-2' : 'bottom-full mb-2'}

                    ${isOpen && !isDisabled
                        ? 'opacity-100 translate-y-0 visible'
                        : 'opacity-0 invisible pointer-events-none'
                    }
                    
                    ${!isOpen && position === 'bottom' ? '-translate-y-2' : ''}
                    ${!isOpen && position === 'top' ? 'translate-y-2' : ''}
                `}>
                    {options.map((option) => (
                        <div
                            key={option.value}
                            onClick={() => handleSelect(option.value, option.label)}
                            className="cursor-pointer hover:bg-[rgb(var(--color-bg-secondary))] px-3 py-2 w-full transition-colors duration-200"
                            style={{ fontSize: fontSize, color: color }}
                        >
                            {option.label}
                        </div>
                    ))}
                </div>
            </div>
            {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
        </div>
    );
}