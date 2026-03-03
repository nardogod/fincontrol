"use client";

import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode } from "react";

type LanguageCode = "pt" | "en" | "sv";

interface LanguageContextValue {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined
);

const STORAGE_KEY = "fincontrol_language";

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "pt";
  const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (stored && ["pt", "en", "sv"].includes(stored)) return stored;
  const browser = navigator.language.toLowerCase();
  if (browser.startsWith("sv")) return "sv";
  if (browser.startsWith("en")) return "en";
  return "pt";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("pt");
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    setLanguageState(getStoredLanguage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, language);
    const langTag =
      language === "pt" ? "pt-BR" : language === "sv" ? "sv-SE" : "en";
    document.documentElement.lang = langTag;
  }, [language, hydrated]);

  const setLanguage = (lang: LanguageCode) => setLanguageState(lang);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return ctx;
}

