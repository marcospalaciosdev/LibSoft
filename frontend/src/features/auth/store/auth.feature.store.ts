import { create } from 'zustand';
import type { User } from '@LibSoft/shared-types';

interface AuthFeatureState {
  loginError: string | null;
  isSubmitting: boolean;

  setLoginError: (error: string | null) => void;
  setSubmitting: (submitting: boolean) => void;
  reset: () => void;
}

export const useAuthFeatureStore = create<AuthFeatureState>()((set) => ({
  loginError: null,
  isSubmitting: false,

  setLoginError: (loginError) => set({ loginError }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  reset: () => set({ loginError: null, isSubmitting: false }),
}));


export type { User };
