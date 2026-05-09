import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import * as RNLocalize from 'react-native-localize';

import en from '../locales/en.json';
import ru from '../locales/ru.json';
import uk from '../locales/uk.json';

const resources = {
  en: {translation: en},
  ru: {translation: ru},
  uk: {translation: uk},
};

const best = RNLocalize.findBestLanguageTag(Object.keys(resources));
const lng = best?.languageTag.split('-')[0] ?? 'en';

void i18n.use(initReactI18next).init({
  resources,
  lng,
  fallbackLng: 'en',
  interpolation: {escapeValue: false},
  compatibilityJSON: 'v4',
  // RN без обёртки <Suspense>: при true useTranslation «подвешивает» дерево → белый экран
  react: {
    useSuspense: false,
  },
});

export default i18n;
