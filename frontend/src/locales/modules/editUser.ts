export const en = {
  section: 'edit user',
  subtitle: 'manage the profile of the selected user',

  loading: {
    error: 'an error occurred while loading the user',
  },

  personalInfo: {
    section: 'personal information',
    inputs: {
      firstName: {
        label: 'first name',
        placeholder: 'e.g.: Juan',
        error: {
          required: 'first name is required',
          too_long: 'first name is too long',
          only_letters: 'first name must contain only letters',
        },
      },
      lastName: {
        label: 'last name',
        placeholder: 'e.g.: Perez',
        error: {
          required: 'last name is required',
          too_long: 'last name is too long',
          only_letters: 'last name must contain only letters',
        },
      },
      address: {
        label: 'address',
        placeholder: 'e.g.: Av. Hipolito Yrigoyen 1701',
        error: {
          required: 'address is required',
        },
      },
      dni: {
        label: 'DNI (read only)',
      },
    },
  },
  contactInfo: {
    section: 'contact information',
    inputs: {
      email: {
        label: 'email',
        placeholder: 'e.g.: esteban.ortega@gmail.com',
        error: {
          required: 'email is required',
          invalid_format: 'email is invalid',
        },
      },
      phone: {
        label: 'phone',
        placeholder: 'e.g.: 11-2345-6789',
        error: {
          required: 'phone number is required',
          too_short: 'phone number is too short',
          too_long: 'phone number is too long',
        },
      },
    },
  },
  accountStatus: {
    section: 'account status',
    warning: "a user's status can only be modified by another user with the administrator role.",
  },
  accountSettings: {
    section: 'account settings',
    inputs: {
      username: {
        label: 'username',
        placeholder: 'e.g.: john_librarian',
        error: {
          required: 'username is required',
          too_short: 'username is too short',
          too_long: 'username is too long',
          invalid_characters: 'username can only contain letters, numbers and underscores',
        },
      },
      role: {
        label: 'role',
        placeholder: 'e.g.: user',
        error: {
          required: 'role is required',
          invalid_type: 'role is invalid',
        },
      },
    },
  },

  saveChanges: 'save changes',
  cancel: 'cancel',
} as const;

export const es = {
  section: 'editar usuario',
  subtitle: 'administrar el perfil del usuario seleccionado',

  personalInfo: {
    section: 'informacion personal',
    inputs: {
      firstName: {
        label: 'nombre',
        placeholder: 'e.g.: Juan',
        error: {
          required: 'el nombre es requerido',
          too_long: 'el nombre es muy largo',
          only_letters: 'el nombre solo puede contener letras',
        },
      },
      lastName: {
        label: 'apellido',
        placeholder: 'e.g.: Perez',
        error: {
          required: 'el apellido es requerido',
          too_long: 'el apellido es muy largo',
          only_letters: 'el apellido solo puede contener letras',
        },
      },
      address: {
        label: 'direccion',
        placeholder: 'e.g.: Av. Hipolito Yrigoyen 1701',
        error: {
          required: 'la dirección es requerida',
        },
      },
      dni: {
        label: 'DNI (solo lectura)',
      },
    },
  },
  contactInfo: {
    section: 'informacion de contacto',
    inputs: {
      email: {
        label: 'correo electrónico',
        placeholder: 'e.g.: esteban.ortega@gmail.com',
        error: {
          required: 'el correo electrónico es requerido',
          invalid_format: 'el correo electrónico es inválido',
        },
      },
      phone: {
        label: 'teléfono',
        placeholder: 'e.g.: 11-2345-6789',
        error: {
          required: 'el teléfono es requerido',
          too_short: 'el teléfono es muy corto',
          too_long: 'el teléfono es muy largo',
        },
      },
    },
  },
  accountStatus: {
    section: 'estado de la cuenta',
    warning: "el estado de un usuario solo puede ser modificado por otro usuario con el rol de administrador.",
  },
  accountSettings: {
    section: 'configuración de la cuenta',
    inputs: {
      username: {
        label: 'nombre de usuario',
        placeholder: 'e.g.: juan_bibliotecario',
        error: {
          required: 'nombre de usuario es requerido',
          too_short: 'nombre de usuario es muy corto',
          too_long: 'nombre de usuario es muy largo',
          invalid_characters: 'nombre de usuario solo puede contener letras, números y guiones bajos',
        },
      },
      role: {
        label: 'rol',
        placeholder: 'e.g.: usuario',
        error: {
          required: 'rol es requerido',
          invalid_type: 'rol es inválido',
        },
      },
    },
  },

  saveChanges: 'guardar cambios',
  cancel: 'cancelar',
} as const;