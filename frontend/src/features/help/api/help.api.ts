import { httpClient } from '@/shared/services/http';

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

export const helpApi = {
    getFaqsByLanguage: (language: string, searchTerm: string = '', limit: number = 10) =>
        httpClient.get<FAQ[]>(`/faqs/${language}`, {
            params: {
                searchTerm: String(searchTerm),
                limit: String(limit)
            },
        }),
    getFaqsByIds: (ids: string[], language: string) =>
        httpClient.get<FAQ[]>(`/faqs/ids/${language}`, {
            params: {
                ids: String(ids)
            },
        }),
    getFaqsByCodes: (codes: string[], language: string) =>
        httpClient.get<FAQ[]>(`/faqs/codes/${language}`, {
            params: {
                codes: String(codes)
            },
        }),
}