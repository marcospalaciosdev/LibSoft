import { create } from 'zustand';
import type { Loan } from '@LibSoft/shared-types';

interface LoansState {
  loans: Loan[];
  selectedLoan: Loan | null;
  isLoading: boolean;
  error: string | null;

  setLoans: (loans: Loan[]) => void;
  setSelectedLoan: (loan: Loan | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addLoan: (loan: Loan) => void;
  updateLoan: (id: string, data: Partial<Loan>) => void;
  removeLoan: (id: string) => void;
}

export const useLoansStore = create<LoansState>()((set) => ({
  loans: [],
  selectedLoan: null,
  isLoading: false,
  error: null,

  setLoans: (loans) => set({ loans }),
  setSelectedLoan: (selectedLoan) => set({ selectedLoan }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addLoan: (loan) => set((state) => ({ loans: [...state.loans, loan] })),
  updateLoan: (id, data) =>
    set((state) => ({
      loans: state.loans.map((l) => (l.id === id ? { ...l, ...data } : l)),
    })),
  removeLoan: (id) =>
    set((state) => ({
      loans: state.loans.filter((l) => l.id !== id),
    })),
}));
