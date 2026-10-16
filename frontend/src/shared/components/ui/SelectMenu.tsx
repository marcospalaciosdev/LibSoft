import { useState, useEffect } from 'react';

interface SelectMenuProps {
    id?: string;
    className?: string;
    options: {
        label: string;
        value: string;
        className?: string;
    }[];
    onSelect: (value: string) => void;
    fontSize?: string;
    orientation?: "vertical" | "horizontal";
    error?: string;
    value?: string;
    label?: {
        text: string;
        width: string;
        heigth: string;
        className: string;
    };
    notNullable?: boolean;
}

export function SelectMenu({
    id,
    className,
    options,
    onSelect,
    fontSize,
    orientation = "vertical",
    error,
    label,
    value,
    notNullable = false
}: SelectMenuProps) {

    const [selectedOption, setSelectedOption] = useState<[string, number]>(["", -1]);

    useEffect(() => {
        setSelectedOption([
            value || "",
            value ? options.findIndex(o => o.value === value) : -1
        ]);
    }, [value, options]);

    const handleOptionSelect = (value: string, index: number) => {
        if (selectedOption[1] === index && !notNullable) {
            setSelectedOption(["", -1]);
            onSelect("");
            return;
        }

        setSelectedOption([value, index]);
        onSelect(value);
    }

    return (
        <div
            id={id || ''}
            className={`${className} ${orientation === 'vertical' ? 'flex flex-col' : 'grid items-center'} ${label?.text && orientation === 'horizontal' ? '' : ''}`}
            style={label?.text && orientation === 'horizontal' ? { gridTemplateColumns: `${label.width} 1fr` } : undefined}
        >
            {label?.text &&
                <span className={`min-w-0 ${label?.className || ''} ${orientation === 'horizontal' ? 'col-start-1 row-start-1' : ''}`}>{label?.text}</span>
            }
            <div className={`flex gap-2 flex-1 ${label?.text && orientation === 'vertical' ? 'mt-2' : ''} ${orientation === 'vertical' ? 'flex-col' : 'flex-row'} ${orientation === 'horizontal' ? 'col-start-2 row-start-1' : ''}`}>
                {options.map((op, index) => (
                    <div
                        onClick={() => handleOptionSelect(op.value, index)}
                        className={`cursor-pointer flex gap-2 items-center flex-1 bg-[rgb(var(--color-bg))] hover:bg-[rgb(var(--color-bg-secondary))] transition-colors duration-200 px-3 py-2 border border-[rgb(var(--color-border))] rounded-md h-full ${op.className || ""}`}
                    >
                        <span className={` 
                            flex items-center justify-center rounded-full w-4 h-4 border transition-colors duration-200
                            ${selectedOption[1] === index ? "border-[rgb(var(--color-primary-500))]" : "border-[rgb(var(--color-border))]"}
                        `}>
                            {selectedOption[1] === index && (
                                <span className='w-2 h-2 rounded-full bg-[rgb(var(--color-primary-500))]'></span>
                            )}
                        </span>
                        <span className={`
                            text-[rgb(var(--color-text))] text-[length:${fontSize || 'var(--fs-body-sm)'}]
                            ${error ? 'text-[rgb(var(--color-error))]' : ''}
                        `}>
                            {op.label}
                        </span>
                    </div>
                ))}
            </div>
            <span className={`mt-2 text-[rgb(var(--color-error-500))] text-(length:--fs-caption) ${orientation === 'horizontal' ? 'col-start-2 row-start-2' : ''}`}>{error}</span>
        </div>
    )
}