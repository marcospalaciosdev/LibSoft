export const en = {
  section: 'settings',
  title: 'system configuration',
  description: 'configure and manage global parameters and your library security',

  libraryProfile: {
    title: 'library profile',
    subtitle: 'general information and contact details',
    save: 'save profile',
    errors: {
      failedToLoad: 'failed to load library profile'
    },
    inputs: {
      libraryName: {
        label: 'library name',
        placeholder: 'My library',
        errors: {
          required: 'library name is required',
        },
      },
      primaryEmail: {
        label: 'primary email',
        placeholder: 'mylibrary@libsoft.com',
        errors: {
          required: 'primary email is required',
          invalid_email: 'invalid primary email',
        },
      },
      phoneNumber: {
        label: 'phone number',
        placeholder: '+54 9 11 1234-5678',
        errors: {
          required: 'phone number is required',
        },
      },
      address: {
        label: 'address',
        placeholder: 'Av. Example 1234',
        errors: {
          required: 'address is required',
        },
      },
    },
    formSuccessMessage: 'perfil guardado exitosamente',
  },

  preferences: {
    title: 'preferences',
    inputs: {
      language: 'system language',
      timeZone: 'time zone',
      emailNotifications: 'email notifications',
      overdueAlerts: 'overdue alerts',
    },
  },

  rules: {
    title: 'loan & policy rules',
    subtitle: 'operational constraints for circulation',
    maxBooks: 'max books',
    items: 'items',
    gracePeriod: 'grace period',
    maxDuration: 'max duration',
  },

  security: {
    title: 'security & roles',
    subtitle: 'define access levels for library staff',
    roleName: 'role name',
    addRole: 'add role',
    editRolePanel: {
      name: 'Edit roles'
    },
    addRolePanel: {
      name: 'Add role'
    },
    errors: {
      failedToLoad: 'failed to load roles'
    },
    roles: {
      admin: {
        title: 'administrator',
        description: 'full access to all features and configurations',
      },
      assistant: {
        title: 'assistant',
        description: 'view inventory, perform loans and returns',
      },
      librarian: {
        title: 'librarian',
        description: 'manage inventory, users and loans',
      },
    },
  },

  appearance: {
    title: 'appearance',
    subtitle: "manage the platform's appearance",
    theme: {
      title: 'theme',
      options: {
        light: 'light mode',
        dark: 'dark mode',
        nord: 'artic nord',
        system: 'system',
        'high-contrast': 'high contrast',
        sepia: 'sepia',
        'emerald-dark': 'emerald dark',
        dracula: 'dracula pro',
      },
    },
    accent: {
      title: 'accent color',
    },
  },
} as const;

export const es = {
  section: 'configuración',
  title: 'configuración del sistema',
  description: 'configure y administre los parámetros globales y la seguridad de su biblioteca',

  libraryProfile: {
    title: 'perfil de la biblioteca',
    subtitle: 'información general y datos de contacto',
    save: 'guardar perfil',
    errors: {
      failedToLoad: 'fallo la carga del perfil de su biblioteca'
    },
    inputs: {
      libraryName: {
        label: 'nombre de la biblioteca',
        placeholder: 'Mi biblioteca',
        errors: {
          required: 'el nombre de la biblioteca es requerido',
        },
      },
      primaryEmail: {
        label: 'correo electrónico principal',
        placeholder: 'mibiblioteca@gmail.com',
        errors: {
          required: 'el correo electrónico principal es requerido',
          invalid_email: 'el correo electrónico principal es inválido',
        },
      },
      phoneNumber: {
        label: 'número de teléfono',
        placeholder: '+54 9 11 1234-5678',
        errors: {
          required: 'el número de teléfono es requerido',
        },
      },
      address: {
        label: 'dirección',
        placeholder: 'Av. Ejemplo 123',
        errors: {
          required: 'la dirección es requerida',
        },
      },
    },
    formSuccessMessage: 'perfil guardado exitosamente',
  },

  preferences: {
    title: 'preferencias',
    inputs: {
      language: 'idioma del sistema',
      timeZone: 'zona horaria',
      emailNotifications: 'notificaciones por correo',
      overdueAlerts: 'alertas de vencimiento',
    },
  },

  rules: {
    title: 'reglas y políticas de préstamo',
    subtitle: 'restricciones operativas para la circulación',
    maxBooks: 'máx. libros',
    items: 'ítems',
    gracePeriod: 'período de gracia',
    maxDuration: 'duración máxima',
  },

  security: {
    title: 'seguridad y roles',
    subtitle: 'defina niveles de acceso para el personal de la biblioteca',
    roleName: 'nombre del rol',
    addRole: 'agregar rol',
    editRolePanel: {
      name: 'editar roles'
    },
    addRolePanel: {
      name: 'agregar rol'
    },
    errors: {
      failedToLoad: 'fallo la carga de los roles'
    },
    roles: {
      admin: {
        title: 'administrador',
        description: 'acceso completo a todas las funciones y configuraciones',
      },
      assistant: {
        title: 'asistente',
        description: 'ver inventario, realizar préstamos y devoluciones',
      },
      librarian: {
        title: 'bibliotecario',
        description: 'gestionar inventario, usuarios y préstamos',
      },
    },
  },

  appearance: {
    title: 'apariencia',
    subtitle: 'gestiona la apariencia de la plataforma',
    theme: {
      title: 'tema',
      options: {
        light: 'modo claro',
        dark: 'modo oscuro',
        nord: 'nordico artico',
        system: 'sistema',
        'high-contrast': 'alto contraste',
        sepia: 'sepia',
        'emerald-dark': 'esmeralda oscuro',
        dracula: 'dracula pro',
      },
    },
    accent: {
      title: 'color de acento',
    },
  },
} as const;
