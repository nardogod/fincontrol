"use client";

import { useMemo } from "react";
import { 
  Target, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/app/lib/utils";
import { useAccountBudget } from "@/app/hooks/useAccountBudget";
import type { TAccount, TTransaction } from "@/app/lib/types";

interface AccountQuickStatsProps {
  account: TAccount;
  transactions: TTransaction[];
}

export default function AccountQuickStats({
  account,
  transactions,
}: AccountQuickStatsProps) {
  const { budget, isLoading } = useAccountBudget(account.id);
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtrar transações da conta atual do mês atual
    const accountTransactions = transactions.filter(t => 
      t.account_id === account.id &&
      new Date(t.transaction_date).getMonth() === currentMonth &&
      new Date(t.transaction_date).getFullYear() === currentYear
    );
    
    // Calcular receitas e despesas
    const income = accountTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const expense = accountTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calcular saldo atual
    const currentBalance = income - expense;
    
    // Usar orçamento definido ou calcular estimativa
    const monthlyBudget = budget?.monthly_budget || 0;
    const alertThreshold = budget?.alert_threshold || 80;
    const remaining = Math.max(0, monthlyBudget - expense);
    const progress = monthlyBudget > 0 ? (expense / monthlyBudget) * 100 : 0;
    const thresholdAmount = monthlyBudget * (alertThreshold / 100);
    
    // Determinar status
    let status: 'on-track' | 'alert' | 'over-budget' = 'on-track';
    if (expense > budget) {
      status = 'over-budget';
    } else if (expense > thresholdAmount) {
      status = 'alert';
    }
    
    return {
      income,
      expense,
      currentBalance,
      budget,
      remaining,
      progress,
      status,
      thresholdAmount,
      transactionCount: accountTransactions.length,
    };
  }, [account.id, transactions, monthlyBudget, alertThreshold]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'alert':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'over-budget':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'alert':
        return 'text-yellow-600';
      case 'over-budget':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'No prazo';
      case 'alert':
        return 'Atenção';
      case 'over-budget':
        return 'Acima do orçamento';
      default:
        return 'Indisponível';
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
              <p className="text-sm text-gray-500 capitalize">
                {account.type}
              </p>
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
              <span className="text-sm font-medium text-green-700">Receitas</span>
            </div>
            <p className="text-lg font-bold text-green-600">
              {formatCurrency(stats.income)}
            </p>
          </div>
          
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-700">Despesas</span>
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
            <span className="text-sm font-medium text-gray-700">Saldo Atual</span>
          </div>
          <p className={`text-xl font-bold ${
            stats.currentBalance >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(stats.currentBalance)}
          </p>
        </div>

        {/* Meta Mensal e Progresso */}
        {stats.budget > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Meta Mensal</span>
              </div>
              <span className="text-sm font-bold text-blue-600">
                {formatCurrency(stats.budget)}
              </span>
            </div>
            
            {/* Barra de Progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>{Math.round(stats.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    stats.status === 'over-budget' 
                      ? 'bg-red-500' 
                      : stats.status === 'alert'
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                  }`}
                  style={{ 
                    width: `${Math.min(100, stats.progress)}%` 
                  }}
                />
              </div>
            </div>

            {/* Valores Restantes */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="text-center p-2 bg-blue-50 rounded">
                <p className="text-blue-600 font-medium">Restante</p>
                <p className={`font-bold ${
                  stats.remaining > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(stats.remaining)}
                </p>
              </div>
              <div className="text-center p-2 bg-orange-50 rounded">
                <p className="text-orange-600 font-medium">Alerta em</p>
                <p className="font-bold text-orange-600">
                  {formatCurrency(stats.thresholdAmount)}
                </p>
              </div>
            </div>

            {/* Status e Avisos */}
            <div className={`p-3 rounded-lg border ${
              stats.status === 'over-budget' 
                ? 'bg-red-50 border-red-200' 
                : stats.status === 'alert'
                ? 'bg-yellow-50 border-yellow-200'
                : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2">
                {getStatusIcon(stats.status)}
                <span className={`text-sm font-medium ${getStatusColor(stats.status)}`}>
                  {getStatusLabel(stats.status)}
                </span>
              </div>
              {stats.status === 'over-budget' && (
                <p className="text-sm text-red-700 mt-1">
                  Você gastou {formatCurrency(stats.expense - stats.budget)} acima da meta
                </p>
              )}
              {stats.status === 'alert' && (
                <p className="text-sm text-yellow-700 mt-1">
                  Você está próximo do limite. Restam {formatCurrency(stats.remaining)}
                </p>
              )}
              {stats.status === 'on-track' && (
                <p className="text-sm text-green-700 mt-1">
                  Você está no prazo. Restam {formatCurrency(stats.remaining)} para gastar
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
              <span className="text-sm font-medium text-gray-700">Sem meta definida</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Configure uma meta mensal nas configurações da conta
            </p>
          </div>
        )}

        {/* Estatísticas Adicionais */}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
          <span>{stats.transactionCount} transações</span>
          <span>Este mês</span>
        </div>
      </CardContent>
    </Card>
  );
}
