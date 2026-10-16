export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const APP_NAME = 'LibSoft';
export const COMPRESSED_APP_NAME = 'LS'

export const ROUTES = {
  LOGIN: '/login',
  BOOKS: '/books',
  BOOKS_ADD: '/books/add',
  BOOKS_MANAGE: '/books/manage/:id',
  COPIES: '/copies',
  LOANS: '/loans',
  LOANS_ALL: '/loans/all',
  LOANS_NEW: '/loans/new',
  LOANS_RETURN: '/loans/return/:id',
  BORROWERS: '/borrowers',
  BORROWERS_NEW: '/borrowers/new',
  BORROWERS_MANAGE: '/borrowers/manage/:id',
  BORROWERS_REPORT: '/borrowers/report',
  USERS: '/users',
  USERS_EDIT: '/users/edit/:id',
  SETTINGS: '/settings',
  SETTINGS_ROLES: '/settings/roles',
  SETTINGS_ROLES_ADD: '/settings/roles/add',
  SETTINGS_ROLES_PERMISSIONS: '/settings/roles/permissions',
  MAINTENANCE: '/maintenance',
  AUDITORIA: '/audit',
  BUSINESS_CANVAS: '/business-canvas',
  HELP: '/help',
  DASHBOARD: '/books',
} as const;

export const ROUTE_PERMISSIONS: Record<string, string[]> = {
  [ROUTES.BOOKS]: ['books.read'],
  [ROUTES.BOOKS_ADD]: ['books.create'],
  [ROUTES.BOOKS_MANAGE]: ['books.update'],
  [ROUTES.COPIES]: ['books.read'],
  [ROUTES.LOANS]: ['loans.read'],
  [ROUTES.LOANS_ALL]: ['loans.read'],
  [ROUTES.LOANS_NEW]: ['loans.create'],
  [ROUTES.LOANS_RETURN]: ['loans.return'],
  [ROUTES.BORROWERS]: ['borrowers.read'],
  [ROUTES.BORROWERS_NEW]: ['borrowers.create'],
  [ROUTES.BORROWERS_MANAGE]: ['borrowers.update'],
  [ROUTES.BORROWERS_REPORT]: ['borrowers.read'],
  [ROUTES.USERS]: ['users.read'],
  [ROUTES.USERS_EDIT]: ['users.update'],
  [ROUTES.SETTINGS]: ['settings.read'],
  [ROUTES.SETTINGS_ROLES]: ['roles.read'],
  [ROUTES.SETTINGS_ROLES_ADD]: ['roles.create'],
  [ROUTES.SETTINGS_ROLES_PERMISSIONS]: ['roles.update'],
  [ROUTES.MAINTENANCE]: ['maintenance.read'],
  [ROUTES.AUDITORIA]: ['audit.read'],
  [ROUTES.BUSINESS_CANVAS]: [],
  [ROUTES.HELP]: [],
};

export function getRoutePermissions(path: string): string[] {
  if (ROUTE_PERMISSIONS[path]) {
    return ROUTE_PERMISSIONS[path];
  }
  for (const [routePattern, permissions] of Object.entries(ROUTE_PERMISSIONS)) {
    if (routePattern.includes(':')) {
      const regexPattern = '^' + routePattern.replace(/:[^\s/]+/g, '[^/]+') + '$';
      if (new RegExp(regexPattern).test(path)) {
        return permissions;
      }
    }
  }
  return [];
}

export const APP_BRAND_GRADIENT_CLASSNAME = 'bg-linear-to-tl from-[rgb(var(--color-primary-700))] to-[rgb(var(--color-primary-500))]'

export const DEFAULT_FRONTEND_ROUTE = ROUTES.BOOKS;

export const ROLES = {
  ADMIN: 'admin',
  LIBRARIAN: 'librarian',
  USER: 'user',
} as const;

export interface NavItem {
  section: string;
  path: string;
  icon: string;
  permissionsRequired?: string[];
}

export const MAIN_NAV_ITEMS: NavItem[] = [
  { section: 'books', path: ROUTES.BOOKS, icon: 'book', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.BOOKS] },
  { section: 'loans', path: ROUTES.LOANS, icon: 'swap_horiz', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.LOANS] },
  { section: 'borrowers', path: ROUTES.BORROWERS, icon: 'person_search', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.BORROWERS] },
  { section: 'users', path: ROUTES.USERS, icon: 'person', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.USERS] },
  { section: 'maintenance', path: ROUTES.MAINTENANCE, icon: 'build', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.MAINTENANCE] },
  { section: 'audit', path: ROUTES.AUDITORIA, icon: 'fact_check', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.AUDITORIA] },
  // { section: 'businessCanvas', path: ROUTES.BUSINESS_CANVAS, icon: 'business_center' },
  { section: 'settings', path: ROUTES.SETTINGS, icon: 'settings', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.SETTINGS] },
  { section: 'help', path: ROUTES.HELP, icon: 'help', permissionsRequired: ROUTE_PERMISSIONS[ROUTES.HELP] }
];

export function getFirstAccessibleRoute(hasPermission?: (permission: string) => boolean): string {
  if (!hasPermission) return DEFAULT_FRONTEND_ROUTE;

  const firstAllowed = MAIN_NAV_ITEMS.find((item) => {
    const required = item.permissionsRequired ?? ROUTE_PERMISSIONS[item.path];
    if (!required || required.length === 0) return true;
    return required.some((perm) => hasPermission(perm));
  });

  return firstAllowed?.path || DEFAULT_FRONTEND_ROUTE;
}

export interface THEME {
  id: string,
  name: string,
  previewClass: string,
}

export const AVAILABLE_THEMES: THEME[] = [
  { id: 'light', name: 'Modo Claro', previewClass: 'theme-preview-light' },
  { id: 'dark', name: 'Modo Oscuro', previewClass: 'theme-preview-dark' },
  { id: 'nord', name: 'Nórdico Ártico', previewClass: 'theme-preview-nord' },
  { id: 'high-contrast', name: 'Alto Contraste', previewClass: 'theme-preview-high-contrast' },
  { id: 'sepia', name: 'Sepia Lectura', previewClass: 'theme-preview-sepia' },
  { id: 'dracula', name: 'Dracula Pro', previewClass: 'theme-preview-dracula' },
];

export const DEFAULT_ACCENT_COLORS: string[] = [
  'rgb(59, 130, 246)',
  'rgb(0, 140, 69)',
  'rgb(214, 38, 83)',
  'rgb(229, 99, 68)',
  'rgb(103, 232, 249)',
  'rgb(168, 85, 247)',
]

export const FILES_ROUTES = {
  FAILED_TO_LOAD_ICON: "/src/shared/media/icons/failedToLoadIcon.png"
}