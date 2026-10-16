interface SectionHeaderProps {
    title: string;
    description?: string;
    icon: string,
    children?: React.ReactNode;
    className?: string
}

export function SectionHeader({
    title,
    icon,
    description,
    children,
    className
}: SectionHeaderProps) {
    return (
        <div className={`flex items-center justify-between pb-5 ${className ? className : ''}`}>
            <div className="flex-1">
                <h1 className="text-2xl font-semibold text-[rgb(var(--color-text))] flex flex-row items-center gap-2">
                    <span className="material-symbols-outlined text-[rgb(var(--color-primary-500))] text-3xl">{icon}</span>
                    {title}
                </h1>
                <p className="text-[rgb(var(--color-text-muted))]/60 mt-1 text-sm">{description}</p>
            </div>

            {children}
        </div>
    )
}