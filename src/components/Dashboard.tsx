"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AccountSelector from "@/components/AccountSelector";
import MonthlyChart from "@/components/Charts/MonthlyChart";
import CategoryList from "@/components/CategoryList";
import { formatCurrency } from "@/lib/utils";
import type { TAccount, TTransaction, TCategory } from "@/lib/types";
import type { User } from "@supabase/supabase-js";

interface DashboardProps {
  user: User;
  accounts: TAccount[];
  categories: TCategory[];
  transactions: any[];
  historicalTransactions: TTransaction[];
}

export default function Dashboard({
  user,
  accounts,
  categories,
  transactions,
  historicalTransactions,
}: DashboardProps) {
  const [activeAccountId, setActiveAccountId] = useState<string | null>(
    accounts[0]?.id || null
  );

  // Filter transactions by active account
  const filteredTransactions = useMemo(() => {
    if (!activeAccountId) return transactions;
    return transactions.filter((t) => t.account_id === activeAccountId);
  }, [transactions, activeAccountId]);

  // Calculate totals for current month
  const { totalIncome, totalExpense } = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return { totalIncome: income, totalExpense: expense };
  }, [filteredTransactions]);

  // Calculate category spending
  const categorySpending = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.type === "expense"
    );
    const categoryTotals = new Map<
      string,
      { amount: number; category: TCategory }
    >();

    expenseTransactions.forEach((t) => {
      if (t.category) {
        const current = categoryTotals.get(t.category_id) || {
          amount: 0,
          category: t.category,
        };
        categoryTotals.set(t.category_id, {
          amount: current.amount + Number(t.amount),
          category: t.category,
        });
      }
    });

    const items = Array.from(categoryTotals.values())
      .map((item) => ({
        ...item.category,
        amount: item.amount,
        percentage:
          totalExpense > 0 ? Math.round((item.amount / totalExpense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    return items;
  }, [filteredTransactions, totalExpense]);

  // Calculate average monthly spending
  const averageMonthly = useMemo(() => {
    if (historicalTransactions.length === 0) return 0;

    const total = historicalTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const months = 10;
    return total / months;
  }, [historicalTransactions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-600">
                Olá, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-lg">
              💰
            </div>
          </div>

          {/* Account Selector */}
          <AccountSelector
            accounts={accounts}
            activeAccountId={activeAccountId}
            onAccountChange={setActiveAccountId}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        {/* Balance Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-0 bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Entradas</span>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(totalIncome)}
              </p>
              <p className="mt-1 text-xs opacity-75">Este mês</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-lg">
            <CardContent className="p-6">
              <div className="mb-2 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                <span className="text-sm font-medium opacity-90">Saídas</span>
              </div>
              <p className="text-3xl font-bold">
                {formatCurrency(totalExpense)}
              </p>
              <p className="mt-1 text-xs opacity-75">Este mês</p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gastos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart transactions={historicalTransactions} />
          </CardContent>
        </Card>

        {/* Average Spending */}
        <Card className="mb-6 border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="mb-1 text-sm text-slate-600">
                  Gasto médio mensal
                </p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatCurrency(averageMonthly)}
                </p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Categories */}
        <Card>
          <CardHeader>
            <CardTitle>Categorias</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryList categories={categorySpending} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
