import { useAuth } from '@/hooks/useAuth';
import { useCallback, useMemo, Fragment, createElement, type ReactNode } from 'react';

interface PermissionProps {
  permissions?: string | string[];
  mode?: 'any' | 'all';
  children: ReactNode;
  fallback?: ReactNode;
}

export function Permission({
  permissions,
  mode = 'any',
  children,
  fallback = null,
}: PermissionProps) {
  const { hasPermission } = useAuth();

  const rawList = Array.isArray(permissions)
    ? permissions
    : typeof permissions === 'string'
      ? [permissions]
      : [];

  const list = rawList.filter(
    (p): p is string => Boolean(p && p.trim())
  );

  if (list.length === 0) {
    return createElement(Fragment, null, children);
  }

  const allowed = mode === 'all'
    ? list.every((p) => hasPermission(p))
    : list.some((p) => hasPermission(p));

  return createElement(Fragment, null, allowed ? children : fallback);
}

export function usePermissions() {
  const { user, hasPermission } = useAuth();

  const can = useCallback(
    (permission: string) => hasPermission(permission),
    [hasPermission]
  );

  const canAny = useCallback(
    (permissions: string[]) => permissions.some(hasPermission),
    [hasPermission]
  );

  const canAll = useCallback(
    (permissions: string[]) => permissions.every(hasPermission),
    [hasPermission]
  );

  const permissions = useMemo(() => user?.permissions ?? {}, [user?.permissions]);

  return {
    permissions,
    can,
    canAny,
    canAll,
    Permission,
  };
}
