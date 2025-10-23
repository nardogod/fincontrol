"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  DollarSign,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount } from "@/app/lib/types";

interface AccountQuickViewProps {
  account: TAccount;
  transactions: TTransaction[];
  historicalTransactions: TTransaction[];
  showForecast?: boolean;
}

export default function AccountQuickView({
  account,
  transactions,
  historicalTransactions,
  showForecast = true,
}: AccountQuickViewProps) {
  const accountData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações da conta atual
    const accountTransactions = transactions.filter(
      (t) => t.account_id === account.id
    );
    const accountHistorical = historicalTransactions.filter(
      (t) => t.account_id === account.id
    );

    // Calcular gastos do mês atual
    const currentMonthTransactions = accountTransactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date);
      return (
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear
      );
    });

    const currentMonthIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthExpense = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentMonthBalance = currentMonthIncome - currentMonthExpense;

    // Calcular gastos da semana atual
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const currentWeekTransactions = currentMonthTransactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startOfWeek;
    });

    const currentWeekIncome = currentWeekTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const currentWeekExpense = currentWeekTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular previsão se habilitado
    let forecastData = null;
    if (showForecast) {
      // Calcular gastos históricos dos últimos 6 meses para estimativa
      const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
      const historicalExpenses = accountHistorical.filter((t) => {
        const transactionDate = new Date(t.transaction_date);
        return (
          transactionDate >= sixMonthsAgo &&
          transactionDate < new Date(currentYear, currentMonth, 1) &&
          t.type === "expense"
        );
      });

      // Calcular média mensal dos últimos 6 meses
      const monthlyAverages = [];
      for (let i = 0; i < 6; i++) {
        const monthStart = new Date(currentYear, currentMonth - 6 + i, 1);
        const monthEnd = new Date(currentYear, currentMonth - 5 + i, 0);

        const monthExpenses = historicalExpenses.filter((t) => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        });

        const monthTotal = monthExpenses.reduce(
          (sum, t) => sum + Number(t.amount),
          0
        );
        monthlyAverages.push(monthTotal);
      }

      const averageMonthlySpending =
        monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 6;
      const monthlyEstimate = averageMonthlySpending || 0;

      // Determinar status
      let status: "on-track" | "over-budget" | "under-budget" = "on-track";
      if (currentMonthExpense > monthlyEstimate) {
        status = "over-budget";
      } else if (currentMonthExpense < monthlyEstimate * 0.7) {
        status = "under-budget";
      }

      // Calcular dias restantes no mês
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const daysRemaining = lastDayOfMonth.getDate() - now.getDate();

      forecastData = {
        monthlyEstimate,
        status,
        progress:
          monthlyEstimate > 0
            ? (currentMonthExpense / monthlyEstimate) * 100
            : 0,
        daysRemaining,
      };
    }

    return {
      currentMonthIncome,
      currentMonthExpense,
      currentMonthBalance,
      currentWeekIncome,
      currentWeekExpense,
      transactionCount: currentMonthTransactions.length,
      forecastData,
    };
  }, [account.id, transactions, historicalTransactions, showForecast]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "over-budget":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "under-budget":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600";
      case "over-budget":
        return "text-red-600";
      case "under-budget":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on-track":
        return "No prazo";
      case "over-budget":
        return "Acima do orçamento";
      case "under-budget":
        return "Abaixo do orçamento";
      default:
        return "Indisponível";
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
              style={{ backgroundColor: account.color }}
            >
              <span className="text-lg">{account.icon}</span>
            </div>
            <div>
              <CardTitle className="text-lg">{account.name}</CardTitle>
              <p className="text-sm text-gray-500 capitalize">{account.type}</p>
            </div>
          </div>
          {accountData.forecastData && (
            <div className="flex items-center gap-1">
              {getStatusIcon(accountData.forecastData.status)}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo do Mês */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                Receitas
              </span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(accountData.currentMonthIncome)}
            </p>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Despesas</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(accountData.currentMonthExpense)}
            </p>
          </div>
        </div>

        {/* Balanço */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Balanço do Mês
            </span>
          </div>
          <p
            className={`text-xl font-bold ${
              accountData.currentMonthBalance >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {formatCurrency(accountData.currentMonthBalance)}
          </p>
        </div>

        {/* Esta Semana */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="text-center">
            <p className="text-gray-500">Receitas Esta Semana</p>
            <p className="font-medium text-green-600">
              {formatCurrency(accountData.currentWeekIncome)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500">Despesas Esta Semana</p>
            <p className="font-medium text-red-600">
              {formatCurrency(accountData.currentWeekExpense)}
            </p>
          </div>
        </div>

        {/* Previsão se habilitada */}
        {accountData.forecastData && (
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Previsão</span>
              </div>
              <span
                className={`text-xs ${getStatusColor(
                  accountData.forecastData.status
                )}`}
              >
                {getStatusLabel(accountData.forecastData.status)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Estimativa Mensal:</span>
                <span className="font-medium">
                  {formatCurrency(accountData.forecastData.monthlyEstimate)}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso</span>
                  <span>{Math.round(accountData.forecastData.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      accountData.forecastData.status === "over-budget"
                        ? "bg-red-500"
                        : accountData.forecastData.status === "under-budget"
                        ? "bg-blue-500"
                        : "bg-green-500"
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        accountData.forecastData.progress
                      )}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>
                    {accountData.forecastData.daysRemaining} dias restantes
                  </span>
                  <span>{accountData.transactionCount} transações</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
