import { useSettingsStore } from '@/stores/settingsStore';
import { translations, TranslationKey } from '@/i18n/translations';

export function useTranslation() {
  const { language } = useSettingsStore();
  
  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };
  
  return { t, language };
}
