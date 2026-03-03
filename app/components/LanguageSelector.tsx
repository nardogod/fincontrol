"use client";

import { useEffect, useState } from "react";
import { Globe2 } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tSidebar } from "@/app/lib/i18n";

type LanguageCode = "pt" | "en" | "sv";

const LANGUAGES: { code: LanguageCode; label: string }[] = [
  { code: "pt", label: "Português" },
  { code: "en", label: "English" },
  { code: "sv", label: "Svenska" },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [hydrated, setHydrated] = useState(false);

  // Carregar preferência do usuário (localStorage ou idioma do navegador)
  useEffect(() => {
    setHydrated(true);
  }, []);

  return (
    <div className={!hydrated ? "opacity-0" : ""}>
      <div className="flex items-center justify-end gap-2">
      <span className="hidden items-center gap-1 text-xs text-slate-500 sm:inline-flex">
        <Globe2 className="h-3 w-3" />
        {tSidebar.language[language]}
      </span>
      <div className="inline-flex rounded-full border border-slate-200 bg-white/80 p-1 shadow-sm backdrop-blur">
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
              language === lang.code
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            )}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
    </div>
  );
}

