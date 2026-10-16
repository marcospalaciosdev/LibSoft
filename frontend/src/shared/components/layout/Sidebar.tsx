import { useState, useRef, useEffect, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/app/store/ui.store';
import { useAuthStore } from '@/app/store/auth.store';
import { MAIN_NAV_ITEMS, ROUTE_PERMISSIONS } from '@/shared/constants';
import { cn } from '@/shared/utils';
import { useTranslation } from 'react-i18next';
import { firstCap } from '@/shared/utils/firstCap';
import { authApi } from '@/features/auth/api/auth.api';
import { Button, UserAvatar } from '../ui';
import { useAuth } from '@/hooks/useAuth';
import { getRandomPaletteColor } from '@/shared/utils/randomColor';
import { useOutsideClick } from '@/shared/hooks/useOutsideClick';

import { LibsoftIsotype } from '../brand/LibsoftIsotype';
import { Permission } from '@/hooks/usePermissions';

const userContextMenuBtns = [
  { name: 'editProfile', action: 'editProfile', icon: 'edit' },
  { name: 'logout', action: 'logout', icon: 'logout', className: 'text-red-500 hover:bg-red-500/10' },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebarCollapse } = useUIStore();
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

  const avatarBgColor = useMemo(() => {
    return getRandomPaletteColor();
  }, [user?.id]);

  useOutsideClick([menuRef], () => setIsMenuOpen(false));

  useEffect(() => {
    if (isMenuOpen && sidebarCollapsed) toggleSidebarCollapse();
  }, [isMenuOpen])

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Error al cerrar sesión en el servidor:', error);
    } finally {
      logout();
      navigate('/login', { replace: true });
    }
  };

  const handleAction = (action: string) => {
    setIsMenuOpen(false);
    if (action === 'editProfile') {
      user && navigate(`/users/edit/${user.id}`);
    } else if (action === 'logout') {
      handleLogout();
    }
  };

  return (
    <aside
      className={cn(
        'h-full bg-[rgb(var(--color-bg-tertiary))] relative text-[rgb(var(--color-text))] flex flex-col z-30 overflow-x-hidden items-center',
        'transition-all duration-500 ease-in-out overflow-y-hidden',
        sidebarCollapsed ? 'w-18' : 'w-64',
      )}
    >
      <div className="w-full h-15 flex items-center justify-center gap-3 px-5 font-bold">
        <LibsoftIsotype
          fontSizeInPx={18}
          className='font-semibold'
          color='var(--color-text)'
          isCompressed={sidebarCollapsed}
        />
      </div>

      <div className={cn(
        'px-4 h-12 top-15 flex items-center absolute transition-all duration-500 ease-in-out',
        sidebarCollapsed ? 'opacity-0 left-250' : 'justify-start w-full opacity-full left-0',
      )}>
        <span className="font-semibold text-(length:--fs-body) text-[rgb(var(--color-text))]">
          Control Panel
        </span>
      </div>

      <nav className={cn(
        "relative z-11 flex flex-col flex-1 gap-1 space-y-1 overflow-y-auto transition-all duration-500 ease-in-out w-[97%] overflow-x-hidden",
        sidebarCollapsed ? 'top-0 pt-2 px-1.5' : 'top-12 pt-0 px-1',
      )}>
        <div className='flex flex-col gap-1'>
          {MAIN_NAV_ITEMS.map((item) => (
            <Permission
              key={item.path}
              permissions={item.permissionsRequired ?? ROUTE_PERMISSIONS[item.path]}
            >
              <NavLink
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  cn(
                    'flex items-center rounded-sm text-sm font-medium transition-colors duration-200 px-0 py-2!',
                    'hover:bg-[rgb(var(--color-bg-hover))]',
                    isActive
                      ? 'bg-primary-600/20 text-primary-500 text-[rgb(var(--color-primary-500))] border-[rgb(var(--color-primary-500))]'
                      : 'text-[rgb(var(--color-text))] hover:text-[rgb(var(--color-text-hover-strong))]',
                  )
                }
              >
                <span
                  className={cn(
                    "material-symbols-outlined text-xl shrink-0 transition-all duration-500",
                    sidebarCollapsed ? 'ml-[calc(50%-10px)]' : 'ml-2.5'
                  )}
                  role="img"
                  aria-label={item.section}
                >
                  {item.icon}
                </span>

                <span
                  className={cn(
                    "text-md text-nowrap transition-all duration-500 ease-in-out overflow-hidden",
                    sidebarCollapsed
                      ? 'w-0 opacity-0 pointer-events-none'
                      : 'w-35 opacity-100 ml-3'
                  )}
                >
                  {firstCap(t(`${item.section}.section`))}
                </span>
              </NavLink>
            </Permission>
          ))}
        </div>
      </nav>

      <div className="w-full relative z-40" ref={menuRef}>
        <div className="w-full flex items-center px-0 transition-all duration-500">
          <div className='flex flex-row relative w-full justify-center'>
            <div
              onClick={() => setIsMenuOpen((prev) => !prev)}
              className='w-full flex max-w-[90%] px-2.5 py-4 rounded-md transition-colors duration-300 hover:bg-[rgb(var(--color-bg))] cursor-pointer select-none relative'
            >
              <UserAvatar
                backgroundColor={avatarBgColor}
                textColor='white'
                className={cn(
                  "shrink-0 transition-all duration-500 h-10! w-10! border-transparent",
                  sidebarCollapsed ? 'ml-[calc(50%-20px)]' : ''
                )}
                fullName={fullName}
                avatarUrl={user?.avatarUrl}
              />

              <div className={cn(
                "flex flex-col text-sm transition-all h-10 duration-500 ease-in-out overflow-hidden",
                sidebarCollapsed
                  ? 'w-0 opacity-0 pointer-events-none'
                  : 'w-37.5 opacity-100 ml-3'
              )}>
                <span className='text-[rgb(var(--color-text))] text-nowrap'>{fullName}</span>
                <div
                  className="text-xs p-0! mt-1 flex justify-start text-[rgb(var(--color-text-muted))] text-nowrap"
                >
                  {firstCap(t(`common.roles.${user?.roleName}`) || t('common.user'))}
                </div>
              </div>

              {isMenuOpen && (
                <div className={`bottom-[110%] left-0 absolute flex flex-col bg-[rgb(var(--color-bg))] border border-[rgb(var(--color-bg-hover))] rounded-md overflow-hidden shadow-md z-50 min-w-37.5`}>
                  {userContextMenuBtns.map((btn) => (
                    <Button
                      key={btn.name}
                      variant='ghost'
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(btn.action);
                      }}
                      className={`justify-start rounded-none text-[rgb(var(--color-text))] text-(length:--fs-caption) w-full px-3 py-2 ${btn.className || ''}`}
                      leftIcon={<span className='material-symbols-outlined text-base'>{btn.icon}</span>}
                    >
                      {firstCap(t(`common.sidebar.userContextMenu.actions.${btn.name}`))}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full relative z-12">
        <button
          onClick={toggleSidebarCollapse}
          className={cn(
            'w-full flex items-center justify-center gap-1 px-3 py-2',
            'hover:text-white hover:bg-[rgb(var(--color-bg-hover))]/20 transition-all duration-500',
            'cursor-pointer',
          ) + ' py-2! '}
          aria-label={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <span
            className={cn('transition-transform duration-500', sidebarCollapsed && 'rotate-180') + ' material-symbols-outlined text-xl shrink-0 text-[rgb(var(--color-text-muted))]'}
          >
            chevron_left
          </span>
          {!sidebarCollapsed && <span className="text-sm animate-fade-in text-[rgb(var(--color-text))]">
            {firstCap(t('common.sidebar.collapse'))}
          </span>}
        </button>
      </div>
    </aside>
  );
}