"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  EyeOff,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import type { TAccount, TTransaction } from "@/app/lib/types";
import { calculateConsolidatedBalance } from "@/app/lib/account-transfer";
import { formatCurrency } from "@/app/lib/utils";

interface TotalBalanceCardProps {
  accounts: TAccount[];
  transactions: TTransaction[];
}

export default function TotalBalanceCard({
  accounts,
  transactions,
}: TotalBalanceCardProps) {
  const [hideValues, setHideValues] = useState(false);
  const [consolidatedBalance, setConsolidatedBalance] = useState<any>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && accounts.length > 0 && transactions.length >= 0) {
      const balance = calculateConsolidatedBalance(
        accounts, 
        transactions, 
        selectedAccounts.length > 0 ? selectedAccounts : undefined
      );
      setConsolidatedBalance(balance);
    }
  }, [isMounted, accounts, transactions, selectedAccounts]);

  const handleAccountFilter = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter(id => id !== accountId));
    }
  };

  const resetFilters = () => {
    setSelectedAccounts([]);
  };

  if (!isMounted || !consolidatedBalance) {
    return (
      <Card className="mb-6 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
            Saldo Total Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Carregando saldos das contas...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
      <CardHeader>
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <DollarSign className="h-5 w-5 text-green-600" />
             Saldo Total Consolidado
             {selectedAccounts.length > 0 && (
               <span className="text-sm font-normal text-gray-500">
                 ({selectedAccounts.length} conta{selectedAccounts.length > 1 ? 's' : ''} selecionada{selectedAccounts.length > 1 ? 's' : ''})
               </span>
             )}
           </CardTitle>
           <div className="flex items-center gap-2">
             <Button
               onClick={() => setShowFilters(!showFilters)}
               variant="outline"
               size="sm"
               className="flex items-center gap-2"
             >
               <Filter className="h-4 w-4" />
               Filtros
             </Button>
             <Button
               onClick={() => setHideValues(!hideValues)}
               variant="outline"
               size="sm"
               className="flex items-center gap-2"
             >
               {hideValues ? (
                 <EyeOff className="h-4 w-4" />
               ) : (
                 <Eye className="h-4 w-4" />
               )}
               {hideValues ? "Mostrar" : "Ocultar"}
             </Button>
           </div>
         </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Saldo Total */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                Saldo Total
              </span>
            </div>
            <p className="text-3xl font-bold text-green-600">
              {hideValues
                ? "••••••"
                : formatCurrency(consolidatedBalance.totalBalance)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {consolidatedBalance.accountBalances.length} conta(s)
            </p>
          </div>

          {/* Total Receitas */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Receitas
              </span>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {hideValues
                ? "••••••"
                : formatCurrency(consolidatedBalance.totalIncome)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Todas as contas</p>
          </div>

          {/* Total Despesas */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Despesas
              </span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {hideValues
                ? "••••••"
                : formatCurrency(consolidatedBalance.totalExpenses)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Todas as contas</p>
          </div>
        </div>

         {/* Filtros Avançados */}
         {showFilters && (
           <div className="mt-6 pt-4 border-t">
             <div className="flex items-center justify-between mb-4">
               <h4 className="text-sm font-medium text-gray-700">
                 Filtrar por Contas:
               </h4>
               <Button
                 onClick={resetFilters}
                 variant="outline"
                 size="sm"
                 className="flex items-center gap-2"
               >
                 <X className="h-4 w-4" />
                 Limpar Filtros
               </Button>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
               {consolidatedBalance.accountBalances.map((balance: any) => (
                 <label
                   key={balance.accountId}
                   className="flex items-center space-x-2 p-2 bg-white rounded-lg border hover:bg-gray-50 cursor-pointer"
                 >
                   <input
                     type="checkbox"
                     checked={selectedAccounts.includes(balance.accountId)}
                     onChange={(e) => handleAccountFilter(balance.accountId, e.target.checked)}
                     className="rounded"
                   />
                   <span className="text-sm font-medium">{balance.accountName}</span>
                 </label>
               ))}
             </div>
             {selectedAccounts.length > 0 && (
               <p className="text-xs text-gray-500 mt-2">
                 Mostrando saldo de {selectedAccounts.length} conta(s) selecionada(s)
               </p>
             )}
           </div>
         )}

         {/* Resumo por Conta */}
         <div className="mt-6 pt-4 border-t">
           <h4 className="text-sm font-medium text-gray-700 mb-3">
             Resumo por Conta:
           </h4>
           <div className="space-y-2">
             {consolidatedBalance.accountBalances.map((balance: any) => (
               <div
                 key={balance.accountId}
                 className="flex items-center justify-between p-2 bg-white rounded-lg border"
               >
                 <div className="flex items-center gap-2">
                   <div
                     className={`w-3 h-3 rounded-full ${
                       balance.currentBalance >= 0
                         ? "bg-green-500"
                         : "bg-red-500"
                     }`}
                   ></div>
                   <span className="text-sm font-medium">
                     {balance.accountName}
                   </span>
                 </div>
                 <div className="text-right">
                   <p
                     className={`text-sm font-bold ${
                       balance.currentBalance >= 0
                         ? "text-green-600"
                         : "text-red-600"
                     }`}
                   >
                     {hideValues
                       ? "••••"
                       : formatCurrency(balance.currentBalance)}
                   </p>
                   <p className="text-xs text-gray-500">
                     {balance.transactionCount} transações
                   </p>
                 </div>
               </div>
             ))}
           </div>
         </div>
      </CardContent>
    </Card>
  );
}
