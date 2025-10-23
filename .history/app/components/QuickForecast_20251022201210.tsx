"use client";

import { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Target
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount } from "@/app/lib/types";

interface QuickForecastProps {
  account: TAccount;
  transactions: TTransaction[];
  historicalTransactions: TTransaction[];
  compact?: boolean;
}

export default function QuickForecast({
  account,
  transactions,
  historicalTransactions,
  compact = false,
}: QuickForecastProps) {
  const forecastData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filtrar transações da conta atual
    const accountTransactions = transactions.filter(t => t.account_id === account.id);
    const accountHistorical = historicalTransactions.filter(t => t.account_id === account.id);
    
    // Calcular gastos do mês atual
    const currentMonthTransactions = accountTransactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate.getMonth() === currentMonth && 
             transactionDate.getFullYear() === currentYear &&
             t.type === 'expense';
    });
    
    const currentMonthSpent = currentMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Calcular gastos históricos dos últimos 6 meses para estimativa
    const sixMonthsAgo = new Date(currentYear, currentMonth - 6, 1);
    const historicalExpenses = accountHistorical.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= sixMonthsAgo && 
             transactionDate < new Date(currentYear, currentMonth, 1) &&
             t.type === 'expense';
    });
    
    // Calcular média mensal dos últimos 6 meses
    const monthlyAverages = [];
    for (let i = 0; i < 6; i++) {
      const monthStart = new Date(currentYear, currentMonth - 6 + i, 1);
      const monthEnd = new Date(currentYear, currentMonth - 5 + i, 0);
      
      const monthExpenses = historicalExpenses.filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });
      
      const monthTotal = monthExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      monthlyAverages.push(monthTotal);
    }
    
    const averageMonthlySpending = monthlyAverages.reduce((sum, avg) => sum + avg, 0) / 6;
    const monthlyEstimate = averageMonthlySpending || 0;
    
    // Calcular gastos da semana atual
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const currentWeekTransactions = currentMonthTransactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return transactionDate >= startOfWeek;
    });
    
    const currentWeekSpent = currentWeekTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
    
    // Determinar status
    let status: 'on-track' | 'over-budget' | 'under-budget' = 'on-track';
    if (currentMonthSpent > monthlyEstimate) {
      status = 'over-budget';
    } else if (currentMonthSpent < monthlyEstimate * 0.7) {
      status = 'under-budget';
    }
    
    // Calcular dias restantes no mês
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysRemaining = lastDayOfMonth.getDate() - now.getDate();
    
    return {
      monthlyEstimate,
      currentMonthSpent,
      currentWeekSpent,
      status,
      daysRemaining,
      progress: monthlyEstimate > 0 ? (currentMonthSpent / monthlyEstimate) * 100 : 0,
    };
  }, [account.id, transactions, historicalTransactions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'over-budget':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'under-budget':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'text-green-600';
      case 'over-budget':
        return 'text-red-600';
      case 'under-budget':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (compact) {
    return (
      <Card className="border-l-4 border-l-blue-500 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getStatusIcon(forecastData.status)}
              <div>
                <p className="font-medium text-sm">{account.name}</p>
                <p className={`text-xs ${getStatusColor(forecastData.status)}`}>
                  {forecastData.status === 'on-track' && 'No prazo'}
                  {forecastData.status === 'over-budget' && 'Acima do orçamento'}
                  {forecastData.status === 'under-budget' && 'Abaixo do orçamento'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">
                {formatCurrency(forecastData.currentMonthSpent)}
              </p>
              <p className="text-xs text-gray-500">
                de {formatCurrency(forecastData.monthlyEstimate)}
              </p>
            </div>
          </div>
          
          {/* Barra de progresso compacta */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  forecastData.status === 'over-budget' 
                    ? 'bg-red-500' 
                    : forecastData.status === 'under-budget'
                    ? 'bg-blue-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, forecastData.progress)}%` 
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.round(forecastData.progress)}% usado</span>
              <span>{forecastData.daysRemaining} dias restantes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-800">Previsão Rápida</h3>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon(forecastData.status)}
            <span className={`text-sm font-medium ${getStatusColor(forecastData.status)}`}>
              {forecastData.status === 'on-track' && 'No prazo'}
              {forecastData.status === 'over-budget' && 'Acima do orçamento'}
              {forecastData.status === 'under-budget' && 'Abaixo do orçamento'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600">Gasto Este Mês</p>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(forecastData.currentMonthSpent)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Estimativa Mensal</p>
            <p className="text-xl font-bold text-gray-700">
              {formatCurrency(forecastData.monthlyEstimate)}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progresso</span>
            <span>{Math.round(forecastData.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${
                forecastData.status === 'over-budget' 
                  ? 'bg-red-500' 
                  : forecastData.status === 'under-budget'
                  ? 'bg-blue-500'
                  : 'bg-green-500'
              }`}
              style={{ 
                width: `${Math.min(100, forecastData.progress)}%` 
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{forecastData.daysRemaining} dias restantes</span>
            <span>Gasto semanal: {formatCurrency(forecastData.currentWeekSpent)}</span>
          </div>
        </div>

        {/* Aviso se necessário */}
        {forecastData.status === 'over-budget' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <span className="text-sm font-medium text-red-800">Atenção</span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Você está gastando {formatCurrency(forecastData.currentMonthSpent - forecastData.monthlyEstimate)} 
              {' '}acima da sua média histórica.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
