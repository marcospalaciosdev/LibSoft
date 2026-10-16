import { httpClient } from "@/shared/services/http"

export const languagesApi = {
    getAvailableLanguages: () => httpClient.get<{
        code: string;
        name: string;
    }[]>('/languages'),
}