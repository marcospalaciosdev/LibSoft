export type DeweyStatus = "in_use" | "discontinued" | "unassigned";

export interface DeweyClassificationDto {
    code: string;
    name: string;
    status: DeweyStatus;
}

export interface GetUDCListParams {
    lang: string;
    searchTerm?: string;
    min?: string | number;
    max?: string | number;
    range?: { min?: number; max?: number };
    includeUnassigned?: boolean;
    includeDiscontinued?: boolean;
    page: number;
    limit: number;
}

export interface GetUDCAmountParams {
    lang?: string;
    searchTerm?: string;
    min?: string | number;
    max?: string | number;
    range?: { min?: number; max?: number };
    includeUnassigned?: boolean;
    includeDiscontinued?: boolean;
}

export interface CategoryFrequencyResponse {
    categoryId: string;
    categoryName: string;
    booksAmount: number;
}