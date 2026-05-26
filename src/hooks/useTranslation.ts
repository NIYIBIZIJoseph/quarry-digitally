// src/hooks/useTranslation.ts
import { useLanguage } from '@/contexts/LanguageContext';

export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}