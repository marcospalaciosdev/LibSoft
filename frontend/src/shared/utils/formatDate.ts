import i18n from 'i18next';


interface DateFormats {
  date: {
    short: Intl.DateTimeFormatOptions;
    long?: Intl.DateTimeFormatOptions;
  }
}


const resources: Record<string, DateFormats> = {
  'en': {
    'date': {
      'short': {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
      }
    }
  },
  'es': {
    'date': {
      'short': {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires'
      }
    }
  }
};

/**
 * Formatea una fecha en string basándose en el idioma activo actual de i18next
 * @param dateString Fecha en formato ISO string (ej: "2026-05-26T09:17:33Z")
 * @returns Fecha formateada según el locale (ej: "26/05/26" o "05/26/26")
 */
export function formatDate(dateString: string): string {
  if (!dateString) return '';

  const date = new Date(dateString);


  if (isNaN(date.getTime())) return dateString;


  const currentLanguage = i18n.language || 'es';


  const baseLanguage = currentLanguage.split('-')[0];


  const options = resources[baseLanguage]?.date.short || resources['es'].date.short;
  const timeZone = localStorage.getItem('timezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;

  return new Intl.DateTimeFormat(currentLanguage, { ...options, timeZone }).format(date);
}