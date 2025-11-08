"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
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

    // Calcular por categoria
    const categorySummary = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || "sem-categoria";

      // Buscar categoria real
      const category = categories.find((c) => c.id === categoryId);
      const categoryName = category?.name || "Sem categoria";
      const categoryIcon = category?.icon || "📦";

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          icon: categoryIcon,
          type: transaction.type,
          income: 0,
          expense: 0,
          count: 0,
        };
      }

      if (transaction.type === "income") {
        acc[categoryId].income += Number(transaction.amount);
      } else {
        acc[categoryId].expense += Number(transaction.amount);
      }
      acc[categoryId].count += 1;

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
  }, [transactions, accounts, allTransactions, activeAccountId]);

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case "current-month":
        return "Este mês";
      case "last-month":
        return "Mês passado";
      case "last-3-months":
        return "Últimos 3 meses";
      case "last-6-months":
        return "Últimos 6 meses";
      case "current-year":
        return "Este ano";
      case "all":
        return "Todos os períodos";
      default:
        return "Período selecionado";
    }
  };

  return (
    <div className="space-y-6">
      {/* Cards Principais */}
      <div className="space-y-4">
        {/* Header com botão de ocultar */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Resumo Financeiro
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
              {hideValues ? "Mostrar Valores" : "Ocultar Valores"}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Receitas</span>
              </div>
              <p className="text-3xl font-bold">
                {hideValues ? "••••••" : formatCurrency(summary.total.income)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                Total disponível na conta
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Despesas</span>
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
                <span className="text-sm font-medium opacity-90">Balanço</span>
              </div>
              <p className="text-3xl font-bold">
                {hideValues ? "••••••" : formatCurrency(summary.total.balance)}
              </p>
              <p className="mt-1 text-xs opacity-75">
                {summary.total.balance >= 0 ? "Positivo" : "Negativo"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Categorias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {summary.topCategories.map((category: any, index) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.icon}</span>
                  <div>
                    <h4 className="font-medium">{category.name}</h4>
                    <p className="text-sm text-gray-500">
                      {category.count} transação
                      {category.count !== 1 ? "ões" : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">
                    {formatCurrency(category.income + category.expense)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {category.type === "income" ? "Receita" : "Despesa"}
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
          <CardTitle>Estatísticas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {summary.transactionCount}
              </p>
              <p className="text-sm text-gray-500">Transações</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">
                {summary.accounts.length}
              </p>
              <p className="text-sm text-gray-500">Contas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">
                {summary.topCategories.length}
              </p>
              <p className="text-sm text-gray-500">Categorias</p>
            </div>
            <div className="text-center">
              <p
                className={`text-2xl font-bold ${
                  summary.total.balance >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {summary.total.balance >= 0 ? "✅" : "⚠️"}
              </p>
              <p className="text-sm text-gray-500">Status</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
