import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';

i18n
  // Use HTTP backend to load translations from /public/locales
  .use(HttpApi)
  // Detect user's language
  .use(LanguageDetector)
  // Pass i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Set English as the fallback language
    fallbackLng: 'en',
    debug: true, // Set to false in production
    
    // Define namespaces
    ns: ['translation'],
    defaultNS: 'translation',

    // Language detection options
    detection: {
      order: ['cookie', 'localStorage', 'navigator', 'htmlTag'],
      caches: ['cookie', 'localStorage'],
    },

    // react-i18next specific options
    react: {
      useSuspense: false, // Set to true if you want to use React Suspense
    },
    
    // Backend options for HttpApi
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    }
  });

export default i18n;