"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tNewTransaction } from "@/app/lib/i18n";

export default function NewTransactionHeader() {
  const { language } = useLanguage();
  const t = tNewTransaction;

  return (
    <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6 lg:px-6">
        <div className="flex items-center gap-4">
          <Link href="/transactions">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {t.title[language]}
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {t.subtitle[language]}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewTransactionCardTitle() {
  const { language } = useLanguage();
  return <>{tNewTransaction.details[language]}</>;
}
