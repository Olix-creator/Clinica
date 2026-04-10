"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { translations, type Language } from "./translations";

type Translations = typeof translations.en;
type SectionKey = keyof Translations;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: <K extends SectionKey>(section: K) => Translations[K];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    const saved = localStorage.getItem("clinica-lang") as Language;
    if (saved && (saved === "en" || saved === "fr")) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("clinica-lang", lang);
  }, []);

  const t = useCallback(
    <K extends SectionKey>(section: K): Translations[K] => {
      return translations[language][section] as Translations[K];
    },
    [language]
  );

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
