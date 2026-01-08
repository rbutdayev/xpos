import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend) // Use HTTP backend for lazy loading
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'az',
    defaultNS: 'common',
    ns: ['common', 'auth', 'products', 'sales', 'customers', 'inventory', 'reports', 'settings', 'dashboard', 'expenses', 'suppliers', 'users', 'rentals', 'services', 'integrations', 'giftcards', 'orders', 'knowledge'],

    backend: {
      // Load translations from public/locales directory
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      // Allow cross-origin requests (for dev server)
      crossDomain: false,
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',

    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    react: {
      useSuspense: false, // Disable suspense for React
    },

    // Show translation key if translation is missing (for development)
    saveMissing: false,
    missingKeyHandler: (lng, ns, key) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn(`Missing translation key: ${key} in ${lng}/${ns}`);
      }
    },

    // Fallback behavior for missing translations
    returnNull: false, // Return key instead of null
    returnEmptyString: false, // Return key instead of empty string
    returnObjects: false, // Don't return objects as translation

    // Supported languages
    supportedLngs: ['en', 'az'],
    nonExplicitSupportedLngs: false,

    // Load behavior
    load: 'languageOnly', // Load only language (not region-specific like en-US)

    // Preload languages for common namespace (others loaded on-demand)
    preload: ['en', 'az'],

    // Partitioned loading - namespaces are loaded on-demand when accessed
    partialBundledLanguages: true,
  });

export default i18n;
