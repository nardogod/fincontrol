"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  MessageCircle,
  RefreshCw,
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
import AccountSelector from "@/app/components/AccountSelector";
import DashboardFilters from "@/app/components/DashboardFilters";
import FinancialSummary from "@/app/components/FinancialSummary";
import MonthlyChart from "@/app/components/Charts/MonthlyChart";
import PieChart from "@/app/components/Charts/PieChart";
import CategoryList from "@/app/components/CategoryList";
import FloatingChat from "@/app/components/FloatingChat";
import SimpleChatModal from "@/app/components/SimpleChatModal";
import SpendingForecast from "@/app/components/SpendingForecast";
import AccountInterdependency from "@/app/components/AccountInterdependency";
import { useForecastSettings } from "@/app/hooks/useForecastSettings";
import { formatCurrency } from "@/app/lib/utils";
import type { TAccount, TTransaction, TCategory } from "@/app/lib/types";
import type { User } from "@supabase/supabase-js";

interface DashboardProps {
  user: User;
  accounts: (TAccount & {
    is_shared?: boolean;
    member_role?: string;
  })[];
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
  const [isSimpleChatOpen, setIsSimpleChatOpen] = useState(false);
  const [hideValues, setHideValues] = useState(true); // Default to hidden values

  // Carregar configurações de previsão para a conta ativa
  const { settings: forecastSettings } = useForecastSettings(
    activeAccountId || ""
  );

  // Estado dos filtros avançados
  const [filters, setFilters] = useState({
    accountId: null as string | null,
    categoryId: null as string | null,
    period: "current-month" as string,
    type: null as string | null,
  });

  // Debug logs
  console.log("🎯 Dashboard renderizando...", {
    accounts: accounts?.length,
    isSimpleChatOpen,
    transactions: transactions?.length,
    historicalTransactions: historicalTransactions?.length,
    user: user?.email,
  });

  // Log detalhado dos props recebidos
  console.log("📥 Props recebidos pelo Dashboard:", {
    accounts: accounts?.map((a) => ({
      id: a.id,
      name: a.name,
      user_id: a.user_id,
    })),
    transactions: transactions?.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      account_id: t.account_id,
      transaction_date: t.transaction_date,
    })),
    categories: categories?.length,
    user: { id: user?.id, email: user?.email },
  });

  // Log detalhado das transações
  if (transactions && transactions.length > 0) {
    console.log(
      "📊 Transações no dashboard:",
      transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        account: t.account?.name,
        date: t.transaction_date,
      }))
    );
  } else {
    console.log("⚠️ Nenhuma transação encontrada no dashboard");
  }

  // Update selected account when accounts change
  useEffect(() => {
    if (accounts.length > 0 && !activeAccountId) {
      setActiveAccountId(accounts[0].id);
    }
  }, [accounts, activeAccountId]);

  // Função para aplicar filtros de período
  const getDateRange = (period: string) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (period) {
      case "current-month":
        return { start: firstDayOfMonth, end: lastDayOfMonth };
      case "last-month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      case "last-3-months":
        const threeMonthsAgo = new Date(
          now.getFullYear(),
          now.getMonth() - 3,
          1
        );
        return { start: threeMonthsAgo, end: lastDayOfMonth };
      case "last-6-months":
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return { start: sixMonthsAgo, end: lastDayOfMonth };
      case "current-year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return { start: yearStart, end: yearEnd };
      case "all":
      default:
        return { start: null, end: null };
    }
  };

  // Filter transactions with advanced filters
  const filteredTransactions = useMemo(() => {
    console.log("🔍 Aplicando filtros avançados:", {
      filters,
      totalTransactions: transactions?.length,
    });

    let filtered = [...transactions];

    // Filtro por conta
    if (filters.accountId) {
      filtered = filtered.filter((t) => t.account_id === filters.accountId);
    } else if (activeAccountId) {
      filtered = filtered.filter((t) => t.account_id === activeAccountId);
    }

    // Filtro por categoria
    if (filters.categoryId) {
      filtered = filtered.filter((t) => t.category_id === filters.categoryId);
    }

    // Filtro por tipo
    if (filters.type) {
      filtered = filtered.filter((t) => t.type === filters.type);
    }

    // Filtro por período
    if (filters.period !== "all") {
      const { start, end } = getDateRange(filters.period);
      if (start && end) {
        filtered = filtered.filter((t) => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= start && transactionDate <= end;
        });
      }
    }

    console.log("✅ Transações filtradas:", {
      filteredCount: filtered.length,
      filters,
    });

    return filtered;
  }, [transactions, filters, activeAccountId]);

  // Filter historical transactions by active account
  const filteredHistoricalTransactions = useMemo(() => {
    if (!activeAccountId) return historicalTransactions;
    return historicalTransactions.filter(
      (t) => t.account_id === activeAccountId
    );
  }, [historicalTransactions, activeAccountId]);

  // Calculate totals for current month
  const { totalIncome, totalExpense } = useMemo(() => {
    console.log("💰 Calculando totais:", {
      filteredTransactionsCount: filteredTransactions?.length,
      filteredTransactions: filteredTransactions?.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
      })),
    });

    const incomeTransactions = filteredTransactions.filter(
      (t) => t.type === "income"
    );
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.type === "expense"
    );

    console.log(
      "📈 Transações de receita:",
      incomeTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
      }))
    );

    console.log(
      "📉 Transações de despesa:",
      expenseTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
      }))
    );

    const income = incomeTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );
    const expense = expenseTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    console.log("💵 Totais calculados:", {
      totalIncome: income,
      totalExpense: expense,
      balance: income - expense,
    });

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
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  console.log("🔄 Forçando atualização do dashboard...");
                  window.location.reload();
                }}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Atualizar
              </Button>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl shadow-lg">
                💰
              </div>
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
        {/* Dashboard Filters */}
        <DashboardFilters
          accounts={accounts}
          categories={categories}
          onFiltersChange={setFilters}
          activeFilters={filters}
        />
        {/* Financial Summary */}
        <FinancialSummary
          transactions={filteredTransactions}
          accounts={accounts}
          categories={categories}
          period={filters.period}
          activeAccountId={activeAccountId}
          hideValues={hideValues}
          onToggleHideValues={() => setHideValues(!hideValues)}
        />

        {/* Account Interdependency */}
        <AccountInterdependency
          accounts={accounts}
          transactions={transactions}
        />

        {/* Spending Forecast - Only show for active account */}
        {activeAccountId && (
          <SpendingForecast
            account={accounts.find((acc) => acc.id === activeAccountId)!}
            transactions={filteredTransactions}
            historicalTransactions={filteredHistoricalTransactions}
            customSettings={forecastSettings || undefined}
          />
        )}

        {/* Monthly Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Gastos Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyChart transactions={filteredHistoricalTransactions} />
          </CardContent>
        </Card>

        {/* Pie Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
          <PieChart
            categories={categories}
            transactions={filteredTransactions}
            type="expense"
            title="Gastos por Categoria"
          />
          <PieChart
            categories={categories}
            transactions={filteredTransactions}
            type="income"
            title="Ganhos por Categoria"
          />
        </div>

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
      </div>

      {/* Floating Chat */}
      <FloatingChat
        accounts={accounts}
        categories={categories}
        onTransactionCreated={() => {
          // Recarregar página para atualizar dados
          console.log("🔄 Recarregando dashboard após criação de transação...");
          window.location.reload();
        }}
      />

      {/* Botão de Chat Melhorado */}
      <Button
        onClick={() => {
          console.log("🟢 BOTÃO DE CHAT CLICADO!");
          setIsSimpleChatOpen(true);
        }}
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-2xl z-[9999] border-4 border-white hover:scale-110 transition-all duration-200"
        size="icon"
      >
        <MessageCircle className="h-8 w-8 text-white" />
      </Button>

      {/* Modal de Chat Simples */}
      <SimpleChatModal
        isOpen={isSimpleChatOpen}
        onClose={() => setIsSimpleChatOpen(false)}
        accounts={accounts}
        categories={categories}
        onTransactionCreated={() => {
          // Recarregar página para atualizar dados
          window.location.reload();
        }}
      />
    </div>
  );
}
