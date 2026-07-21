import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';

const resources = {
  fr: {
    translation: fr,
  },
};

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3', // Fix Intl.PluralRules absent sur React Native
    resources,
    lng: 'fr', // Langue par défaut pour la V1 (Côte d'Ivoire)
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // React gère déjà le XSS
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
