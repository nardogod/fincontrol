"use client";

import { useLanguage } from "@/app/contexts/LanguageContext";
import type { LanguageCode } from "@/app/lib/i18n";

interface TranslatedTextProps {
  dict: Record<LanguageCode, string>;
  className?: string;
  as?: "span" | "p" | "div";
}

export function TranslatedText({ dict, className, as: Tag = "span" }: TranslatedTextProps) {
  const { language } = useLanguage();
  return <Tag className={className}>{dict[language]}</Tag>;
}
