import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@LibSoft/shared-types';
import { useAuthStore } from '@/app/store/auth.store';
import { authApi, type LoginRequest } from '@/features/auth/api/auth.api';

export type PermissionMap = Record<string, Record<string, boolean>>;

export type AuthUser = User & {
  roleId?: string | number;
  roleName?: string;
  permissions?: PermissionMap;
};

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function asAuthUser(user: User): AuthUser {
  return user as AuthUser;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const user = useAuthStore((state) => state.user) as AuthUser | null;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.logout);
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      const loggedUser = asAuthUser(response.user);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  }, [setUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearUser();
    }
  }, [clearUser]);

  const refreshUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentUser = await authApi.me();
      setUser(asAuthUser(currentUser));
    } catch {
      clearUser();
    } finally {
      setIsLoading(false);
    }
  }, [clearUser, setUser]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void refreshUser();
  }, [isAuthenticated, refreshUser]);

  const hasPermission = useCallback(
    (permission: string) => {
      const [moduleName, action] = permission.split('.');
      return Boolean(moduleName && action && user?.permissions?.[moduleName]?.[action]);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, isAuthenticated, isLoading, login, logout, refreshUser, hasPermission }),
    [user, isAuthenticated, isLoading, login, logout, refreshUser, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

