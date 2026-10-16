import { create } from 'zustand';
import type { BorrowerDTO } from '@LibSoft/shared-types';

interface BorrowersState {
  borrowers: BorrowerDTO[];
  selectedBorrower: BorrowerDTO | null;
  isLoading: boolean;
  error: string | null;

  setBorrowers: (borrowers: BorrowerDTO[]) => void;
  setSelectedBorrower: (borrower: BorrowerDTO | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addBorrower: (borrower: BorrowerDTO) => void;
  updateBorrower: (id: string, data: Partial<BorrowerDTO>) => void;
  removeBorrower: (id: string) => void;
}

export const useBorrowersStore = create<BorrowersState>()((set) => ({
  borrowers: [],
  selectedBorrower: null,
  isLoading: false,
  error: null,

  setBorrowers: (borrowers) => set({ borrowers }),
  setSelectedBorrower: (selectedBorrower) => set({ selectedBorrower }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addBorrower: (borrower) => set((state) => ({ borrowers: [...state.borrowers, borrower] })),
  updateBorrower: (id, data) =>
    set((state) => ({
      borrowers: state.borrowers.map((b) => (b.id === id ? { ...b, ...data } : b)),
    })),
  removeBorrower: (id) =>
    set((state) => ({
      borrowers: state.borrowers.filter((b) => b.id !== id),
    })),
}));
