import type { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ForbiddenPage } from '@/shared/components/feedback';
import { getRoutePermissions } from '@/shared/constants';

interface RequirePermissionProps {
  permissions?: string | string[];
  mode?: 'any' | 'all';
  redirectTo?: string;
  allowOwnProfile?: boolean;
  fallback?: ReactNode;
  children?: ReactNode;
}

export function RequirePermission({
  permissions,
  mode = 'any',
  redirectTo,
  allowOwnProfile = false,
  fallback,
  children,
}: RequirePermissionProps) {
  const { user, hasPermission } = useAuth();
  const location = useLocation();
  const params = useParams();

  // If allowOwnProfile is enabled and the id param matches the authenticated user's id
  if (allowOwnProfile && params.id && user?.id && String(params.id) === String(user.id)) {
    return children ? <>{children}</> : <Outlet />;
  }

  const effectivePermissions = permissions ?? getRoutePermissions(location.pathname);

  const list = (
    Array.isArray(effectivePermissions)
      ? effectivePermissions
      : typeof effectivePermissions === 'string'
        ? [effectivePermissions]
        : []
  ).filter((p): p is string => Boolean(p && p.trim()));

  if (list.length === 0) {
    return children ? <>{children}</> : <Outlet />;
  }

  const allowed = mode === 'all'
    ? list.every((p) => hasPermission(p))
    : list.some((p) => hasPermission(p));

  if (!allowed) {
    if (redirectTo) {
      return <Navigate to={redirectTo} replace />;
    }
    return fallback ? <>{fallback}</> : <ForbiddenPage />;
  }

  return children ? <>{children}</> : <Outlet />;
}
