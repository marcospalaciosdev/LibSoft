import { SeedLanguageCode } from "./languageSeeds";

export interface RoleSeed {
    key: string;
    type: string;
    colorRGB: string;
    names: Record<SeedLanguageCode, string>;
    descriptions: Record<SeedLanguageCode, string>;
    permissionMatcher: (moduleName: string, permissionName: string) => boolean;
}

export const roleSeeds: RoleSeed[] = [
    {
        key: 'administrator',
        type: 'default',
        colorRGB: "194, 122, 225",
        names: {
            es: 'administrador',
            en: 'administrator',
        },
        descriptions: {
            es: 'Control total del sistema, configuración, usuarios y mantenimiento.',
            en: 'Full system control, including configuration, users, and maintenance.',
        },
        permissionMatcher: () => true,
    },
    {
        key: 'librarian',
        type: 'default',
        colorRGB: "0, 212, 146",
        names: {
            es: 'bibliotecario',
            en: 'librarian',
        },
        descriptions: {
            es: 'Gestión operativa de libros, préstamos y prestatarios.',
            en: 'Operational management of books, loans, and borrowers.',
        },
        permissionMatcher: (moduleName: string, permissionName: string) => {
            const allowed: Record<string, string[]> = {
                books: ['read', 'create', 'update'],
                loans: ['read', 'create', 'return'],
                borrowers: ['read', 'create', 'update'],
                users: ['read'],
                settings: ['read'],
                help: ['read'],
            };

            return allowed[moduleName]?.includes(permissionName) ?? false;
        },
    },
    {
        key: 'assistant',
        type: 'default',
        colorRGB: "255, 185, 0",
        names: {
            es: 'asistente',
            en: 'assistant',
        },
        descriptions: {
            es: 'Acceso básico de consulta.',
            en: 'Basic read-only access.',
        },
        permissionMatcher: (moduleName: string, permissionName: string) => {
            const allowed: Record<string, string[]> = {
                books: ['read'],
                loans: ['read'],
                borrowers: ['read'],
                help: ['read'],
            };

            return allowed[moduleName]?.includes(permissionName) ?? false;
        },
    },
];