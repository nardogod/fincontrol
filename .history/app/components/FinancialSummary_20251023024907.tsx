"use client";

import { useMemo, useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Target, Eye, EyeOff } from "lucide-react";
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
}

export default function FinancialSummary({
  transactions,
  accounts,
  categories,
  period,
  activeAccountId,
  hideValues = false,
  onToggleHideValues,
}: FinancialSummaryProps) {
  const summary = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const balance = income - expense;

    // Calcular por conta
    const accountSummary = accounts.map((account) => {
      const accountTransactions = transactions.filter(
        (t) => t.account_id === account.id
      );
      const accountIncome = accountTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + Number(t.amount), 0);
      const accountExpense = accountTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...account,
        income: accountIncome,
        expense: accountExpense,
        balance: accountIncome - accountExpense,
        transactionCount: accountTransactions.length,
      };
    });

    // Calcular por categoria
    const categorySummary = transactions.reduce((acc, transaction) => {
      const categoryId = transaction.category_id || "sem-categoria";
      
      // Buscar categoria real
      const category = categories.find(c => c.id === categoryId);
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
  }, [transactions, accounts]);

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
          <h2 className="text-lg font-semibold text-slate-900">Resumo Financeiro</h2>
          {onToggleHideValues && (
            <Button
              onClick={onToggleHideValues}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
            <p className="mt-1 text-xs opacity-75">{getPeriodLabel(period)}</p>
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
            <p className="mt-1 text-xs opacity-75">{getPeriodLabel(period)}</p>
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

      {/* Resumo por Conta */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Resumo por Conta
            </CardTitle>
            <Button
              onClick={() => {
                const url = activeAccountId 
                  ? `/transactions?account=${activeAccountId}`
                  : '/transactions';
                window.open(url, '_blank');
              }}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <span>📊</span>
              Ver Histórico
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.accounts.map((account) => (
              <div
                key={account.id}
                className="rounded-lg border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{account.icon}</span>
                  <div>
                    <h4 className="font-medium">{account.name}</h4>
                    <p className="text-sm text-gray-500 capitalize">
                      {account.type}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Receitas:</span>
                    <span className="font-medium">
                      {formatCurrency(account.income)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-red-600">Despesas:</span>
                    <span className="font-medium">
                      {formatCurrency(account.expense)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm border-t pt-2">
                    <span className="font-medium">Balanço:</span>
                    <span
                      className={`font-bold ${
                        account.balance >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Transações:</span>
                    <span>{account.transactionCount}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {/* Top Categorias */}
      <Card>
        <CardHeader>
          <CardTitle>Top Categorias</CardTitle>
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
    </div>
  );
}
