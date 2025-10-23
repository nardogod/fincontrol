"use client";

import { useMemo } from "react";
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  Target,
  Calendar,
  DollarSign
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { formatCurrency } from "@/app/lib/utils";
import type { TTransaction, TAccount } from "@/app/lib/types";

interface AccountsForecastSummaryProps {
  accounts: TAccount[];
  transactions: TTransaction[];
  historicalTransactions: TTransaction[];
}

interface AccountForecast {
  account: TAccount;
  monthlyEstimate: number;
  currentMonthSpent: number;
  currentWeekSpent: number;
  status: 'on-track' | 'over-budget' | 'under-budget';
  progress: number;
  daysRemaining: number;
}

export default function AccountsForecastSummary({
  accounts,
  transactions,
  historicalTransactions,
}: AccountsForecastSummaryProps) {
  const accountsForecast = useMemo((): AccountForecast[] => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return accounts.map(account => {
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
        account,
        monthlyEstimate,
        currentMonthSpent,
        currentWeekSpent,
        status,
        progress: monthlyEstimate > 0 ? (currentMonthSpent / monthlyEstimate) * 100 : 0,
        daysRemaining,
      };
    });
  }, [accounts, transactions, historicalTransactions]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'over-budget':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'under-budget':
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      default:
        return <Target className="h-4 w-4 text-gray-600" />;
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'on-track':
        return 'No prazo';
      case 'over-budget':
        return 'Acima do orçamento';
      case 'under-budget':
        return 'Abaixo do orçamento';
      default:
        return 'Indisponível';
    }
  };

  // Calcular totais gerais
  const totalMonthlyEstimate = accountsForecast.reduce((sum, f) => sum + f.monthlyEstimate, 0);
  const totalCurrentSpent = accountsForecast.reduce((sum, f) => sum + f.currentMonthSpent, 0);
  const totalWeekSpent = accountsForecast.reduce((sum, f) => sum + f.currentWeekSpent, 0);

  return (
    <div className="space-y-6">
      {/* Resumo Geral */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Target className="h-5 w-5" />
            Resumo de Previsões - Todas as Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">Estimativa Mensal Total</span>
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalMonthlyEstimate)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-700">Gasto Este Mês</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalCurrentSpent)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Gasto Esta Semana</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(totalWeekSpent)}
              </p>
            </div>
          </div>
          
          {/* Barra de progresso geral */}
          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span>Progresso Geral do Mês</span>
              <span>{totalMonthlyEstimate > 0 ? Math.round((totalCurrentSpent / totalMonthlyEstimate) * 100) : 0}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  totalCurrentSpent > totalMonthlyEstimate 
                    ? 'bg-red-500' 
                    : totalCurrentSpent > totalMonthlyEstimate * 0.8
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min(100, totalMonthlyEstimate > 0 ? (totalCurrentSpent / totalMonthlyEstimate) * 100 : 0)}%` 
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Previsões por Conta */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accountsForecast.map((forecast) => (
          <Card 
            key={forecast.account.id} 
            className={`border-l-4 ${
              forecast.status === 'over-budget' 
                ? 'border-l-red-500 bg-red-50' 
                : forecast.status === 'under-budget'
                ? 'border-l-blue-500 bg-blue-50'
                : 'border-l-green-500 bg-green-50'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{forecast.account.icon}</span>
                  <div>
                    <h4 className="font-medium">{forecast.account.name}</h4>
                    <p className="text-xs text-gray-500 capitalize">
                      {forecast.account.type}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(forecast.status)}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gasto Este Mês:</span>
                  <span className="font-medium">
                    {formatCurrency(forecast.currentMonthSpent)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Estimativa Mensal:</span>
                  <span className="font-medium">
                    {formatCurrency(forecast.monthlyEstimate)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Esta Semana:</span>
                  <span className="font-medium">
                    {formatCurrency(forecast.currentWeekSpent)}
                  </span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Progresso</span>
                  <span>{Math.round(forecast.progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      forecast.status === 'over-budget' 
                        ? 'bg-red-500' 
                        : forecast.status === 'under-budget'
                        ? 'bg-blue-500'
                        : 'bg-green-500'
                    }`}
                    style={{ 
                      width: `${Math.min(100, forecast.progress)}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{forecast.daysRemaining} dias restantes</span>
                  <span className={getStatusColor(forecast.status)}>
                    {getStatusLabel(forecast.status)}
                  </span>
                </div>
              </div>

              {/* Aviso se necessário */}
              {forecast.status === 'over-budget' && (
                <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded text-xs">
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                    <span className="font-medium text-red-800">Atenção</span>
                  </div>
                  <p className="text-red-700 mt-1">
                    Acima da média em {formatCurrency(forecast.currentMonthSpent - forecast.monthlyEstimate)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
