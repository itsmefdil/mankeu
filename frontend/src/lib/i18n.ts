import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enJSON from '../locales/en.json';
import idJSON from '../locales/id.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: enJSON
            },
            id: {
                translation: idJSON
            }
        },
        lng: "id", // Default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // React already safes from xss
        }
    });

export default i18n;
