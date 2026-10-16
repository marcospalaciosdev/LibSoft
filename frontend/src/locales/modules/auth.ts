import { APP_NAME } from '@/shared/constants';

export const en = {
  actions: {
    login: 'log in',
    logout: 'log out',
    register: 'sign in',
  },

  login: {
    errors: {
      empty: 'please fill in all fields.',
    },
    title: 'sign in',
    subtitle: 'enter your credentials to access your Libsoft account',
    inputs: {
      email: {
        label: 'email address',
        placeholder: 'e.g: admin@libsoft.com',
      },
      password: {
        label: 'password',
      },
    },
  },

  register: {
    title: 'register user',
    description:
      'assign administrative credentials for library staff and curators. Ensure information matches official ' +
      APP_NAME +
      ' documentation.',
    footer: 'developed by Marcos Palacios',
    inputs: {
      firstName: {
        label: 'First Name',
        placeholder: 'Enter first name',
        errors: {
          required: 'first name is required',
          only_letters: 'first name must contain only letters',
          max: 'first name must be less than {{count}} characters',
        },
      },
      lastName: {
        label: 'Last Name',
        placeholder: 'Enter last name',
        errors: {
          required: 'last name is required',
          only_letters: 'last name must contain only letters',
          max: 'last name must be less than {{count}} characters',
        },
      },
      username: {
        label: 'Username',
        placeholder: 'Enter username',
        errors: {
          required: 'username is required',
          invalid_characters: 'username must contain only letters, numbers and underscores',
          min: 'username must be at least {{count}} characters',
          max: 'username must be less than {{count}} characters',
        },
      },
      email: {
        label: 'Email Address',
        placeholder: 'example@mail.com',
        errors: {
          required: 'email is required',
          pattern: 'email is invalid',
          alreadyExists: 'this email is already used',
          invalid_format: 'email format is invalid',
        },
      },
      role: {
        label: 'User Role',
        placeholder: 'Select a role',
        errors: {
          required: 'role is required',
        },
      },
      phoneNumber: {
        label: 'Phone Number',
        placeholder: 'e.g., +1 555 123 4567',
        errors: {
          only_numbers: 'phone number must contain only numbers',
          required: 'phone number is required',
          pattern: 'phone number is invalid',
        },
      },
      password: {
        label: 'Password',
        placeholder: 'Create a secure password',
        subtitle:
          'Password must have at least {{count}} characters, numbers and special characters.',
        errors: {
          required: 'password is required',
          too_short: 'password must be at least {{count}} characters',
          too_long: 'password must be less than {{count}} characters',
          pattern: 'password must contain only letters, numbers and special characters',
        },
      },
    },
    button: {
      submit: 'Register User',
    },
  },

  cta: {
    login: 'log In',
    register: 'sign In',

    title: 'the best way to manage your library',
    subtitle: 'your entire collection, in one place.',
    description:
      'Organize books, loans, and users with a clear, streamlined experience designed for your team.',
    motto: 'The calm of a library, with the precision of a fine tool.',
  },
} as const;

export const es = {
  actions: {
    login: 'iniciar sesión',
    logout: 'cerrar sesión',
    register: 'registrarse',
  },

  login: {
    errors: {
      empty: 'por favor complete todos los campos.',
    },
    title: 'iniciar sesión',
    subtitle: 'ingresa tus credenciales para acceder a tu cuenta de Libsoft',
    inputs: {
      email: {
        label: 'correo electrónico',
        placeholder: 'ej: admin@libsoft.com',
      },
      password: {
        label: 'contraseña',
      },
    },
  },
  logout: 'cerrar sesión',

  register: {
    title: 'registrar usuario',

    description:
      'Asigne credenciales administrativas al personal de la biblioteca y a los curadores. Asegúrese de que la información coincida con la documentación oficial de ' +
      APP_NAME,

    footer: 'desarrollado por Marcos Palacios',

    inputs: {
      firstName: {
        label: 'Nombre',
        placeholder: 'Ingresa el nombre',
        errors: {
          only_letters: 'El nombre debe contener solo letras.',
          required: 'El nombre es requerido.',
          too_long: 'El nombre debe tener menos de {{count}} caracteres.',
        },
      },
      lastName: {
        label: 'Apellido',
        placeholder: 'Ingresa el apellido',
        errors: {
          required: 'El apellido es requerido.',
          too_long: 'El apellido debe tener menos de {{count}} caracteres.',
          only_letters: 'El apellido debe contener solo letras.',
        },
      },
      username: {
        label: 'Nombre de usuario',
        placeholder: 'Ingresa el nombre de usuario',
        errors: {
          required: 'El nombre de usuario es requerido.',
          too_short: 'El nombre de usuario debe tener al menos {{count}} caracteres.',
          too_long: 'El nombre de usuario debe tener menos de {{count}} caracteres.',
          invalid_characters:
            'El nombre de usuario debe contener solo letras, números y guiones bajos.',
        },
      },
      email: {
        label: 'Correo electrónico',
        placeholder: 'ejemplo@correo.com',
        errors: {
          required: 'El correo electrónico es requerido.',
          invalid_format: 'El correo electrónico no es válido.',
          taken: 'El correo electrónico ya está registrado.',
        },
      },
      role: {
        label: 'Rol de usuario',
        placeholder: 'Selecciona un rol',
      },
      phoneNumber: {
        label: 'Número de teléfono',
        placeholder: 'ej: +54 11 1234 5678',
        errors: {
          required: 'El número de teléfono es requerido.',
          only_numbers: 'El número de teléfono debe contener solo números.',
        },
      },
      password: {
        label: 'Contraseña',
        placeholder: 'Crea una contraseña segura',
        subtitle:
          'La contraseña debe tener minimo {{count}} caracteres, numeros y caracteres especiales.',
        errors: {
          required: 'La contraseña es requerida.',
          too_short: 'La contraseña debe tener al menos {{count}} caracteres.',
          missing_uppercase: 'La contraseña debe tener al menos una mayúscula.',
          missing_number: 'La contraseña debe tener al menos un número.',
          missing_specialChar: 'La contraseña debe tener al menos un carácter especial.',
        },
      },
    },
    button: {
      submit: 'Registrar Usuario',
    },
  },

  cta: {
    login: 'iniciar sesión',
    register: 'registrarse',

    title: 'gestiona tu biblioteca facilmente',
    subtitle: 'todo tu acervo en un solo lugar.',
    description:
      'Organiza libros, préstamos y usuarios con una experiencia clara y optimizada diseñada para tu equipo.',
    motto: 'La calma de una biblioteca, con la precision de una buena herramienta.',
  },
} as const;
