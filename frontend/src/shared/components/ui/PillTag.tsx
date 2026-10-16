type PillTagProps = {
    text: string
    icon?: string
    className?: string
}

export function PillTag({
    text,
    icon,
    className,
}: PillTagProps) {

    return (
        <div className={`
            flex flex-row items-center justify-center gap-1
            border rounded-lg border-[rgb(var(--color-border))]
            w-fit h-fit 
            px-3 py-1  
            hover:shadow-md 
            ${className}`}>
            {icon && <span className="material-symbols-outlined 
                        text-[rgba(var(--color-text-muted))]">
                {icon}
            </span>}
            <span className="text-[rgba(var(--color-text-muted))]">
                {text}
            </span>
        </div>
    )
}