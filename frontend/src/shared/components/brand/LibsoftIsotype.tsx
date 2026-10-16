import React from 'react';
import { APP_NAME, COMPRESSED_APP_NAME } from '@/shared/constants';

interface LogoProps {
    fontSizeInPx?: number;
    color?: string;
    className?: string;
    isCompressed?: boolean;
}

export const LibsoftIsotype: React.FC<LogoProps> = ({
    fontSizeInPx = 150,
    color = 'white',
    isCompressed = false,
    className = ''
}) => {
    return (
        <span
            className={`inline-flex items-center justify-center overflow-hidden whitespace-nowrap select-none ${className}`}
            style={{
                fontSize: `${fontSizeInPx}px`,
                color: color
            }}
        >
            <span
                className={`transition-all duration-500 font-bold ease-in-out block ${isCompressed
                    ? 'opacity-100 max-w-[2ch]'
                    : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
            >
                {COMPRESSED_APP_NAME}
            </span>

            <span
                className={`transition-all duration-500 ease-in-out block ${!isCompressed
                    ? 'opacity-100 max-w-[20ch]'
                    : 'opacity-0 max-w-0 pointer-events-none'
                    }`}
            >
                {APP_NAME}
            </span>
        </span>
    );
};
