export const en = {
  badge: 'Access Control & RBAC',
  subtitleSystem: 'LibSoft Security',
  searchPlaceholder: 'Search role by name or description...',
  filterAll: 'All',
  filterWithUsers: 'With Users',
  filterAdmin: 'Administrative',
  dashboard: {
    title: 'Roles Dashboard',
    subtitle: 'Monitor role hierarchy, assigned users, and granular permission scope across the system.',
    totalRoles: 'Total Roles',
  },
  metrics: {
    totalRoles: 'Total Roles',
    activeStatus: 'Active',
    rolesConfiguredSubtitle: 'Configured in the database',
    totalPermissions: 'Actions & Permissions',
    capabilities: 'capabilities',
    permissionsSubtitle: 'Distributed across all modules',
    assignedUsers: 'System Users',
    registeredAccounts: 'registered accounts',
    usersSubtitle: 'With assigned role and permissions',
    securityLevel: 'Security',
    rbacActive: 'RBAC Active',
    securitySubtitle: 'Granular access control by module',
  },
  actions: {
    addRole: 'add',
    refresh: 'Refresh',
    editMatrix: 'Permissions',
    edit: 'Configure',
    editShort: 'Edit',
    clearFilters: 'Clear filters',
    goToMatrix: 'Go to Permissions Matrix',
    retry: 'Retry',
  },
  filters: {
    searchPlaceholder: 'Search role by name or description...',
    all: 'All',
    withUsers: 'With Users',
    admin: 'Administrative',
    showingRole: 'Showing {{count}} role',
    showingRoles: 'Showing {{count}} roles',
    viewCards: 'Cards View',
    viewTable: 'Table View',
  },
  card: {
    system: 'System',
    custom: 'Custom',
    rootTag: 'Root',
    noDescription: 'No detailed description for this user role.',
    activePermissions: 'Active permissions',
    assignedUsersCount: 'Assigned users ({{count}})',
    noUsers: 'No users currently linked',
    moreUsers: '+{{count}} more',
    userRoleFallback: 'User',
    level: 'Level {{level}}',
    levelFull: 'Full',
    levelStandard: 'Standard',
  },
  table: {
    role: 'Role',
    type: 'Type',
    description: 'Description',
    permissions: 'Permissions Coverage',
    users: 'Users',
    actions: 'Actions',
  },
  states: {
    loading: 'Loading roles and privileges...',
    emptyTitle: 'No roles found',
    emptySubtitle: 'No roles match the selected search or filter criteria.',
    errorTitle: 'Error loading roles',
    errorMessage: 'Could not retrieve system roles and permissions. Please try again.',
    errorMessageCards: 'Could not load role cards. Please try again.',
    errorMessageTable: 'Could not load the roles table. Please try again.',
  },
  banner: {
    title: 'How does permission assignment work?',
    description: 'Each role groups specific permissions organized by module (Books, Loans, Users, etc.). Any changes in the matrix take effect immediately.',
    cta: 'Go to Permissions Matrix',
  },
  sidebar: {
    dashboard: 'Dashboard',
    editPermissions: 'Permissions',
    title: 'Roles & Access',
    backToSettings: 'Back to Settings',
  },
  addPage: {
    title: 'Add Role',
    subtitle: 'Enter the necessary information to add a new role to the system.',
    inputs: {
      slug: {
        label: 'Role Name',
        placeholder: 'Eg: Catalog Editor',
        errors: {
          required: 'Role Name is required',
          too_short: 'Role Name is too short',
          too_long: 'Role Name is too long',
        },
      },
      translation: {
        errors: {
          atLeastOneTranslationRequired: "At least one translation is required",
        },
        name: {
          errors: {
            required: 'name translation is required',
            too_long: 'name translation is {{count}} characters maximum length'
          }
        },
        description: {
          errors: {
            too_long: 'description is {{count}} characters maximum length'
          }
        }
      }
    },
    addLanguage: "Add Language",
    nameTranslations: "Role Translations",
  },
  permissionsMatrix: {
    errors: {
      failedToLoad: "Failed to load the permissions matrix. Please try again.",
    },
    loading: "Loading permissions matrix...",
  }
} as const;

export const es = {
  badge: 'Control de Acceso y RBAC',
  subtitleSystem: 'LibSoft Security',
  searchPlaceholder: 'Buscar rol por nombre o descripción...',
  filterAll: 'Todos',
  filterWithUsers: 'Con Usuarios',
  filterAdmin: 'Administrativos',
  dashboard: {
    title: 'Dashboard de Roles',
    subtitle: 'Supervisá la jerarquía de roles, los usuarios asignados y el alcance granular de permisos en todo el sistema.',
    totalRoles: 'Roles Totales',
  },
  metrics: {
    totalRoles: 'Roles Totales',
    activeStatus: 'Activos',
    rolesConfiguredSubtitle: 'Configurados en la base de datos',
    totalPermissions: 'Acciones & Permisos',
    capabilities: 'capacidades',
    permissionsSubtitle: 'Distribuidas en todos los módulos',
    assignedUsers: 'Usuarios del Sistema',
    registeredAccounts: 'cuentas registradas',
    usersSubtitle: 'Con rol y permisos asignados',
    securityLevel: 'Seguridad',
    rbacActive: 'RBAC Activo',
    securitySubtitle: 'Control de acceso granular por módulo',
  },
  actions: {
    addRole: 'agregar',
    refresh: 'Actualizar',
    editMatrix: 'Permisos',
    edit: 'Configurar',
    editShort: 'Editar',
    clearFilters: 'Limpiar filtros',
    goToMatrix: 'Ir a la Matriz de Permisos',
    retry: 'Reintentar',
  },
  filters: {
    searchPlaceholder: 'Buscar rol por nombre o descripción...',
    all: 'Todos',
    withUsers: 'Con Usuarios',
    admin: 'Administrativos',
    showingRole: 'Mostrando {{count}} rol',
    showingRoles: 'Mostrando {{count}} roles',
    viewCards: 'Vista en Tarjetas',
    viewTable: 'Vista en Tabla',
  },
  card: {
    system: 'Sistema',
    custom: 'Personalizado',
    rootTag: 'Root',
    noDescription: 'Sin descripción detallada para este rol de usuario.',
    activePermissions: 'Permisos activos',
    assignedUsersCount: 'Usuarios asignados ({{count}})',
    noUsers: 'Sin usuarios vinculados actualmente',
    moreUsers: '+{{count}} más',
    userRoleFallback: 'Usuario',
    level: 'Nivel {{level}}',
    levelFull: 'Completo',
    levelStandard: 'Estándar',
  },
  table: {
    role: 'Rol',
    type: 'Tipo',
    description: 'Descripción',
    permissions: 'Cobertura Permisos',
    users: 'Usuarios',
    actions: 'Acciones',
  },
  states: {
    loading: 'Cargando roles y privilegios...',
    emptyTitle: 'No se encontraron roles',
    emptySubtitle: 'No hay roles que coincidan con los criterios de búsqueda o filtro seleccionados.',
    errorTitle: 'Error al cargar roles',
    errorMessage: 'No se pudieron obtener los roles y privilegios del sistema. Por favor, intentá nuevamente.',
    errorMessageCards: 'No se pudieron cargar las tarjetas de roles. Por favor, intentá nuevamente.',
    errorMessageTable: 'No se pudieron cargar los roles en la tabla. Por favor, intentá nuevamente.',
  },
  banner: {
    title: '¿Cómo funciona la asignación de permisos?',
    description: 'Cada rol agrupa permisos específicos organizados por módulo (Libros, Préstamos, Usuarios, etc.). Cualquier cambio en la matriz se aplica de inmediato.',
    cta: 'Ir a la Matriz de Permisos',
  },
  sidebar: {
    dashboard: 'Dashboard',
    editPermissions: 'Permisos',
    title: 'Roles & Accesos',
    backToSettings: 'Volver a Ajustes',
  },
  addPage: {
    title: 'Agregar Rol',
    subtitle: 'Ingresá la información necesaria para agregar un nuevo rol al sistema.',
    inputs: {
      slug: {
        label: 'Nombre del Rol',
        placeholder: 'Ej: Editor de Catálogo',
        errors: {
          required: 'El nombre del rol es requerido',
          too_short: 'El nombre del rol es muy corto',
          too_long: 'El nombre del rol es muy largo',
        },
      },
      translation: {
        errors: {
          atLeastOneTranslationRequired: "Se requiere al menos una traducción",
        },
        name: {
          errors: {
            required: 'la traducción del nombre es requerida',
            too_long: 'la traducción del nombre tiene un máximo de {{count}} caracteres'
          }
        },
        description: {
          errors: {
            too_long: 'la descripción tiene un máximo de {{count}} caracteres'
          }
        }
      }
    },
    addLanguage: "Agregar Idioma",
    nameTranslations: "Traducciones del Rol",
  },
  permissionsMatrix: {
    errors: {
      failedToLoad: "Error al cargar la matriz de permisos. Por favor, intentá nuevamente.",
    },
    loading: "Cargando matriz de permisos...",
  }
} as const;
