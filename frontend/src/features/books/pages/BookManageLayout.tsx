import { SectionHeader } from '@/shared/components/layout/SectionHeader';
import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { firstCap } from '@/shared/utils/firstCap';
import { useTranslation } from 'react-i18next';

export default function BookManageLayout() {
    const location = useLocation();
    const { t } = useTranslation();

    const tabsRef = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const currentTab = location.pathname.endsWith('copies') ? 'copies' : 'edit';
        const activeTabEl = tabsRef.current[currentTab];

        if (activeTabEl) {
            setIndicatorStyle({
                left: activeTabEl.offsetLeft,
                width: activeTabEl.offsetWidth,
            });
        }
    }, [location.pathname]);

    return (
        <div className="h-full w-full flex flex-row ">
            <div className='p-6 flex flex-col gap-4 h-full w-full'>
                <div className="">
                    <SectionHeader
                        title={firstCap(t('books.manage.title'))}
                        description={firstCap(t('books.manage.subtitle'))}
                        icon='book'
                    >
                    </SectionHeader>

                    <nav className="relative flex gap-8 border-b border-[rgb(var(--color-border))]">
                        <NavLink
                            to="edit"
                            ref={(el) => {
                                tabsRef.current['edit'] = el;
                            }}
                            className={({ isActive }) =>
                                `pb-3 text-sm font-medium transition-colors ${isActive
                                    ? 'text-[rgb(var(--color-primary-500))]'
                                    : 'text-[rgb(var(--color-text))] hover:opacity-80'
                                }`
                            }
                        >
                            Details
                        </NavLink>

                        <NavLink
                            to="copies"
                            ref={(el) => {
                                tabsRef.current['copies'] = el;
                            }}
                            className={({ isActive }) =>
                                `pb-3 text-sm font-medium transition-colors ${isActive
                                    ? 'text-[rgb(var(--color-primary-500))]'
                                    : 'text-[rgb(var(--color-text))] hover:opacity-80'
                                }`
                            }
                        >
                            Copies
                        </NavLink>

                        <span
                            className="absolute bottom-0 h-0.5 bg-[rgb(var(--color-primary-500))] transition-all duration-300 ease-out rounded-t-sm"
                            style={{
                                left: `${indicatorStyle.left}px`,
                                width: `${indicatorStyle.width}px`,
                            }}
                        />
                    </nav>
                </div>

                <main className="flex-1 min-h-0 flex flex-col">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}