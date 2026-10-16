import topicsEn from '@/features/help/locales/topics-en.json';
import topicsEs from '@/features/help/locales/topics-es.json';

export const en = {
  section: 'help',
  title: 'help center for librarians',
  subtitle: 'user guides, frequently asked questions and system support for LibSoft.',
  faqs: {
    title: 'frequently asked questions',
    abbreviation: 'faq',
    searchPlaceholder: 'search for help topics',
    noResults: {
      title: 'no results found',
      subtitle: 'there are no frequently asked questions that match ',
    },
    searching: 'searching in the frequently asked questions...',
  },
  footer: {
    support: {
      title: 'do you still need help?',
      subtitle:
        'our IT team is available to assist you with complex technical problems or database migrations.',
      button: 'contact IT support',
    },
  },
  topics: topicsEn,
} as const;

export const es = {
  section: 'ayuda',
  title: 'centro de ayuda para bibliotecarios',
  subtitle: 'guías de uso, preguntas frecuentes y soporte del sistema LibSoft.',
  faqs: {
    title: 'preguntas frecuentes',
    abbreviation: 'faq',
    searchPlaceholder: 'buscar temas de ayuda',
    noResults: {
      title: 'no hay resultados para',
      subtitle: 'no se encontraron preguntas frecuentes que coincidan con ',
    },
    searching: 'Buscando en las preguntas frecuentes...',
  },
  footer: {
    support: {
      title: '¿Aún necesitas ayuda?',
      subtitle:
        'nuestro equipo de TI está disponible para ayudarte con problemas técnicos complejos o migraciones de bases de datos.',
      button: 'contactar soporte de TI',
    },
  },
  topics: topicsEs,
} as const;
