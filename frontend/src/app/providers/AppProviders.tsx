import type { ReactNode } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/shared/components/ui/TooltipProvider';
import { AuthSessionProvider } from './AuthSessionProvider';
import { AuthProvider } from '@/context/AuthContext';

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <AuthSessionProvider>
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </AuthSessionProvider>
  );
}
