"use client";

import { useMemo, useState } from "react";
import {
  TrendingUp,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
} from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tSpendingForecast } from "@/app/lib/i18n";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount } from "@/app/lib/types";
import type { ForecastSettings } from "@/app/hooks/useForecastSettings";
import { useForecastSettings } from "@/app/hooks/useForecastSettings";
import { useUnpaidRecurringBillsTotal } from "@/app/hooks/useRecurringBills";
import { useToast } from "@/app/hooks/use-toast";

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
  progressPercentage: number;
}

export default function SpendingForecast({
  account,
  transactions,
  historicalTransactions,
  customSettings,
}: SpendingForecastProps) {
  const { toast } = useToast();
  const { language } = useLanguage();
  const { updateManualForecast, refetch } = useForecastSettings(account.id);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Buscar total de contas fixas não pagas do mês atual
  const { totalUnpaidAmount: unpaidRecurringBillsTotal } = useUnpaidRecurringBillsTotal();
  
  // Verificar se há atualização manual
  const hasManualUpdate = customSettings?.last_manual_update !== null && customSettings?.last_manual_update !== undefined;
  
  const forecastData = useMemo((): ForecastData => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações da conta atual (funciona para contas próprias e compartilhadas)
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
      (sum, t) => sum + Number(t.amount || 0),
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

    // Prioridade: 1) Meta personalizada, 2) Média histórica (se auto_adjust ativo), 3) 0
    let monthlyEstimate = 0;
    let isUsingCustomBudget = false;

    if (customSettings && customSettings.monthly_budget) {
      monthlyEstimate = customSettings.monthly_budget;
      isUsingCustomBudget = true;
    } else if (
      customSettings?.auto_adjust !== false &&
      averageMonthlySpending > 0
    ) {
      // Se auto_adjust estiver ativo (padrão) e houver histórico, usar média histórica
      monthlyEstimate = averageMonthlySpending;
      isUsingCustomBudget = false;
    } else {
      // Se não houver meta definida e não houver histórico suficiente
      monthlyEstimate = 0;
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
      (sum, t) => sum + Number(t.amount || 0),
      0
    );

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

    // Se há atualização manual, usar valores estáticos
    const finalCurrentWeekSpent = hasManualUpdate && customSettings?.manual_current_week_spent !== null
      ? customSettings.manual_current_week_spent!
      : currentWeekSpent;
    
    const finalCurrentMonthSpent = hasManualUpdate && customSettings?.manual_current_month_spent !== null
      ? customSettings.manual_current_month_spent!
      : currentMonthSpent;
    
    const finalRemainingThisMonth = hasManualUpdate && customSettings?.manual_remaining_this_month !== null
      ? customSettings.manual_remaining_this_month!
      : remainingThisMonth;
    
    const finalProjectedMonthlyTotal = hasManualUpdate && customSettings?.manual_projected_monthly_total !== null
      ? customSettings.manual_projected_monthly_total!
      : projectedMonthlyTotal;
    
    const finalStatus = hasManualUpdate && customSettings?.manual_status
      ? customSettings.manual_status as ForecastData["status"]
      : status;
    
    const finalProgressPercentage = hasManualUpdate && customSettings?.manual_progress_percentage !== null
      ? customSettings.manual_progress_percentage!
      : (monthlyEstimate > 0 ? (finalCurrentMonthSpent / monthlyEstimate) * 100 : 0);

    return {
      monthlyEstimate, // Sempre dinâmico (definido pelo usuário)
      weeklyEstimate,
      currentWeekSpent: finalCurrentWeekSpent,
      currentMonthSpent: finalCurrentMonthSpent,
      remainingThisMonth: finalRemainingThisMonth,
      daysRemaining,
      projectedMonthlyTotal: finalProjectedMonthlyTotal,
      unpaidRecurringBillsTotal: unpaidRecurringBillsTotal,
      status: finalStatus,
      confidence,
      isUsingCustomBudget,
      progressPercentage: finalProgressPercentage,
    };
  }, [account.id, transactions, historicalTransactions, customSettings, unpaidRecurringBillsTotal, hasManualUpdate]);

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
        return tSpendingForecast.highConfidence[language];
      case "medium":
        return tSpendingForecast.mediumConfidence[language];
      case "low":
        return tSpendingForecast.lowConfidence[language];
      default:
        return tSpendingForecast.unavailable[language];
    }
  };

  const handleManualUpdate = async () => {
    setIsUpdating(true);
    try {
      const statusMessage = forecastData.status === "under-budget"
        ? "Bom trabalho! Você está gastando abaixo de 70% do seu orçamento. Continue assim!"
        : forecastData.status === "over-budget"
        ? "Atenção! Você ultrapassou o orçamento mensal."
        : forecastData.status === "warning"
        ? `Atenção: Você atingiu ${customSettings?.alert_threshold || 80}% do seu orçamento.`
        : "No prazo";

      const result = await updateManualForecast({
        currentWeekSpent: forecastData.currentWeekSpent,
        currentMonthSpent: forecastData.currentMonthSpent,
        remainingThisMonth: forecastData.remainingThisMonth,
        projectedMonthlyTotal: forecastData.projectedMonthlyTotal,
        progressPercentage: forecastData.progressPercentage,
        status: forecastData.status,
        statusMessage,
      });

      if (result.success) {
        toast({
          title: "Previsão atualizada!",
          description: "Os valores foram salvos e ficarão estáticos até a próxima atualização.",
        });
        await refetch();
      } else {
        toast({
          title: "Erro ao atualizar",
          description: "Não foi possível salvar a atualização. Tente novamente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar previsão manual:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const formatUpdateDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const locale = language === "pt" ? "pt-BR" : language === "sv" ? "sv-SE" : "en";
    return date.toLocaleDateString(locale, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-5 w-5" />
            {tSpendingForecast.title[language]}{account.name}
          </CardTitle>
          <Button
            onClick={handleManualUpdate}
            disabled={isUpdating}
            size="sm"
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isUpdating ? "animate-spin" : ""}`} />
            {isUpdating ? tSpendingForecast.updating[language] : tSpendingForecast.updateForecast[language]}
          </Button>
        </div>
        {hasManualUpdate && customSettings?.last_manual_update && (
          <p className="text-xs text-gray-500 mt-2">
            {tSpendingForecast.updatedAt[language]} {formatUpdateDate(customSettings.last_manual_update)}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Geral */}
        <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
          <div className="flex items-center gap-3">
            {getStatusIcon(forecastData.status)}
            <div>
              <p className="font-medium">{tSpendingForecast.budgetStatus[language]}</p>
              <p className={`text-sm ${getStatusColor(forecastData.status)}`}>
                {forecastData.status === "on-track" && tSpendingForecast.onTrack[language]}
                {forecastData.status === "over-budget" && tSpendingForecast.overBudget[language]}
                {forecastData.status === "warning" &&
                  `${tSpendingForecast.attentionPercent[language]} ${customSettings?.alert_threshold || 80}%`}
                {forecastData.status === "under-budget" &&
                  tSpendingForecast.underBudget[language]}
                {forecastData.status === "no-budget" && tSpendingForecast.noBudget[language]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{tSpendingForecast.confidence[language]}</p>
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
                  ? tSpendingForecast.monthlyBudget[language]
                  : tSpendingForecast.estimatedSpending[language]}
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(forecastData.monthlyEstimate)}
            </p>
            <p className="text-xs text-gray-500">
              {forecastData.isUsingCustomBudget
                ? tSpendingForecast.definedByYou[language]
                : tSpendingForecast.basedOn6Months[language]}
            </p>
          </div>

          {/* Gasto Esta Semana */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">
                {tSpendingForecast.spendingThisWeek[language]}
              </span>
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(forecastData.currentWeekSpent)}
            </p>
            <p className="text-xs text-gray-500">
              {tSpendingForecast.estimate[language]} {formatCurrency(forecastData.weeklyEstimate)}
            </p>
          </div>

          {/* Valor Restante */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-gray-700">
                {tSpendingForecast.remainingThisMonth[language]}
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
              {forecastData.daysRemaining} {tSpendingForecast.daysRemaining[language]}
            </p>
            {forecastData.unpaidRecurringBillsTotal > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {formatCurrency(forecastData.unpaidRecurringBillsTotal)} {tSpendingForecast.reservedForBills[language]}
              </p>
            )}
          </div>

          {/* Projeção Mensal */}
          <div className="p-4 bg-white rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">
                {tSpendingForecast.monthlyProjection[language]}
              </span>
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {formatCurrency(forecastData.projectedMonthlyTotal)}
            </p>
            <p className="text-xs text-gray-500">{tSpendingForecast.basedOnCurrentPace[language]}</p>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        {forecastData.monthlyEstimate > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{tSpendingForecast.monthlyProgress[language]}</span>
              <span>
                {Math.round(forecastData.progressPercentage)}%
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
                  width: `${Math.min(100, forecastData.progressPercentage)}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>
                {tSpendingForecast.currentSpending[language]} {formatCurrency(forecastData.currentMonthSpent)}
              </span>
              <span>
                {tSpendingForecast.monthlyGoal[language]} {formatCurrency(forecastData.monthlyEstimate)}
              </span>
            </div>
          </div>
        )}
        {forecastData.monthlyEstimate === 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {tSpendingForecast.noBudget[language]}
              </span>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              {tSpendingForecast.defineBudgetMessage[language]}
            </p>
          </div>
        )}

        {/* Avisos e Recomendações */}
        {forecastData.status === "over-budget" && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">{tSpendingForecast.attention[language]}</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              {tSpendingForecast.overBudgetMessage[language]}{" "}
              {formatCurrency(
                forecastData.currentMonthSpent - forecastData.monthlyEstimate
              )}
              . {tSpendingForecast.considerReviewing[language]}
            </p>
          </div>
        )}

        {forecastData.status === "warning" && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-800">
                {tSpendingForecast.budgetAlert[language]}
              </span>
            </div>
            <p className="text-sm text-orange-700 mt-1">
              {tSpendingForecast.reachedPercent[language]} {customSettings?.alert_threshold || 80}% {tSpendingForecast.ofBudget[language]}{" "}
              {formatCurrency(forecastData.remainingThisMonth)} {tSpendingForecast.forThisMonth[language]}
            </p>
          </div>
        )}

        {forecastData.status === "under-budget" && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {tSpendingForecast.goodWork[language]}
              </span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              {hasManualUpdate && customSettings?.manual_status_message
                ? customSettings.manual_status_message
                : tSpendingForecast.underBudgetMessage[language]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
