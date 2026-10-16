import { httpClient } from "@/shared/services/http";

import type { LibraryProfileDto } from "@LibSoft/shared-types";

export const metadataApi = {
    getLibraryProfile: () => httpClient.get<LibraryProfileDto>('/metadata/library-profile'),
    updateLibaryProfile: (data: LibraryProfileDto) => httpClient.patch<LibraryProfileDto>('/metadata/library-profile', data),
}
