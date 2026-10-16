import { create } from 'zustand';
import type { Copy } from '../api/copies.api';

interface CopiesState {
  copies: Copy[];
  selectedCopy: Copy | null;
  isLoading: boolean;
  error: string | null;

  setCopies: (copies: Copy[]) => void;
  setSelectedCopy: (copy: Copy | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addCopy: (copy: Copy) => void;
  updateCopy: (id: string, data: Partial<Copy>) => void;
  removeCopy: (id: string) => void;
}

export const useCopiesStore = create<CopiesState>()((set) => ({
  copies: [],
  selectedCopy: null,
  isLoading: false,
  error: null,

  setCopies: (copies) => set({ copies }),
  setSelectedCopy: (selectedCopy) => set({ selectedCopy }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addCopy: (copy) => set((state) => ({ copies: [...state.copies, copy] })),
  updateCopy: (id, data) =>
    set((state) => ({
      copies: state.copies.map((c) => (c.id === id ? { ...c, ...data } : c)),
    })),
  removeCopy: (id) =>
    set((state) => ({
      copies: state.copies.filter((c) => c.id !== id),
    })),
}));
