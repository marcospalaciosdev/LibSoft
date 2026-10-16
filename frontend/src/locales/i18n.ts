import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { en as language_en, es as language_es } from './modules/language';
import { en as common_en, es as common_es } from './modules/common';
import { en as books_en, es as books_es } from './modules/books';
import { en as loans_en, es as loans_es } from './modules/loans';
import { en as borrowers_en, es as borrowers_es } from './modules/borrowers';
import { en as users_en, es as users_es } from './modules/users';
import { en as editUser_en, es as editUser_es } from './modules/editUser';
import { en as businessCanvas_en, es as businessCanvas_es } from './modules/businessCanvas';
import { en as settings_en, es as settings_es } from './modules/settings';
import { en as help_en, es as help_es } from './modules/help';
import { en as maintenance_en, es as maintenance_es } from './modules/maintenance';
import { en as audit_en, es as audit_es } from './modules/audit';
import { en as auth_en, es as auth_es } from './modules/auth';
import { en as messages_en, es as messages_es } from './modules/messages';
import { en as roles_en, es as roles_es } from './modules/roles';

const resources = {
  en: {
    translation: {
      language: language_en,
      common: common_en,
      books: books_en,
      loans: loans_en,
      borrowers: borrowers_en,
      users: users_en,
      editUser: editUser_en,
      businessCanvas: businessCanvas_en,
      settings: settings_en,
      help: help_en,
      maintenance: maintenance_en,
      audit: audit_en,
      auth: auth_en,
      messages: messages_en,
      roles: roles_en,
    },
  },
  es: {
    translation: {
      language: language_es,
      common: common_es,
      books: books_es,
      loans: loans_es,
      borrowers: borrowers_es,
      users: users_es,
      editUser: editUser_es,
      businessCanvas: businessCanvas_es,
      settings: settings_es,
      help: help_es,
      maintenance: maintenance_es,
      audit: audit_es,
      auth: auth_es,
      messages: messages_es,
      roles: roles_es,
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

export const initLang = (): void => {
  const savedLanguage: string | null = localStorage.getItem('language');
  if (savedLanguage) {
    i18n.changeLanguage(savedLanguage);
  } else {
    i18n.changeLanguage('en');
  }
};
