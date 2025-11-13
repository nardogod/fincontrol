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
import { useUnpaidRecurringBillsTotal } from "@/app/hooks/useRecurringBills";

interface SpendingForecastProps {
  account: TAccount;
  transactions: TTransaction[];
  historicalTransactions: TTransaction[];
  customSettings?: ForecastSettings;
}

interface ForecastData {
  monthlyEstimate: number;
  weeklyEstimate: number;
  currentWeekSpent: number;
  currentMonthSpent: number;
  remainingThisMonth: number;
  daysRemaining: number;
  projectedMonthlyTotal: number;
  status: "on-track" | "over-budget" | "under-budget" | "no-budget" | "warning";
  confidence: "high" | "medium" | "low";
  isUsingCustomBudget: boolean;
  unpaidRecurringBillsTotal: number;
}

export default function SpendingForecast({
  account,
  transactions,
  historicalTransactions,
  customSettings,
}: SpendingForecastProps) {
  console.log("📊 SpendingForecast - customSettings recebidas:", customSettings);
  console.log("📊 SpendingForecast - account:", account.name, account.id);
  console.log("📊 SpendingForecast - monthly_budget:", customSettings?.monthly_budget);
  console.log("📊 SpendingForecast - transactions recebidas:", transactions.length);
  console.log("📊 SpendingForecast - historicalTransactions recebidas:", historicalTransactions.length);
  
  // Buscar total de contas fixas não pagas do mês atual
  const { totalUnpaidAmount: unpaidRecurringBillsTotal } = useUnpaidRecurringBillsTotal();
  
  const forecastData = useMemo((): ForecastData => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações da conta atual (funciona para contas próprias e compartilhadas)
    const accountTransactions = transactions.filter(
      (t) => {
        const matches = t.account_id === account.id;
        if (!matches && transactions.length > 0) {
          // Log apenas se não encontrar correspondência e houver transações
          console.log("⚠️ Transação não corresponde à conta:", {
            transactionAccountId: t.account_id,
            accountId: account.id,
            transactionId: t.id,
            isShared: (account as any).is_shared
          });
        }
        return matches;
      }
    );
    const accountHistorical = historicalTransactions.filter(
      (t) => t.account_id === account.id
    );

    console.log("📊 SpendingForecast - Conta:", {
      id: account.id,
      name: account.name,
      isShared: (account as any).is_shared,
      memberRole: (account as any).member_role
    });
    console.log("📊 SpendingForecast - Total de transações recebidas:", transactions.length);
    console.log("📊 SpendingForecast - accountTransactions (filtradas):", accountTransactions.length);
    console.log("📊 SpendingForecast - accountHistorical (filtradas):", accountHistorical.length);
    
    // Log das primeiras transações para debug
    if (accountTransactions.length > 0) {
      console.log("📊 Primeiras transações da conta:", accountTransactions.slice(0, 3).map(t => ({
        id: t.id,
        account_id: t.account_id,
        amount: t.amount,
        type: t.type,
        date: t.transaction_date
      })));
    } else if (transactions.length > 0) {
      console.log("⚠️ Nenhuma transação encontrada para esta conta, mas há transações disponíveis");
      console.log("📊 IDs de conta nas transações:", [...new Set(transactions.map(t => t.account_id))]);
      console.log("📊 ID da conta atual:", account.id);
    }

    // Calcular gastos do mês atual
    const currentMonthTransactions = accountTransactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date);
      const isCurrentMonth = 
        transactionDate.getMonth() === currentMonth &&
        transactionDate.getFullYear() === currentYear;
      const isExpense = t.type === "expense";
      
      if (isCurrentMonth && isExpense) {
        console.log("📊 Transação do mês atual encontrada:", {
          id: t.id,
          amount: t.amount,
          date: t.transaction_date,
          type: t.type
        });
      }
      
      return isCurrentMonth && isExpense;
    });
    
    console.log("📊 SpendingForecast - currentMonthTransactions:", currentMonthTransactions.length);

    const currentMonthSpent = currentMonthTransactions.reduce(
      (sum, t) => {
        const amount = Number(t.amount) || 0;
        console.log("📊 Somando transação:", { id: t.id, amount, total: sum + amount });
        return sum + amount;
      },
      0
    );
    
    console.log("📊 SpendingForecast - currentMonthSpent:", currentMonthSpent);

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

    // Prioridade: 1) Meta personalizada, 2) Média histórica (se auto_adjust ativo), 3) 0
    let monthlyEstimate = 0;
    let isUsingCustomBudget = false;

    if (customSettings && customSettings.monthly_budget) {
      monthlyEstimate = customSettings.monthly_budget;
      isUsingCustomBudget = true;
      console.log("Usando orçamento personalizado (meta do usuário):", monthlyEstimate);
    } else if (
      customSettings?.auto_adjust !== false &&
      averageMonthlySpending > 0
    ) {
      // Se auto_adjust estiver ativo (padrão) e houver histórico, usar média histórica
      monthlyEstimate = averageMonthlySpending;
      isUsingCustomBudget = false;
      console.log("Usando média histórica (auto_adjust):", monthlyEstimate);
    } else {
      // Se não houver meta definida e não houver histórico suficiente
      monthlyEstimate = 0;
      console.log("Meta não definida e sem histórico suficiente - usando 0");
    }
    const weeklyEstimate = monthlyEstimate > 0 ? monthlyEstimate / 4.33 : 0; // 4.33 semanas por mês

    // Calcular gastos da semana atual
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // CORRIGIDO: Filtrar diretamente de accountTransactions para incluir transações
    // do início da semana que podem estar no mês anterior
    const currentWeekTransactions = accountTransactions.filter((t) => {
      const transactionDate = new Date(t.transaction_date);
      const isExpense = t.type === "expense";
      const isInCurrentWeek = transactionDate >= startOfWeek;
      return isExpense && isInCurrentWeek;
    });

    const currentWeekSpent = currentWeekTransactions.reduce(
      (sum, t) => {
        const amount = Number(t.amount) || 0;
        console.log("📊 Somando transação da semana:", { id: t.id, amount, total: sum + amount, date: t.transaction_date });
        return sum + amount;
      },
      0
    );
    
    console.log("📊 SpendingForecast - currentWeekSpent:", currentWeekSpent);
    console.log("📊 SpendingForecast - startOfWeek:", startOfWeek.toISOString());
    console.log("📊 SpendingForecast - currentWeekTransactions count:", currentWeekTransactions.length);

    // Calcular dias restantes no mês
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const daysRemaining = daysInMonth - now.getDate();

    // Projeção do total mensal baseado no gasto atual (usar dias reais do mês)
    const daysPassed = Math.max(1, now.getDate()); // Evitar divisão por zero
    const projectedMonthlyTotal =
      daysPassed > 0 ? currentMonthSpent * (daysInMonth / daysPassed) : 0;

    // Calcular valor restante baseado no orçamento definido
    // DEDUZIR automaticamente as contas fixas não pagas do mês
    const remainingThisMonth = Math.max(0, monthlyEstimate - currentMonthSpent - unpaidRecurringBillsTotal);

    // Determinar status usando threshold personalizado
    let status: "on-track" | "over-budget" | "under-budget" | "no-budget" | "warning" =
      "on-track";
    const alertThreshold = customSettings?.alert_threshold || 80;
    const thresholdAmount = monthlyEstimate * (alertThreshold / 100);

    if (monthlyEstimate === 0) {
      // Sem orçamento definido
      status = "no-budget";
    } else if (currentMonthSpent > monthlyEstimate) {
      // Ultrapassou o orçamento
      status = "over-budget";
    } else if (currentMonthSpent > thresholdAmount) {
      // Atingiu o threshold de alerta (mas ainda não ultrapassou)
      status = "warning";
    } else if (currentMonthSpent < monthlyEstimate * 0.7) {
      // Abaixo de 70% do orçamento
      status = "under-budget";
    } else {
      // Entre 70% e threshold% - no prazo
      status = "on-track";
    }

    // Determinar confiança baseada na quantidade e qualidade dos dados históricos
    let confidence: "high" | "medium" | "low" = "low";
    const dataPoints = monthlyAverages.filter((avg) => avg > 0);
    const dataCount = dataPoints.length;

    if (dataCount >= 4) {
      // Calcular variância para avaliar qualidade dos dados
      const mean = averageMonthlySpending;
      const variance =
        dataPoints.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
        dataCount;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;

      // Alta confiança se dados consistentes (CV < 0.5 = baixa variabilidade)
      if (coefficientOfVariation < 0.5) {
        confidence = "high";
      } else if (coefficientOfVariation < 1.0) {
        confidence = "medium";
      } else {
        confidence = "low"; // Alta variabilidade = baixa confiança
      }
    } else if (dataCount >= 2) {
      confidence = "medium";
    } else {
      confidence = "low";
    }

    return {
      monthlyEstimate,
      weeklyEstimate,
      currentWeekSpent,
      currentMonthSpent,
      remainingThisMonth,
      daysRemaining,
      projectedMonthlyTotal,
      unpaidRecurringBillsTotal: unpaidRecurringBillsTotal,
      status,
      confidence,
      isUsingCustomBudget,
    };
  }, [account.id, transactions, historicalTransactions, customSettings, unpaidRecurringBillsTotal]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600";
      case "over-budget":
        return "text-red-600";
      case "warning":
        return "text-orange-600";
      case "under-budget":
        return "text-blue-600";
      case "no-budget":
        return "text-gray-600";
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
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case "under-budget":
        return <TrendingUp className="h-5 w-5 text-blue-600" />;
      case "no-budget":
        return <Target className="h-5 w-5 text-gray-600" />;
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
                {forecastData.status === "warning" &&
                  `Atenção: ${customSettings?.alert_threshold || 80}% do orçamento`}
                {forecastData.status === "under-budget" &&
                  "Abaixo do orçamento"}
                {forecastData.status === "no-budget" && "Orçamento não definido"}
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
            {forecastData.unpaidRecurringBillsTotal > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {formatCurrency(forecastData.unpaidRecurringBillsTotal)} reservado para contas fixas
              </p>
            )}
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
        {forecastData.monthlyEstimate > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Mês</span>
              <span>
                {Math.round(
                  (forecastData.currentMonthSpent /
                    forecastData.monthlyEstimate) *
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
                    : forecastData.status === "warning"
                    ? "bg-orange-500"
                    : forecastData.status === "under-budget"
                    ? "bg-blue-500"
                    : "bg-green-500"
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (forecastData.currentMonthSpent /
                      forecastData.monthlyEstimate) *
                      100
                  )}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                Gasto atual: {formatCurrency(forecastData.currentMonthSpent)}
              </span>
              <span>
                Meta mensal: {formatCurrency(forecastData.monthlyEstimate)}
              </span>
            </div>
          </div>
        )}
        {forecastData.monthlyEstimate === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Orçamento não definido
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Defina um orçamento mensal nas configurações para ver o progresso.
            </p>
          </div>
        )}

        {/* Avisos e Recomendações */}
        {forecastData.status === "over-budget" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Atenção</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Você ultrapassou o orçamento mensal em{" "}
              {formatCurrency(
                forecastData.currentMonthSpent - forecastData.monthlyEstimate
              )}
              . Considere revisar seus gastos.
            </p>
          </div>
        )}

        {forecastData.status === "warning" && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                Alerta de Orçamento
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              Você atingiu {customSettings?.alert_threshold || 80}% do seu
              orçamento. Ainda restam{" "}
              {formatCurrency(forecastData.remainingThisMonth)} para este mês.
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
              Você está gastando abaixo de 70% do seu orçamento. Continue assim!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
