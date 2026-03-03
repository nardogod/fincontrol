"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Target,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { formatCurrency } from "@/app/lib/utils";
import { useAccountBudget } from "@/app/hooks/useAccountBudget";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tAccountQuickStats } from "@/app/lib/i18n";
import type { TAccount, TTransaction } from "@/app/lib/types";

interface AccountQuickStatsProps {
  account: TAccount & {
    is_shared?: boolean;
    member_role?: string;
  };
  transactions: TTransaction[];
}

function AccountQuickStatsComponent({
  account,
  transactions,
}: AccountQuickStatsProps) {
  const { language } = useLanguage();
  const t = tAccountQuickStats;
  const { budget, isLoading } = useAccountBudget(account.id);
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Filtrar transações da conta atual do mês atual (para despesas e orçamento)
    const accountTransactions = transactions.filter(
      (t) =>
        t.account_id === account.id &&
        new Date(t.transaction_date).getMonth() === currentMonth &&
        new Date(t.transaction_date).getFullYear() === currentYear
    );

    // Calcular receitas de TODAS as transações da conta (total disponível)
    const allAccountTransactions = transactions.filter(
      (t) => t.account_id === account.id
    );
    const income = allAccountTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular despesas do mês atual (para orçamento)
    const expense = accountTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular saldo total da conta (todas as receitas - todas as despesas)
    const totalExpenses = allAccountTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const currentBalance = income - totalExpenses;

    // Usar orçamento definido ou calcular estimativa
    const monthlyBudget = budget?.monthly_budget || 0;
    const alertThreshold = budget?.alert_threshold || 80;
    const remaining = Math.max(0, monthlyBudget - expense);
    const progress = monthlyBudget > 0 ? (expense / monthlyBudget) * 100 : 0;
    const thresholdAmount = monthlyBudget * (alertThreshold / 100);

    // Determinar status
    let status: "on-track" | "alert" | "over-budget" = "on-track";
    if (expense > monthlyBudget) {
      status = "over-budget";
    } else if (expense > thresholdAmount) {
      status = "alert";
    }

    return {
      income,
      expense,
      currentBalance,
      budget: monthlyBudget,
      remaining,
      progress,
      status,
      thresholdAmount,
      transactionCount: accountTransactions.length,
    };
  }, [account.id, transactions, budget]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "on-track":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "over-budget":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "text-green-600";
      case "alert":
        return "text-yellow-600";
      case "over-budget":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "on-track":
        return t.onTrack[language];
      case "alert":
        return t.alert[language];
      case "over-budget":
        return t.overBudget[language];
      default:
        return t.unavailable[language];
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
          <div className="flex items-center gap-1">
            {getStatusIcon(stats.status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Resumo Financeiro */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-700">
                {t.income[language]}
              </span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.income)}
            </p>
          </div>

          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">{t.expenses[language]}</span>
            </div>
            <p className="text-lg font-bold text-red-600">
              {formatCurrency(stats.expense)}
            </p>
          </div>
        </div>

        {/* Balanço Atual */}
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center gap-1 mb-1">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {t.currentBalance[language]}
            </span>
          </div>
          <p
            className={`text-xl font-bold ${
              stats.currentBalance >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {formatCurrency(stats.currentBalance)}
          </p>
        </div>

        {/* Meta Mensal e Progresso */}
        {stats.budget > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">{t.monthlyGoal[language]}</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {formatCurrency(stats.budget)}
              </span>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t.progress[language]}</span>
                <span>{Math.round(stats.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    stats.status === "over-budget"
                      ? "bg-red-500"
                      : stats.status === "alert"
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{
                    width: `${Math.min(100, stats.progress)}%`,
                  }}
                />
              </div>
            </div>

            {/* Valores Restantes */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-blue-600 font-medium">{t.remaining[language]}</p>
                <p
                  className={`font-bold ${
                    stats.remaining > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {formatCurrency(stats.remaining)}
                </p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <p className="text-orange-600 font-medium">{t.alertAt[language]}</p>
                <p className="font-bold text-orange-600">
                  {formatCurrency(stats.thresholdAmount)}
                </p>
              </div>
            </div>

            {/* Status e Avisos */}
            <div
              className={`p-3 rounded-lg border ${
                stats.status === "over-budget"
                  ? "bg-red-50 border-red-200"
                  : stats.status === "alert"
                  ? "bg-yellow-50 border-yellow-200"
                  : "bg-green-50 border-green-200"
              }`}
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(stats.status)}
                <span
                  className={`text-sm font-medium ${getStatusColor(
                    stats.status
                  )}`}
                >
                  {getStatusLabel(stats.status)}
                </span>
              </div>
              {stats.status === "over-budget" && (
                <p className="text-sm text-red-700 mt-1">
                  {t.youSpent[language]} {formatCurrency(stats.expense - stats.budget)} {t.overTheGoal[language]}
                </p>
              )}
              {stats.status === "alert" && (
                <p className="text-sm text-yellow-700 mt-1">
                  {t.closeToLimit[language]} {formatCurrency(stats.remaining)}
                </p>
              )}
              {stats.status === "on-track" && (
                <p className="text-sm text-green-700 mt-1">
                  {t.onTrackRemaining[language]} {formatCurrency(stats.remaining)} {t.toSpend[language]}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Sem Meta Definida */}
        {stats.budget === 0 && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">
                {t.noGoalDefined[language]}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {t.configureGoalMessage[language]}
            </p>
          </div>
        )}

        {/* Estatísticas Adicionais */}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>{stats.transactionCount} transações</span>
          <span>Este mês</span>
        </div>

        {/* Botões de Ação */}
        <div className="flex gap-2 pt-3">
          <Link href={`/dashboard?account=${account.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              <ArrowRight className="h-4 w-4 mr-2" />
              {t.access[language]}
            </Button>
          </Link>
          <Link href={`/accounts/${account.id}/settings`} className="flex-1">
            <Button variant="ghost" size="sm" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              {t.configure[language]}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Export com carregamento dinâmico para evitar problemas de hidratação
const AccountQuickStats = dynamic(
  () => Promise.resolve(AccountQuickStatsComponent),
  {
    ssr: false,
    loading: () => (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-200">
                <span className="text-lg">📊</span>
              </div>
              <div>
                <CardTitle className="text-lg">Carregando...</CardTitle>
                <p className="text-sm text-gray-500">Conta</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Carregando estatísticas...</p>
        </CardContent>
      </Card>
    ),
  }
);

export default AccountQuickStats;
