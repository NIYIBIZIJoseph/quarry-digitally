import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAuthHeaders } from '@/lib/auth-client';

type Locale = 'en' | 'rw' | 'zh';

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Import translations
import { translations } from '@/data/translations';

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('en');

  // Load saved language preference from user_preferences
  useEffect(() => {
    const loadLanguage = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const res = await fetch('/api/user/preferences', { headers: getAuthHeaders() });
          if (res.ok) {
            const prefs = await res.json();
            const savedLang = prefs.language;
            if (savedLang && ['en', 'rw', 'zh'].includes(savedLang)) {
              setLocale(savedLang as Locale);
              return;
            }
          }
        } catch (err) {
          console.error(err);
        }
      }
      // Fallback: browser language
      const browserLang = navigator.language.slice(0, 2);
      if (browserLang === 'rw') setLocale('rw');
      else if (browserLang === 'zh') setLocale('zh');
      else setLocale('en');
    };
    loadLanguage();
  }, []);

  // Translation function with interpolation support
  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations[locale];
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }
    let text = value || key;
    if (params && typeof text === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(new RegExp(`{${k}}`, 'g'), String(v));
      });
    }
    return text;
  };

  // Save language preference whenever it changes (to user_preferences)
  const updateLocale = async (newLocale: Locale) => {
    setLocale(newLocale);
    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify({ language: newLocale }),
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale: updateLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}