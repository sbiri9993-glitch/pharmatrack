import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

let savedLang = 'en';
try {
  savedLang = localStorage.getItem('pharmatrack-lang') || 'en';
} catch {}

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        scanner: {
          title: 'Scan Medicine',
          alignCode: 'Point at the QR code or barcode on the packaging',
        },
        results: { scanAgain: 'Scan Another' },
      },
    },
    fr: {
      translation: {
        scanner: {
          title: 'Scanner Médicament',
          alignCode: 'Pointez sur le code QR ou code-barres',
        },
        results: { scanAgain: 'Scanner un autre' },
      },
    },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
