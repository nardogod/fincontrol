"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tFinancialSummary, getCategoryDisplayName } from "@/app/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount, TCategory } from "@/app/lib/types";

interface FinancialSummaryProps {
  transactions: TTransaction[];
  accounts: TAccount[];
  categories: TCategory[];
  period: string;
  activeAccountId?: string | null;
  hideValues?: boolean;
  onToggleHideValues?: () => void;
  allTransactions?: TTransaction[]; // All transactions for calculating total receitas
}

export default function FinancialSummary({
  transactions,
  accounts,
  categories,
  period,
  activeAccountId,
  hideValues = false,
  onToggleHideValues,
  allTransactions,
}: FinancialSummaryProps) {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<{
    name: string;
    icon: string;
    transactionIds: string[];
  } | null>(null);

  const summary = useMemo(() => {
    // Se há uma conta ativa, usar apenas transações dessa conta para receitas
    // Caso contrário, usar todas as transações
    const transactionsForIncome = activeAccountId
      ? (allTransactions || transactions).filter(
          (t) => t.account_id === activeAccountId
        )
      : allTransactions || transactions;

    // Calcular receitas (total disponível na conta ativa ou todas as contas)
    const income = transactionsForIncome
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular despesas do período filtrado
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular balanço total (todas as receitas - todas as despesas)
    const totalExpenses = transactionsForIncome
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const balance = income - totalExpenses;

    // Calcular por conta
    const accountSummary = accounts.map((account) => {
      // Se há uma conta ativa, mostrar apenas essa conta
      if (activeAccountId && account.id !== activeAccountId) {
        return {
          ...account,
          income: 0,
          expense: 0,
          balance: 0,
          transactionCount: 0,
        };
      }

      // Receitas de todas as transações da conta
      const allAccountTransactions = (allTransactions || transactions).filter(
        (t) => t.account_id === account.id
      );
      const accountIncome = allAccountTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Despesas do período filtrado
      const accountTransactions = transactions.filter(
        (t) => t.account_id === account.id
      );
      const accountExpense = accountTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Balanço total da conta (todas as receitas - todas as despesas)
      const totalAccountExpenses = allAccountTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const accountBalance = accountIncome - totalAccountExpenses;

      return {
        ...account,
        income: accountIncome,
        expense: accountExpense,
        balance: accountBalance,
        transactionCount: accountTransactions.length,
      };
    });

    // Calcular por categoria - UNIFICAR por nome normalizado (sem perder dados)
    const categorySummary = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || "sem-categoria";

      // Buscar categoria real
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || tFinancialSummary.noCategory[language];
      const categoryIcon = category?.icon || "📦";

      // Normalizar nome da categoria para unificar duplicatas
      // Remove espaços extras, converte para minúsculas, remove acentos
      const normalizeName = (name: string) => {
        return name
          .toLowerCase()
          .trim()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Remove acentos
          .replace(/\s+/g, " "); // Normaliza espaços
      };

      const normalizedName = normalizeName(categoryName);
      const key = normalizedName; // Usar nome normalizado como chave

      if (!acc[key]) {
        acc[key] = {
          id: categoryId, // Manter primeiro ID encontrado
          name: categoryName, // Manter primeiro nome encontrado (com formatação original)
          icon: categoryIcon, // Manter primeiro ícone encontrado
          type: transaction.type,
          income: 0,
          expense: 0,
          count: 0,
          transactionIds: [], // Armazenar IDs das transações para referência
        };
      }

      if (transaction.type === "income") {
        acc[key].income += Number(transaction.amount);
      } else {
        acc[key].expense += Number(transaction.amount);
      }
      acc[key].count += 1;
      acc[key].transactionIds.push(transaction.id); // Guardar ID da transação

      return acc;
    }, {} as Record<string, any>);

    const topCategories = Object.values(categorySummary)
      .sort((a: any, b: any) => b.income + b.expense - (a.income + a.expense))
      .slice(0, 5);

    return {
      total: { income, expense, balance },
      accounts: accountSummary,
      topCategories,
      transactionCount: transactions.length,
    };
  }, [transactions, accounts, categories, allTransactions, activeAccountId, language]);

  const getPeriodLabel = (p: string) => {
    const map: Record<string, typeof tFinancialSummary.periodThisMonth> = {
      "current-month": tFinancialSummary.periodThisMonth,
      "last-month": tFinancialSummary.periodLastMonth,
      "last-3-months": tFinancialSummary.periodLast3Months,
      "last-6-months": tFinancialSummary.periodLast6Months,
      "current-year": tFinancialSummary.periodThisYear,
      "all": tFinancialSummary.periodAll,
    };
    return map[p]?.[language] ?? tFinancialSummary.periodSelected[language];
  };

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="space-y-4">
        {/* Header com botão de ocultar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {tFinancialSummary.title[language]}
          </h2>
          {onToggleHideValues && (
            <Button
              onClick={onToggleHideValues}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {hideValues ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
              {hideValues ? tFinancialSummary.showValues[language] : tFinancialSummary.hideValues[language]}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">{tFinancialSummary.income[language]}</span>
              </div>
              <p className="text-3xl font-bold">
                {hideValues ? "••••••" : formatCurrency(summary.total.income)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {tFinancialSummary.totalAvailable[language]}
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">{tFinancialSummary.expenses[language]}</span>
              </div>
              <p className="text-3xl font-bold">
                {hideValues ? "••••••" : formatCurrency(summary.total.expense)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {getPeriodLabel(period)}
              </p>
            </CardContent>
          </Card>

          <Card
            className={`border-0 shadow-lg ${
              summary.total.balance >= 0
                ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                : "bg-gradient-to-br from-orange-500 to-red-600"
            } text-white`}
          >
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">{tFinancialSummary.balance[language]}</span>
              </div>
              <p className="text-3xl font-bold">
                {hideValues ? "••••••" : formatCurrency(summary.total.balance)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {summary.total.balance >= 0 ? tFinancialSummary.positive[language] : tFinancialSummary.negative[language]}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>{tFinancialSummary.categories[language]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.topCategories.map((category: any, index) => (
              <div
                key={category.id || index}
                onClick={() => {
                  if (
                    category.transactionIds &&
                    category.transactionIds.length > 0
                  ) {
                    setSelectedCategory({
                      name: category.name,
                      icon: category.icon,
                      transactionIds: category.transactionIds,
                    });
                  }
                }}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="font-medium">{getCategoryDisplayName(category.name, language)}</h4>
                    <p className="text-sm text-gray-500">
                      {category.count} {category.count !== 1 ? tFinancialSummary.transactions[language] : tFinancialSummary.transaction[language]}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(category.income + category.expense)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.type === "income" ? tFinancialSummary.incomeType[language] : tFinancialSummary.expenseType[language]}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Gerais */}
      <Card>
        <CardHeader>
          <CardTitle>{tFinancialSummary.stats[language]}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {summary.transactionCount}
              </p>
              <p className="text-sm text-gray-500">{tFinancialSummary.transactionsCount[language]}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {summary.accounts.length}
              </p>
              <p className="text-sm text-gray-500">{tFinancialSummary.accountsCount[language]}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {summary.topCategories.length}
              </p>
              <p className="text-sm text-gray-500">{tFinancialSummary.categoriesCount[language]}</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  summary.total.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {summary.total.balance >= 0 ? "✅" : "⚠️"}
              </p>
              <p className="text-sm text-gray-500">{tFinancialSummary.status[language]}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Transações da Categoria */}
      <Dialog
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedCategory?.icon}</span>
              <span>{tFinancialSummary.transactionsFor[language]}{selectedCategory?.name}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedCategory?.transactionIds.length}{" "}
              {selectedCategory && selectedCategory.transactionIds.length !== 1
                ? tFinancialSummary.transactions[language]
                : tFinancialSummary.transaction[language]}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            {selectedCategory &&
              transactions
                .filter((t) => selectedCategory.transactionIds.includes(t.id))
                .sort(
                  (a, b) =>
                    new Date(b.transaction_date).getTime() -
                    new Date(a.transaction_date).getTime()
                )
                .map((transaction) => {
                  const account = accounts.find(
                    (a) => a.id === transaction.account_id
                  );
                  const category = categories.find(
                    (c) => c.id === transaction.category_id
                  );
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {category?.icon || "📦"}
                        </span>
                        <div>
                          <p className="font-medium">
                            {transaction.description || tFinancialSummary.noDescription[language]}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              transaction.transaction_date
                            ).toLocaleDateString(language === "pt" ? "pt-BR" : language === "sv" ? "sv-SE" : "en")}{" "}
                            • {account?.name || tFinancialSummary.noAccount[language]}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            transaction.type === "income"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.type === "income" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </p>
                      </div>
                    </div>
                  );
                })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
