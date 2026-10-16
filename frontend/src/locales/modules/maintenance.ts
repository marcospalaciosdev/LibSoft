export const en = {
  section: 'maintenance',
  title: 'maintenance',
  subtitle: 'data integrity management and local file repository.',
  systemBackup: {
    title: 'system backup',
    description:
      'ensure the operational continuity of your library. This process generates an encrypted package containing the relational database and the local repository of extended covers and metadata.',
    exportPasswordTitle: 'export encrypted backup',
    exportPasswordSubtitle: 'enter your password to encrypt the backup file.',
    importPasswordTitle: 'import encrypted backup',
    importPasswordSubtitle:
      'enter the password used when exporting this backup to decrypt and import it.',
    passwordLabel: 'the password for your backup file',
    exportBackup: {
      title: 'export backup',
      description: 'generate a .lsbak file ready for external storage or migration.',
      button: 'export backup',
      loading: 'exporting...',
    },
    lastBackup: {
      title: 'last backup',
      metrics: {
        date: 'date',
        size: 'size',
        integrity: 'integrity',
      },
      noData: 'no records',
    },

    export: {
      successTitle: 'backup completed',
      success: 'backup exported successfully',
      errorTitle: 'backup failed',
      error: 'backup failed',
    },
    import: {
      warning:
        'importing a backup will permanently overwrite the current database. Make sure you have a previous copy.',
      successTitle: 'restoration completed',
      success: 'database successfully restored from',
      errorTitle: 'restoration failed',
      error: 'could not restore backup:',
    },
  },

  backupHistory: {
    title: 'backup history',
    description: 'access your recent backup history to restore or manage your data',
    import: 'imported',
    export: 'exported',
    tab: {
      fields: {
        type: {
          label: 'type',
        },
        date: {
          label: 'date',
        },
        filename: {
          label: 'filename',
        },
        status: {
          label: 'status',
        },
        size: {
          label: 'size',
        },
        actions: {
          label: 'actions',
        },
      },
      errors: {
        thisFileDoesNotExists: 'this file does not exists or was moved.',
      },
    },
  },

  dataImport: {
    title: 'data import',
    description: 'import data from external sources',
    uploadFile: {
      title: 'upload file',
      description: 'upload a .lsbak file to import data',
      loading: 'restoring...',
    },
    warning:
      'Importing a backup will permanently overwrite the current database. Make sure you have a previous copy.',
  },
} as const;

export const es = {
  section: 'mantenimiento',
  title: 'mantenimiento',
  subtitle: 'gestión de integridad de datos y repositorio local de archivos.',
  systemBackup: {
    title: 'copia de seguridad del sistema',
    description:
      'garantiza la continuidad operativa de tu biblioteca. Este proceso genera un paquete encriptado que contiene la totalidad de los datos almacenados al momento de la operacion.',
    exportPasswordTitle: 'exportar copia de seguridad cifrada',
    exportPasswordSubtitle: 'ingrese su contraseña para cifrar la copia de seguridad.',
    importPasswordTitle: 'importar copia de seguridad cifrada',
    importPasswordSubtitle:
      'ingrese la contraseña utilizada al exportar este backup para descifrarlo e importarlo.',
    passwordLabel: 'la contraseña para tu archivo de respaldo',
    exportBackup: {
      title: 'exportar copia de seguridad',
      description: 'genera un archivo .lsbak listo para almacenamiento externo o migración.',
      button: 'exportar backup',
      loading: 'exportando...',
    },
    lastBackup: {
      title: 'último backup',
      metrics: {
        date: 'fecha',
        size: 'tamaño',
        integrity: 'integridad',
      },
      noData: 'sin registros',
    },
    export: {
      successTitle: 'copia de seguridad completada',
      success: 'copia de seguridad exportada exitosamente en',
      errorTitle: 'copia de seguridad fallida',
      error: 'no se pudo exportar la copia de seguridad:',
    },
    import: {
      warning:
        'al restaurar una copia de seguridad se sobreescribirán permanentemente todos los datos actuales de la base de datos de LibSoft. Esta acción no se puede deshacer. ¿Está seguro de que desea continuar?',
      successTitle: 'restauración completada',
      success: 'base de datos restaurada exitosamente desde',
      errorTitle: 'restauración fallida',
      error: 'no se pudo restaurar la copia de seguridad:',
    },
  },

  dataImport: {
    title: 'importación de datos',
    description: 'importar datos desde fuentes externas',
    uploadFile: {
      title: 'subir archivo',
      description: 'sube un archivo de backup para importar los datos',
      loading: 'restaurando...',
    },
    warning:
      'Importar una copia de seguridad sobrescribirá permanentemente la base de datos actual. Asegúrate de tener una copia previa.',
  },

  backupHistory: {
    import: 'importado',
    export: 'exportado',
    title: 'historial de copias de seguridad',
    description:
      'consulta tus copias de seguridad recientes con detalles de tipo, fecha, ubicación, estado e integridad.',
    tab: {
      fields: {
        type: {
          label: 'tipo',
        },
        date: {
          label: 'fecha',
        },
        filename: {
          label: 'nombre de archivo',
        },
        status: {
          label: 'estado',
        },
        size: {
          label: 'tamaño',
        },
        actions: {
          label: 'acciones',
        },
      },
      errors: {
        thisFileDoesNotExists: 'este archivo no existe o fue movido.',
      },
    },
  },
} as const;
