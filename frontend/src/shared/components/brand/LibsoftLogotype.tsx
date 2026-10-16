import React from 'react';

import { COMPRESSED_APP_NAME } from '@/shared/constants';

interface LogoProps {
    sizeInPx?: number;
}

export const LibsoftLogotype: React.FC<LogoProps> = ({
    sizeInPx = 150
}) => {
    const fontSize = sizeInPx / 2;
    const borderRadius = sizeInPx / 4;

    return (
        <span
            className="flex items-center justify-center font-bold text-white shadow-lg bg-linear-to-tl from-[rgb(var(--color-primary-400))] to-[rgb(var(--color-primary-700))] bg-[rgb(var(--color-primary-500))]"
            style={{
                width: `${sizeInPx}px`,
                height: `${sizeInPx}px`,
                borderRadius: `${borderRadius}px`,
                fontSize: `${fontSize}px`
            }}
        >
            {COMPRESSED_APP_NAME}
        </span>
    );
};
