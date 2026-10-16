export const en = {
  section: 'audit',
  description: 'register of all operations performed in the system.',

  loading: 'loading audit logs',
  errorLoadingLogs: 'error loading audit logs.',

  tab: {
    visibilityButtonToolTip: 'view audit payload...',
    cols: {
      user: 'user',
      module: 'module',
      action: 'action',
      username: 'user',
      date: 'date',
      ipAddress: 'Origin / IP',
      actions: 'actions',
    },
  },

  modules: {
    all: 'all modules',
    borrowers: 'borrowers',
    books: 'books',
    loans: 'loans',
    auth: 'authentication',
    audit: 'audit',
    library_profile: 'library profile',
    users: 'users',
    settings: 'settings',
    book_copies: 'book copies',
  },

  operations: {
    all: 'all operations',
    create: 'creation',
    update: 'update',
    delete: 'delete',
    login: 'login',
    logout: 'logout',
    register: 'register',
    restore: 'restoration',
    return: 'return',
  },
} as const;

export const es = {
  section: 'auditoría',
  description: 'registro de todas las operaciones realizadas en el sistema.',

  loading: 'cargando logs de auditoría...',
  errorLoadingLogs: 'error al cargar los logs de auditoría.',

  tab: {
    visibilityButtonToolTip: 'ver payload de auditoría',
    cols: {
      user: 'usuario',
      module: 'módulo',
      action: 'acción',
      username: 'usuario',
      date: 'fecha',
      ipAddress: 'Origen / IP',
      actions: 'acciones',
    },
  },

  modules: {
    all: 'todos los modulos',
    borrowers: 'socios',
    books: 'libros',
    loans: 'prestamos',
    auth: 'autenticación',
    audit: 'auditoría',
    library_profile: 'perfil de la biblioteca',
    users: 'usuarios',
    settings: 'configuración',
    book_copies: 'copias de libros',
  },

  operations: {
    all: 'todas las operaciones',
    create: 'creación',
    update: 'modificación',
    delete: 'eliminación',
    login: 'inicio de sesión',
    logout: 'cerrar sesión',
    register: 'registro',
    restore: 'restauración',
    return: 'retorno',
  },
} as const;
