"use client";

import { useMemo } from "react";
import {
  TrendingUp,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount } from "@/app/lib/types";
import type { ForecastSettings } from "@/app/hooks/useForecastSettings";

interface SpendingForecastProps {
  account: TAccount;
  transactions: TTransaction[];
  historicalTransactions: TTransaction[];
  customSettings?: {
    monthly_budget: number | null;
    alert_threshold: number;
    budget_type: "fixed" | "flexible";
    auto_adjust: boolean;
    notifications_enabled: boolean;
  };
}

interface ForecastData {
  monthlyEstimate: number;
  weeklyEstimate: number;
  currentWeekSpent: number;
  remainingThisMonth: number;
  daysRemaining: number;
  projectedMonthlyTotal: number;
  status: "on-track" | "over-budget" | "under-budget";
  confidence: "high" | "medium" | "low";
  isUsingCustomBudget: boolean;
}

export default function SpendingForecast({
  account,
  transactions,
  historicalTransactions,
  customSettings,
}: SpendingForecastProps) {
  console.log("SpendingForecast - customSettings recebidas:", customSettings);
  console.log("SpendingForecast - account:", account.name, account.id);
  const forecastData = useMemo((): ForecastData => {
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
        transactionDate.getFullYear() === currentYear &&
        t.type === "expense"
      );
    });

    const currentMonthSpent = currentMonthTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

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

    // Usar configurações personalizadas se disponíveis
    let monthlyEstimate = 0;
    let isUsingCustomBudget = false;

    if (customSettings && customSettings.monthly_budget) {
      monthlyEstimate = customSettings.monthly_budget;
      isUsingCustomBudget = true;
      console.log("Usando orçamento personalizado:", monthlyEstimate);
    } else if (
      customSettings &&
      customSettings.budget_type === "flexible" &&
      customSettings.auto_adjust
    ) {
      // Usar média histórica com ajuste automático
      monthlyEstimate = averageMonthlySpending || 0;
      console.log("Usando média histórica:", monthlyEstimate);
    } else {
      // Fallback para média histórica
      monthlyEstimate = averageMonthlySpending || 0;
      console.log("Usando média histórica como fallback:", monthlyEstimate);
    }
    const weeklyEstimate = monthlyEstimate / 4.33; // 4.33 semanas por mês

    // Calcular gastos da semana atual
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const currentWeekTransactions = currentMonthTransactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startOfWeek;
    });

    const currentWeekSpent = currentWeekTransactions.reduce(
      (sum, t) => sum + Number(t.amount),
      0
    );

    // Calcular dias restantes no mês
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - now.getDate();

    // Projeção do total mensal baseado no gasto atual
    const daysPassed = now.getDate();
    const projectedMonthlyTotal = currentMonthSpent * (30 / daysPassed);

    // Calcular valor restante baseado no orçamento definido
    const remainingThisMonth = Math.max(0, monthlyEstimate - currentMonthSpent);

    // Determinar status usando threshold personalizado
    let status: "on-track" | "over-budget" | "under-budget" = "on-track";
    const alertThreshold = customSettings?.alert_threshold || 80;
    const thresholdAmount = monthlyEstimate * (alertThreshold / 100);

    if (currentMonthSpent > monthlyEstimate) {
      status = "over-budget";
    } else if (currentMonthSpent > thresholdAmount) {
      status = "over-budget"; // Alerta quando atinge o threshold
    } else if (currentMonthSpent < monthlyEstimate * 0.7) {
      status = "under-budget";
    }

    // Determinar confiança baseada na quantidade de dados históricos
    let confidence: "high" | "medium" | "low" = "low";
    if (monthlyAverages.filter((avg) => avg > 0).length >= 4) {
      confidence = "high";
    } else if (monthlyAverages.filter((avg) => avg > 0).length >= 2) {
      confidence = "medium";
    }

    return {
      monthlyEstimate,
      weeklyEstimate,
      currentWeekSpent,
      remainingThisMonth,
      daysRemaining,
      projectedMonthlyTotal,
      status,
      confidence,
      isUsingCustomBudget,
    };
  }, [account.id, transactions, historicalTransactions, customSettings]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "over-budget":
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case "under-budget":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  const getConfidenceLabel = (confidence: string) => {
    switch (confidence) {
      case "high":
        return "Alta confiança";
      case "medium":
        return "Média confiança";
      case "low":
        return "Baixa confiança";
      default:
        return "Indisponível";
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-800">
          <Target className="h-5 w-5" />
          Previsão de Gastos - {account.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            {getStatusIcon(forecastData.status)}
            <div>
              <p className="font-medium">Status do Orçamento</p>
              <p className={`text-sm ${getStatusColor(forecastData.status)}`}>
                {forecastData.status === "on-track" && "No prazo"}
                {forecastData.status === "over-budget" && "Acima do orçamento"}
                {forecastData.status === "under-budget" &&
                  "Abaixo do orçamento"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Confiança</p>
            <p className="text-sm font-medium">
              {getConfidenceLabel(forecastData.confidence)}
            </p>
          </div>
        </div>

        {/* Métricas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Gasto Estimado Mensal */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {forecastData.isUsingCustomBudget
                  ? "Orçamento Mensal"
                  : "Gasto Estimado/Mês"}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(forecastData.monthlyEstimate)}
            </p>
            <p className="text-xs text-gray-500">
              {forecastData.isUsingCustomBudget
                ? "Valor definido por você"
                : "Baseado nos últimos 6 meses"}
            </p>
          </div>

          {/* Gasto Esta Semana */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">
                Gasto Esta Semana
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(forecastData.currentWeekSpent)}
            </p>
            <p className="text-xs text-gray-500">
              Estimativa: {formatCurrency(forecastData.weeklyEstimate)}
            </p>
          </div>

          {/* Valor Restante */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                Restante Este Mês
              </span>
            </div>
            <p
              className={`text-2xl font-bold ${
                forecastData.remainingThisMonth > 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {formatCurrency(forecastData.remainingThisMonth)}
            </p>
            <p className="text-xs text-gray-500">
              {forecastData.daysRemaining} dias restantes
            </p>
          </div>

          {/* Projeção Mensal */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                Projeção Mensal
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(forecastData.projectedMonthlyTotal)}
            </p>
            <p className="text-xs text-gray-500">Baseado no ritmo atual</p>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso do Mês</span>
            <span>
              {Math.round(
                (forecastData.currentWeekSpent / forecastData.monthlyEstimate) *
                  100
              )}
              %
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${
                forecastData.status === "over-budget"
                  ? "bg-red-500"
                  : forecastData.status === "under-budget"
                  ? "bg-blue-500"
                  : "bg-green-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  (forecastData.currentWeekSpent /
                    forecastData.monthlyEstimate) *
                    100
                )}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>
              Gasto atual: {formatCurrency(forecastData.currentWeekSpent)}
            </span>
            <span>
              Meta mensal: {formatCurrency(forecastData.monthlyEstimate)}
            </span>
          </div>
        </div>

        {/* Avisos e Recomendações */}
        {forecastData.status === "over-budget" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Atenção</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Você está gastando acima da sua média histórica. Considere revisar
              seus gastos.
            </p>
          </div>
        )}

        {forecastData.status === "under-budget" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Bom trabalho!
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Você está gastando abaixo da sua média. Continue assim!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
