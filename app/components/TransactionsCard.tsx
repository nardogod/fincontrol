"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import TransactionList from "@/app/components/TransactionList";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tTransactions } from "@/app/lib/i18n";
import type { TAccount, TCategory } from "@/app/lib/types";

interface TransactionsCardProps {
  transactions: any[];
  accounts: TAccount[];
  categories: TCategory[];
  currentPage: number;
  totalPages: number;
}

export default function TransactionsCard({
  transactions,
  accounts,
  categories,
  currentPage,
  totalPages,
}: TransactionsCardProps) {
  const { language } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tTransactions.history[language]}</CardTitle>
      </CardHeader>
      <CardContent>
        <TransactionList
          transactions={transactions}
          accounts={accounts}
          categories={categories}
          currentPage={currentPage}
          totalPages={totalPages}
        />
      </CardContent>
    </Card>
  );
}
