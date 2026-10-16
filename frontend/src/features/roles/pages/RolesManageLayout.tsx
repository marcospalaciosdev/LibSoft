import { Button } from "@/shared/components/ui";
import { cn } from "@/shared/utils";
import { firstCap } from "@/shared/utils/firstCap";
import { useTranslation } from "react-i18next";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

const sideBarButtons = [
    { label: 'dashboard', route: '', icon: 'space_dashboard' },
    { label: 'editPermissions', route: 'permissions', icon: 'security' },
];

export function RolesManageLayout() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div className="flex row h-full bg-[rgb(var(--color-bg-secondary))]">
            <aside className="h-full w-56 border-r border-[rgb(var(--color-border))]/60 p-3 flex flex-col justify-between shrink-0">
                <div className="space-y-4">
                    <div className="px-3 pt-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--color-text-muted))] block">
                            {t('roles.sidebar.title', { defaultValue: 'Roles & Accesos' })}
                        </span>
                    </div>

                    <ul className="w-full flex flex-col gap-1.5">
                        {sideBarButtons.map((button) => {
                            const isPermissions = location.pathname.endsWith('/permissions');
                            const isActive = button.route === '' ? !isPermissions : isPermissions;

                            return (
                                <Button
                                    key={button.route}
                                    className={cn(
                                        'w-full flex items-center justify-baseline rounded-sm text-sm font-medium transition-colors duration-200 px-3 py-1.5!',
                                        'hover:bg-[rgb(var(--color-bg-hover))]',
                                        isActive
                                            ? 'text-[rgb(var(--color-primary-500))]'
                                            : 'text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-text-hover-strong))]',
                                    )}
                                    variant="ghost"
                                    leftIcon={
                                        <span
                                            className="material-symbols-outlined text-lg"
                                        >
                                            {button.icon}
                                        </span>
                                    }
                                    onClick={() => navigate(button.route)}
                                >
                                    {firstCap(t(`roles.sidebar.${button.label}`, { defaultValue: button.label === 'dashboard' ? 'Dashboard' : 'Permisos' }))}
                                </Button>
                            );
                        })}
                    </ul>
                </div>

                <div className="pt-3 border-t border-[rgb(var(--color-border))]/50">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/settings')}
                        className="w-full justify-start text-xs text-[rgb(var(--color-text-muted))] hover:text-[rgb(var(--color-text))] rounded-md px-3 py-2"
                        leftIcon={<span className="material-symbols-outlined text-sm">arrow_back</span>}
                    >
                        {t('roles.sidebar.backToSettings')}
                    </Button>
                </div>
            </aside>
            <main className="h-full flex-1 min-w-0 overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
