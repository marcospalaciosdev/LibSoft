import React from 'react';
import { DropDownMenu } from './DropDownMenu';

interface PaginationFooterProps {
    totalItems: number;
    limit: number;
    offset: number;
    onPageChange: (newOffset: number) => void;
    onLimitChange: (newLimit: number) => void;
    resultsCountText: string | ((visibleCount: number, total: number) => string);
    resultsPerPageLabel: React.ReactNode;
    limitOptions?: number[];
}

export const PaginationFooter: React.FC<PaginationFooterProps> = ({
    totalItems,
    limit,
    offset,
    onPageChange,
    onLimitChange,
    resultsCountText,
    resultsPerPageLabel,
    limitOptions = [25, 50, 100, 200],
}) => {
    const currentPage = Math.floor(offset / limit) + 1;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const currentVisibleCount = Math.min(limit, totalItems - offset);

    const handlePageSelect = (pageNumber: number) => {
        const newOffset = (pageNumber - 1) * limit;
        onPageChange(newOffset);
    };

    const handleLimitSelect = (value: string) => {
        const newLimit = Number(value);
        onLimitChange(newLimit);
        onPageChange(0);
    };

    const renderResultsInfo = () => {
        if (typeof resultsCountText === 'function') {
            return resultsCountText(currentVisibleCount, totalItems);
        }
        return resultsCountText;
    };

    return (
        <div className="shrink-0 w-full bg-[rgb(var(--color-bg))] border-t border-[rgb(var(--color-border))] flex items-center justify-between px-4 py-2 gap-4">
            <div className="flex flex-row gap-1">
                {/* Prev button */}
                <button
                    onClick={() => handlePageSelect(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1 p-1 rounded-sm text-(length:--fs-caption) text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-text))] disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 select-none aspect-square cursor-pointer"
                >
                    <span className="material-symbols-outlined text-[18px]!">chevron_left</span>
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1">
                    {(() => {
                        const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
                        if (totalPages <= 7) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                            pages.push(1);
                            if (currentPage > 3) pages.push('ellipsis-start');
                            const start = Math.max(2, currentPage - 1);
                            const end = Math.min(totalPages - 1, currentPage + 1);
                            for (let i = start; i <= end; i++) pages.push(i);
                            if (currentPage < totalPages - 2) pages.push('ellipsis-end');
                            pages.push(totalPages);
                        }
                        return pages.map((page, idx) =>
                            page === 'ellipsis-start' || page === 'ellipsis-end' ? (
                                <span
                                    key={`${page}-${idx}`}
                                    className="w-7 text-center text-[rgb(var(--color-text-muted))]/50 text-(length:--fs-caption) select-none"
                                >
                                    …
                                </span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => handlePageSelect(page as number)}
                                    className={`w-7 h-7 p-1 aspect-square flex items-center justify-center rounded-sm text-(length:--fs-caption) font-medium transition-all duration-150 select-none cursor-pointer ${currentPage === page
                                        ? 'bg-[rgb(var(--color-primary-500))] text-white shadow-sm'
                                        : 'text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-text))]'
                                        }`}
                                >
                                    {page}
                                </button>
                            )
                        );
                    })()}
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => handlePageSelect(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="w-7 h-7 p-1 aspect-square flex items-center justify-center rounded-sm text-(length:--fs-caption) font-medium transition-all duration-150 select-none cursor-pointer text-[rgb(var(--color-text-muted))] hover:bg-[rgb(var(--color-surface))] hover:text-[rgb(var(--color-text))]"
                    >
                        <span className="material-symbols-outlined text-[18px]!">chevron_right</span>
                    </button>
                    <span className="text-[rgb(var(--color-text-muted))]/60 text-(length:--fs-caption) whitespace-nowrap">
                        {renderResultsInfo()}
                    </span>
                </div>
            </div>

            <div className="flex flex-row items-center gap-2">
                <DropDownMenu
                    label={{
                        content: resultsPerPageLabel,
                        position: 'left'
                    }}
                    className="text-[rgb(var(--color-text))]"
                    position="top"
                    options={limitOptions.map((opt) => ({ label: String(opt), value: String(opt) }))}
                    onSelect={handleLimitSelect}
                    fontSize="13px"
                >
                    {String(limit)}
                </DropDownMenu>
            </div>
        </div>
    );
};
