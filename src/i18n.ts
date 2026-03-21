import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import es from './locales/es.json';
import en from './locales/en.json';

const STORAGE_KEY = 'app-language';

function getSavedLanguage(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? 'es';
  } catch {
    return 'es';
  }
}

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: getSavedLanguage(),
  fallbackLng: 'es',
  interpolation: { escapeValue: false },
});

i18n.on('languageChanged', (lng) => {
  try {
    localStorage.setItem(STORAGE_KEY, lng);
  } catch {
    // ignore storage errors
  }
  document.documentElement.lang = lng === 'es' ? 'es-AR' : lng;
});

export default i18n;
