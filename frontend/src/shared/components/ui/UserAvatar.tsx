interface UserAvatarProps {
    avatarUrl?: string | null;
    fullName: string;
    children?: React.ReactNode;
    className?: string;
    backgroundColor?: string;
    textColor?: string;

    onMouseEnter?: () => void;
    onMouseLeave?: () => void;

    style?: React.CSSProperties;
}

export const UserAvatar = ({
    avatarUrl,
    fullName,
    children,
    className,
    backgroundColor,
    textColor,
    onMouseEnter,
    onMouseLeave,
    style
}: UserAvatarProps) => {
    return (
        <div className={`relative border w-8 h-8 border-[rgb(var(--color-border))] rounded-full aspect-square w-fit h-fit  mx-0.5 overflow-hidden ${className}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={style}>
            <div
                style={{
                    backgroundColor: backgroundColor ? backgroundColor : 'rgb(var(--color-bg))'
                }}
                className={`h-full w-full flex justify-center items-center`}>
                {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className='rounded-full w-full h-full object-cover' />
                ) : (
                    <div
                        style={{
                            color: textColor ? textColor : 'rgb(var(--color-primary-500))'
                        }}
                        className='rounded-full w-full h-full flex items-center justify-center  font-semibold text-[length:var(--fs-body-sm)]'>
                        {fullName.split(' ').map((n) => n[0]).join('').toUpperCase()}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};