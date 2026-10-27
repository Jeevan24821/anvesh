import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('anvesh_language');
      return saved === 'hi' ? 'hi' : 'en';
    } catch {
      return 'en';
    }
  });

  const setLanguage = (lang) => {
    const target = lang === 'hi' ? 'hi' : 'en';
    setLanguageState(target);
    try {
      localStorage.setItem('anvesh_language', target);
      document.documentElement.lang = target;
    } catch (e) {
      console.warn('Failed to persist language in localStorage', e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch (e) {}
  }, [language]);

  /**
   * Translate key with optional fallback.
   * If translation is missing or unreliable, gracefully falls back to English or key itself.
   */
  const t = (key, fallback) => {
    if (!key) return '';
    const currentDict = translations[language] || translations.en;
    if (currentDict && currentDict[key] !== undefined) {
      return currentDict[key];
    }
    const enDict = translations.en;
    if (enDict && enDict[key] !== undefined) {
      return enDict[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      toggleLanguage: () => {},
      t: (key, fallback) => (translations.en[key] !== undefined ? translations.en[key] : (fallback || key))
    };
  }
  return context;
}
