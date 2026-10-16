import { create } from 'zustand';
import type { Book } from '@LibSoft/shared-types';

interface BooksState {
  books: Book[];
  selectedBook: Book | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;

  setBooks: (books: Book[]) => void;
  setSelectedBook: (book: Book | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  addBook: (book: Book) => void;
  updateBook: (id: string, data: Partial<Book>) => void;
  removeBook: (id: string) => void;
}

export const useBooksStore = create<BooksState>()((set) => ({
  books: [],
  selectedBook: null,
  isLoading: false,
  error: null,
  searchQuery: '',

  setBooks: (books) => set({ books }),
  setSelectedBook: (selectedBook) => set({ selectedBook }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  addBook: (book) => set((state) => ({ books: [...state.books, book] })),

  updateBook: (id, data) =>
    set((state) => ({
      books: state.books.map((b) => (b.id === id ? { ...b, ...data } : b)),
    })),

  removeBook: (id) =>
    set((state) => ({
      books: state.books.filter((b) => b.id !== id),
    })),
}));
