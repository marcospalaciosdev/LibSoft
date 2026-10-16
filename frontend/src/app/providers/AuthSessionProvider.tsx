import { useEffect, useState, type ReactNode } from 'react';
import { authApi } from '@/features/auth/api/auth.api';

interface AuthSessionProviderProps {
  children: ReactNode;
}

export function AuthSessionProvider({ children }: AuthSessionProviderProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const resetSession = async () => {
      try {
        await authApi.logout();
      } catch {
        return;
      } finally {
        setIsReady(true);
      }
    };

    void resetSession();
  }, []);

  if (!isReady) return null;

  return <>{children}</>;
}