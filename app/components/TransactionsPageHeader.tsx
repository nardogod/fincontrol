"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Plus } from "lucide-react";
import CSVImportDialog from "@/app/components/CSVImportDialog";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tTransactions } from "@/app/lib/i18n";
import type { TAccount, TCategory } from "@/app/lib/types";

interface TransactionsPageHeaderProps {
  count: number;
  accounts: TAccount[];
  categories: TCategory[];
}

export default function TransactionsPageHeader({
  count,
  accounts,
  categories,
}: TransactionsPageHeaderProps) {
  const { language } = useLanguage();

  const countText =
    count !== 1
      ? `${count} ${tTransactions.found[language]}`
      : `1 ${tTransactions.foundOne[language]}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {tTransactions.title[language]}
        </h1>
        <p className="mt-1 text-sm text-slate-600">{countText}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/transactions/new">
          <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
            <Plus className="mr-2 h-4 w-4" />
            {tTransactions.newTransaction[language]}
          </Button>
        </Link>
        <Link href="/transactions/bulk">
          <Button variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            {tTransactions.multipleTransactions[language]}
          </Button>
        </Link>
        <CSVImportDialog accounts={accounts} categories={categories} />
      </div>
    </div>
  );
}
