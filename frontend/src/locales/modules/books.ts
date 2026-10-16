export const en = {
  section: 'books',
  availability: 'availability',
  inventoryNumber: 'inventory number',
  topographicSubject: 'topographic subject',
  description: 'editorial control and organization of physical and digital collections',
  addBook: 'add book',
  byCategory: 'books by category',
  searchPlaceholder: 'search books, keywords, ISBN...',
  timesBorrowed: 'times borrowed',
  loadingUnitBreakdown: 'loading unit breakdown',

  errors: {
    failedToGetBorrowedMetrics: 'an error occurred while retrieving the percentage of loaned copies.',
    failedToGetCategoriesFrecuency: 'An error occurred while retrieving the category distribution data.'
  },

  copies: '{{count}} copy',
  copies_other: '{{count}} copies',

  noBooksMessage: 'no book titles found or they were deleted.',

  actions: {
    editBook: 'edit book',
    deleteBook: 'delete book',
    deleteCopy: 'delete copy',
    editCopy: 'edit copy',
    addCopy: 'add copy',
  },

  emptyTable: {
    title: 'no books found',
    subtitle: 'try adjusting your search',
  },

  cannotDeleteBookModal: {
    title: 'cannot delete book',
    is_loaned_message_one: 'has one copy currently loaned.',
    is_loaned_message_other: 'has {{count}} copies currently loaned.',
    return_copies_message: 'return all copies before deleting the book',
  },

  AddBookPage: {
    title: 'add new book',
    subtitle: '',

    inputs: {
      title: {
        label: 'title',
        placeholder: 'e.g.: One Hundred Years of Solitude',
        errors: {
          required: 'the title is required.',
        },
      },
      author: {
        label: 'author',
        placeholder: 'e.g.: Gabriel García Márquez',
        errors: {
          required: 'the author is required.',
        },
      },
      isbn: {
        label: 'ISBN',
        placeholder: 'e.g.: 978-0-06-088328-7',
        errors: {
          required: 'the ISBN is required.',
          invalid_format: 'the ISBN is invalid.',
        },
      },
      category: {
        label: 'category',
        placeholder: 'open UDC Modal',
        errors: {
          required: 'the category is required.',
        },
      },
      editionDate: {
        label: 'edition date',
        placeholder: 'e.g.: 1967',
        errors: {
          required: 'the edition date is required.',
        },
      },
      publisher: {
        label: 'publisher',
        placeholder: 'e.g.: Harper & Row',
        errors: {
          required: 'the publisher is required.',
        },
      },
      tags: {
        label: 'tags',
        placeholder: 'add tags (separated by comma or enter)...',
      },
      description: {
        label: 'description',
        placeholder:
          'e.g.: One Hundred Years of Solitude is a novel by Colombian author Gabriel García Márquez...',
        errors: {
          required: 'the description is required.',
        },
      },
      topographicSubject: {
        label: 'topographic subject',
        placeholder: 'e.g.: 823.914 GAR',
        errors: {
          required: 'the topographic subject is required.',
          invalid_format: 'the topographic subject is invalid.',
        },
      },
    },
  },

  manage: {
    title: 'manage book',
    subtitle: 'modify details, inventory and cover',

    edit: {
      title: 'edit book',
      subtitle: 'modify details, inventory and cover',
      discard: 'discard',
      save: 'save changes',
      cover: {
        title: 'book cover',
        upload: 'upload new image',
        formats: 'formats: JPG, PNG. Max: 2MB.',
        recommended: 'recommended: 1200x1800px.',
      },
      mainInfo: {
        title: 'main information',
        inputs: {
          title: {
            label: 'title',
            placeholder: 'enter the book title',
            errors: {
              required: 'the title is required.',
            },
          },
          author: {
            label: 'author',
            placeholder: 'author',
            errors: {
              required: 'the author is required.',
            },
          },
          isbn: {
            label: 'ISBN',
            placeholder: 'ISBN (13)',
            errors: {
              required: 'the ISBN is required.',
              invalid_format: 'the ISBN is invalid.',
            },
          },
          publisher: {
            label: 'publisher',
            placeholder: 'publisher name',
            errors: {
              required: 'the publisher is required.',
            },
          },
          topographicSubject: {
            label: 'topographic subject',
            placeholder: 'e.g.: 823.914 GAR',
            errors: {
              required: 'the topographic subject is required.',
              invalid_format: 'the topographic subject is invalid.',
            },
          },
        },
      },
      additionalDetails: {
        title: 'additional details',
        inputs: {
          category: {
            placeholder: 'e.g.: Fiction, Science',
            label: 'category',
            errors: {
              required: 'the category is required.',
            },
          },
          editionDate: {
            placeholder: 'e.g.: 1967',
            label: 'edition date',
          },
          tags: {
            label: 'keywords',
            placeholder: 'tags area',
          },
          description: {
            label: 'description',
            placeholder:
              'e.g.: One Hundred Years of Solitude is a novel by Colombian author Gabriel García Márquez...',
            errors: {
              required: 'the description is required.',
            },
          },
        },
      },
    },
    inventory: {
      loanCount: 'loan count',
      inventoryNumber: 'inventory number',
      status: 'status',
      actions: 'actions',
      noCopies: 'no copies available for this book',
      deleteConfirm:
        'This action will permanently delete the system copy. Accordingly, all records of this copy on the loans will be deleted.',
      errors: {
        required: 'the inventory number is required.',
        taken: 'this copy is already taken',
      },

      details: {
        title: 'copy details',
        bookData: {
          header: 'book information',
          fields: {
            title: 'title',
            author: 'author',
            isbn: 'ISBN',
            publisher: 'publisher',
            topographicSubject: 'topographic subject',
            category: 'category',
            editionDate: 'edition date',
            tags: 'tags',
            description: 'description',
          },
        },
        copyInformation: {
          header: 'copy information',
          inventoryNumber: 'inventory number',
          status: 'status',
        },
        loansForThisCopy: {
          header: 'loans for this copy',
        },
      },
    },
  },

  deweyModal: {
    title: 'Dewey decimal classification',
    searchPlaceholder: 'search by topic...',
  },
} as const;

export const es = {
  section: 'libros',
  availability: 'disponibilidad',
  inventoryNumber: 'número de inventario',
  topographicSubject: 'asignatura topográfica',
  description: 'control editorial y organización de la colección física y digital',
  addBook: 'agregar libro',
  byCategory: 'libros por categoría',
  searchPlaceholder: 'buscar libros, palabras clave, ISBN...',
  timesBorrowed: 'veces prestado',
  loadingUnitBreakdown: 'cargando desglose de unidades',
  deleteCopy: 'eliminar copia',

  errors: {
    failedToGetBorrowedMetrics: 'se produjo un error al obtener el porcentaje de ejemplares prestados.',
    failedToGetCategoriesFrecuency: 'se produjo un error al obtener los datos de distribucion de categorias'
  },

  actions: {
    editBook: 'editar libro',
    deleteBook: 'eliminar libro',
    deleteCopy: 'eliminar copia',
    editCopy: 'editar copia',
    addCopy: 'agregar copia',
  },

  emptyTable: {
    title: 'no hay libros encontrados',
    subtitle: 'intenta ajustar tu búsqueda',
  },

  deleteBookModal: {
    title: 'no se puede eliminar este libro',
    is_loaned_message_one: 'tiene una copia actualmente prestada.',
    is_loaned_message_other: 'tiene {{count}} copias actualmente prestadas.',
    return_copies_message: 'devuelve todos los ejemplares antes de eliminar el libro',
  },

  AddBookPage: {
    title: 'agregar nuevo libro',
    subtitle: 'rellene el formulario para crear agregar un nuevo libro al inventario.',

    inputs: {
      title: {
        label: 'título',
        placeholder: 'ej: Cien Años de Soledad',
        errors: {
          required: 'el título es obligatorio.',
        },
      },
      author: {
        label: 'autor',
        placeholder: 'ej: Gabriel García Márquez',
        errors: {
          required: 'el autor es obligatorio.',
        },
      },
      isbn: {
        label: 'ISBN',
        placeholder: 'ej: 978-0-06-088328-7',
        errors: {
          required: 'el ISBN es obligatorio.',
          invalid_format: 'el ISBN es inválido.',
        },
      },
      category: {
        label: 'categoría',
        placeholder: 'open UDC Modal',
        errors: {
          required: 'la categoría es obligatoria.',
        },
      },
      editionDate: {
        label: 'fecha de edición',
        placeholder: 'ej: 1967',
        errors: {
          required: 'la fecha de edición es obligatoria.',
        },
      },
      publisher: {
        label: 'editorial',
        placeholder: 'ej: Harper & Row',
        errors: {
          required: 'la editorial es obligatoria.',
        },
      },
      tags: {
        label: 'tags',
        placeholder: 'agrega tags (separados por coma o enter)...',
      },
      description: {
        label: 'descripción',
        placeholder:
          'ej: Cien Años de Soledad es una novela escrita por el autor colombiano Gabriel García Márquez...',
        errors: {
          required: 'la descripción es obligatoria.',
        },
      },
      topographicSubject: {
        label: 'asignatura topográfica',
        placeholder: 'ej: 823.914 GAR',
        errors: {
          required: 'la asignatura topográfica es obligatoria.',
          invalid_format: 'la asignatura topográfica es inválida.',
        },
      },
    },
  },

  editBook: {
    title: 'editar libro',
    subtitle: 'modifica los detalles, inventario y la portada',
    discard: 'descartar',
    save: 'guardar cambios',
    cover: {
      title: 'portada del libro',
      upload: 'subir nueva imagen',
      formats: 'formatos: JPG, PNG. Máx: 2MB.',
      recommended: 'recomendado: 1200x1800px.',
    },
    mainInfo: {
      title: 'información principal',
      inputs: {
        titlePlaceholder: 'ingresa el título del libro',
        titleLabel: 'título',
        authorPlaceholder: 'autor',
        authorLabel: 'autor',
        isbnPlaceholder: 'ISBN (13)',
        isbnLabel: 'ISBN',
        publisherPlaceholder: 'nombre de la editorial',
        publisherLabel: 'editorial',
        editionPlaceholder: 'ej: 1ra Edición',
        editionLabel: 'edición',
      },
    },
    additionalDetails: {
      title: 'detalles adicionales',
      inputs: {
        category: {
          categoryPlaceholder: 'ej: Ficción, Ciencia',
          categoryLabel: 'categoría',
        },
        year: {
          yearPlaceholder: 'año de publicación',
          yearLabel: 'año',
        },
        tags: {
          keywordsLabel: 'palabras clave',
          tagsArea: 'área de tags',
        },
        comingSoon: '(próximamente)',
      },
    },
    inventory: {
      title: 'inventario',
      physicalCopies: 'copias físicas',
      totalInLibrary: 'total de libros en biblioteca',
      modifyTotalPlaceholder: 'total de copias',
      modifyTotalLabel: 'modificar total',
      borrowedCopies: 'copias prestadas:',
      availableCopies: 'copias disponibles:',
      noCopies: 'no hay copias disponibles',
      deleteConfirm:
        '¿Estás seguro de que deseas eliminar esta copia? Esta acción no se puede deshacer.',
    },
  },
  deweyModal: {
    title: 'Clasificación decimal Dewey (CDU)',
    searchPlaceholder: 'busca por tema o número CDU...',
  },
} as const;
