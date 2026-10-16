export type SeedLanguageCode = 'en' | 'es';

export const languageSeeds: Array<{ code: SeedLanguageCode; name: string }> = [
    { code: 'es', name: 'Español' },
    { code: 'en', name: 'English' },
] as const;
