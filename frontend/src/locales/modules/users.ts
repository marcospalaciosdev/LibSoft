export const en = {
  section: 'users',
  description: 'Manage user accounts, roles, and system permissions',
  searchPlaceholder: 'Search by name, email, or username...',
  noUsersFound: 'No users found matching your criteria',
  errorLoadingUsers: 'error loading users',
  addUser: 'add user',
  tab: {
    columns: {
      fullName: 'full name',
      email: 'email',
      role: 'role',
      phone: 'phone',
      status: 'status',
      actions: 'actions',
      username: 'username',
    },
  },
  messages: {
    failedToLoad: 'error loading users',
  },

  modules: {
    books: 'books',
    loans: 'loans',
    borrowers: 'borrowers',
    users: 'users',
    maintenance: 'maintenance',
    help: 'help',
    settings: 'settings',
    audit: 'audit',
    roles: 'roles',
    library_profile: 'library profile',
  },

  permissions: {
    create: 'create',
    read: 'read',
    update: 'update',
    delete: 'delete',
    return: 'return',
    quick_return: 'quick return',
    view: 'view',
    backup: 'backup',
    restore: 'restore',
    update_status: 'update status',
  },
} as const;

export const es = {
  section: 'usuarios',
  description: 'administración de cuentas de usuario, roles y permisos en el sistema',
  searchPlaceholder: 'Buscar por nombre, correo o usuario...',
  noUsersFound: 'No se encontraron usuarios que coincidan con la búsqueda',
  errorLoadingUsers: 'error al cargar los usuarios.',
  addUser: 'agregar usuario',
  tab: {
    columns: {
      fullName: 'nombre completo',
      email: 'correo electrónico',
      role: 'rol',
      phone: 'teléfono',
      status: 'estado',
      actions: 'acciones',
      username: 'nombre de usuario',
    },
  },
  messages: {
    failedToLoad: 'error al cargar los usuarios.',
  },

  modules: {
    books: 'libros',
    loans: 'prestamos',
    borrowers: 'socios',
    users: 'usuarios',
    maintenance: 'mantenimiento',
    help: 'ayuda',
    settings: 'configuración',
    audit: 'auditoría',
    roles: 'roles',
    library_profile: 'perfil de la biblioteca',
  },

  permissions: {
    create: 'crear',
    read: 'leer',
    update: 'actualizar',
    delete: 'eliminar',
    return: 'devolver',
    quick_return: 'devolucion rapida',
    view: 'ver',
    backup: 'exportar backup',
    restore: 'importar backup',
    update_status: 'actualizar estado',
  },
} as const;
