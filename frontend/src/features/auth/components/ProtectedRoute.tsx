import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/app/store/auth.store';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/shared/constants';
import { ForbiddenPage } from '@/shared/components/feedback';

interface ProtectedRouteProps {
  children: ReactNode;
  permissions?: string | string[];
  requiredRole?: 'admin' | 'librarian' | 'user';
  mode?: 'any' | 'all';
}

export function ProtectedRoute({
  children,
  permissions,
  requiredRole,
  mode = 'any',
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const { hasPermission } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role.name !== requiredRole && user?.role.name !== 'admin') {
    return <ForbiddenPage />;
  }

  const list = (
    Array.isArray(permissions)
      ? permissions
      : typeof permissions === 'string'
        ? [permissions]
        : []
  ).filter((p): p is string => Boolean(p && p.trim()));

  if (list.length > 0) {
    const allowed = mode === 'all'
      ? list.every((p) => hasPermission(p))
      : list.some((p) => hasPermission(p));

    if (!allowed) {
      return <ForbiddenPage />;
    }
  }

  return <>{children}</>;
}

export { RequirePermission } from '@/app/router/RequirePermission';
