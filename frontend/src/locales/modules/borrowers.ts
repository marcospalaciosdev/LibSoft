export const en = {
  section: 'borrowers',
  description: 'manage borrowers and their loan statuses',
  searchPlaceholder: 'search by DNI, name, or email...',
  noBorrowersFound: 'no borrowers found',

  actions: {
    addBorrower: 'add borrower',
    editBorrower: 'edit borrower',
  },

  errors: {
    loadingBorrowers: 'error loading borrowers.',
  },

  manageBorrowerPage: {
    title: 'borrower management',
    subtitle: "manage the borrower's personal information, contact details, and account status",

    errors: {
      loadingBorrower: 'error loading borrower.',
      editBorrower: 'error loading borrower.',
    },

    editBorrower: {
      navLabel: 'edit',
      title: 'edit borrower profile',
      subtitle: 'update personal information, contact details, and account status',
      memberSince: 'member since',
      personalInfo: 'personal information',
      contactInfo: 'contact information',
      inputs: {
        firstName: {
          label: 'first name',
          placeholder: 'e.g., John',
          errors: {
            required: 'first name is required',
            too_long: 'first name is too long',
          },
        },
        lastName: {
          label: 'last name',
          placeholder: 'e.g., Doe',
          errors: {
            required: 'last name is required',
            too_long: 'last name is too long',
          },
        },
        dni: {
          label: 'ID',
        },
        phone: {
          label: 'phone',
          placeholder: 'e.g., 11-2345-6789',
          errors: {
            required: 'phone is required',
            invalid_format: 'phone is invalid',
            too_long: 'phone is too long',
          },
        },
        email: {
          label: 'email',
          placeholder: 'e.g., yourEmail@example.com',
          errors: {
            required: 'email is required',
            invalid_format: 'email is invalid',
            too_long: 'email is too long',
          },
        },
        address: {
          label: 'address',
          placeholder: 'e.g., Av. Hipolito Yrigoyen 1701',
          errors: {
            required: 'address is required',
            too_long: 'address is too long',
          },
        },
      },
      accountStatus: {
        title: 'account status',
        enabled: 'enabled',
        disabled: 'disabled',
        disableReasonLabel: 'disable reason',
        disableReasonPlaceholder: 'optional: indicate the reason why the account was disabled',
        warning: 'blocked accounts cannot make new loans or renewals.',
      },
      activity: {
        title: 'activity',
        totalLoans: 'total loans',
        returnedOnTime: 'returned on time',
      },
      actions: {
        addBorrower: 'add borrower',
        cancel: 'cancel',
        save: 'save changes',
      },
    },
    loans: {
      navLabel: 'loans',
      exportReport: 'export report',
    },
  },

  addBorrowerPage: {
    section: 'add borrower',
    subtitle: 'enter the complete details for the new borrower',
    personalInfo: 'personal information',
    inputs: {
      firstName: {
        label: 'first name',
        placeholder: 'e.g.: Juan',
      },
      lastName: {
        label: 'last name',
        placeholder: 'e.g.: Perez',
      },
      dni: {
        label: 'DNI',
        placeholder: 'e.g.: 12345678',
      },
      email: {
        label: 'email (optional)',
        placeholder: 'enter your email',
      },
      phone: {
        label: 'phone (optional)',
        placeholder: 'enter your phone',
      },
      address: {
        label: 'address',
        placeholder: 'e.g.: Av. Hipolito Yrigoyen 1701',
      },
    },
    submit: 'submit',
  },
} as const;

export const es = {
  section: 'socios',
  description: 'gestiona los socios y sus estados de préstamo',
  searchPlaceholder: 'buscar por DNI, nombre o email...',
  noBorrowersFound: 'no se encontraron socios',

  errors: {
    loadingBorrowers: 'error cargando a los socios.',
  },

  actions: {
    addBorrower: 'agregar socio',
    editBorrower: 'editar socio',
  },

  manageBorrowerPage: {
    title: 'gestión de socio',
    subtitle:
      'gestiona la información personal, detalles de contacto y estado de la cuenta del socio',

    editBorrower: {
      navLabel: 'editar',
      title: 'editar perfil de socio',
      subtitle: 'actualizar información personal, detalles de contacto y estado de la cuenta',
      memberSince: 'miembro desde',
      personalInfo: 'información personal',
      contactInfo: 'información de contacto',
      inputs: {
        firstName: {
          label: 'nombre',
          placeholder: 'ej: Juan',
          errors: {
            required: 'el nombre es requerido',
            too_long: 'el nombre es muy largo',
          },
        },
        lastName: {
          label: 'apellido',
          placeholder: 'ej: Pérez',
          errors: {
            required: 'el apellido es requerido',
            too_long: 'el apellido es muy largo',
          },
        },
        dni: {
          label: 'DNI',
        },
        phone: {
          label: 'teléfono',
          placeholder: 'ej: 11-2345-6789',
          errors: {
            required: 'el teléfono es requerido',
            invalid_format: 'el teléfono es inválido',
            too_long: 'el teléfono es muy largo',
          },
        },
        email: {
          label: 'correo electrónico',
          placeholder: 'ej: tuEmail@ejemplo.com',
          errors: {
            required: 'el correo electrónico es requerido',
            invalid_format: 'el correo electrónico es inválido',
            too_long: 'el correo electrónico es muy largo',
          },
        },
        address: {
          label: 'dirección',
          placeholder: 'ej: Av. Hipolito Yrigoyen 1701',
          errors: {
            required: 'la dirección es requerida',
            too_long: 'la dirección es muy larga',
          },
        },
      },
      accountStatus: {
        title: 'estado de la cuenta',
        enabled: 'habilitado',
        disabled: 'inhabilitado',
        disableReasonLabel: 'motivo de deshabilitación',
        disableReasonPlaceholder: 'opcional: indica el motivo por el que se inhabilitó la cuenta',
        warning: 'las cuentas bloqueadas no pueden realizar nuevos préstamos o renovaciones.',
      },
      activity: {
        title: 'actividad',
        totalLoans: 'préstamos totales',
        returnedOnTime: 'devueltos a tiempo',
      },
      actions: {
        addBorrower: 'agregar socio',
        cancel: 'cancelar',
        save: 'guardar cambios',
      },
    },
    loans: {
      navLabel: 'prestamos',
      exportReport: 'exportar reporte',
    },
  },

  addBorrowerPage: {
    section: 'añadir socio',
    subtitle: 'ingresa los datos completos para el nuevo socio',
    personalInfo: 'información personal',
    inputs: {
      firstName: {
        label: 'nombre',
        placeholder: 'ej: Juan',
      },
      lastName: {
        label: 'apellido',
        placeholder: 'ej: Pérez',
      },
      dni: {
        label: 'DNI',
        placeholder: 'ej: 12345678',
      },
      email: {
        label: 'correo electrónico (opcional)',
        placeholder: 'ingresa tu correo',
      },
      phone: {
        label: 'teléfono (opcional)',
        placeholder: 'ingresa tu teléfono',
      },
      address: {
        label: 'dirección',
        placeholder: 'ej: Av. Hipolito Yrigoyen 1701',
      },
    },
    submit: 'enviar',
  },
} as const;
