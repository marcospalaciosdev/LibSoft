import { BorrowerDTO } from '../borrowers/borrowers.types';
import { LibraryProfileDto } from '../metadata/metadata.types';

const LOAN_TYPES = {
    DOMICILIARY: 'domiciliary',
    SCHOOL: 'scholastic',
} as const;

export type LoanType = typeof LOAN_TYPES[keyof typeof LOAN_TYPES];

export interface LoanItemCopy {
    id: number;
    inventoryNumber: string;
    returned: boolean;
    returnDate: string | null;
}

export interface LoanItem {
    id: number;
    title: string;
    author: string;
    year: number | null;
    category: string | null;
    copies: LoanItemCopy[];
}

export interface Loan {
    id: string;
    booksTitle: string;
    borrowerId: string;
    borrowerName: string;
    user: {
        id: string;
        firstName: string;
        lastName: string;
    }
    loanDate: string;
    dueDate: string;
    returnDate?: string;
    status: 'active' | 'overdue' | 'returned';
    type?: LoanType;
    createdAt: string;
}

export interface LoanDetail {
    id: string;
    loanDate: string;
    dueDate: string;
    maxReturnDate?: string | null;
    type: LoanType;
    status: 'active' | 'overdue' | 'returned';
    borrower: BorrowerDTO;
    createdBy: LoanCreatedBy;
    libraryProfile: LibraryProfileDto;
    items: LoanItem[];
}

export interface LoanCreatedBy {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
}

export interface CreateLoanDTO {
    itemsIds: {
        id: string;
        quantity: number;
        copyIds: string[];
    }[];
    borrowerId: string;
    loanDate: string;
    dueDate: string;
    type: LoanType;
    additionalInfo?: string;
}

export interface BorrowedMetrics {
    totalCopies: number;
    borrowedCopies: number;
    borrowedPercentage: number;
    availableCopies: number;
}

export interface ReturnMetricsByMonth {
    month: string;
    returnedOnTime: number;
    returnedLate: number;
    notReturned: number;
    totalLoans: number;
}

export interface LoanSummaryMetrics {
    totalLoans: number;
    activeLoans: number;
    returnsToday: number;
    overdueLoans: number;
    dueSoonDomiciliaryLoans: number;
    punctualityRate: number;
}

export interface GetLoanSummaryMetricsParams {
    borrowerId?: string;
    startDate?: string;
    endDate?: string;
}

export interface GetLoansParams {
    limit?: number;
    offset?: number;
    borrowerIds?: string[];
    copiesIds?: string[];
    borrowerName?: string;
    status?: 'returned' | 'overdue' | 'active';
    sortBy?: 'dueDate' | 'totalCopies' | 'loanDate';
    startDate?: Date;
    endDate?: Date;
}