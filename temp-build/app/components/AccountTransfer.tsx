"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  ArrowRightLeft,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { TAccount, TTransaction } from "@/app/lib/types";
import {
  calculateAccountBalance,
  calculateConsolidatedBalance,
  type AccountBalance,
  type ConsolidatedBalance,
} from "@/app/lib/account-transfer";
import { useAccountTransfer } from "@/app/hooks/useAccountTransfer";
import { formatCurrency } from "@/app/lib/utils";

interface AccountTransferProps {
  accounts: TAccount[];
  transactions: TTransaction[];
  onTransferComplete?: () => void;
}

function AccountTransferComponent({
  accounts,
  transactions,
  onTransferComplete,
}: AccountTransferProps) {
  const [fromAccountId, setFromAccountId] = useState<string>("");
  const [toAccountId, setToAccountId] = useState<string>("");
  const [transferAmount, setTransferAmount] = useState<string>("");
  const [transferDescription, setTransferDescription] = useState<string>("");
  const [accountBalances, setAccountBalances] = useState<AccountBalance[]>([]);
  const [consolidatedBalance, setConsolidatedBalance] =
    useState<ConsolidatedBalance | null>(null);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const { createTransfer, validateTransferData, isTransferring } =
    useAccountTransfer();

  useEffect(() => {
    const balances = accounts.map((account) =>
      calculateAccountBalance(account, transactions)
    );
    setAccountBalances(balances);

    const consolidated = calculateConsolidatedBalance(accounts, transactions);
    setConsolidatedBalance(consolidated);
  }, [accounts, transactions]);

  const handleTransfer = async () => {
    if (!fromAccountId || !toAccountId || !transferAmount) return;

    const fromAccount = accountBalances.find(
      (b) => b.accountId === fromAccountId
    );
    const toAccount = accountBalances.find((b) => b.accountId === toAccountId);

    if (!fromAccount || !toAccount) return;

    const amount = parseFloat(transferAmount);
    const validation = validateTransferData(fromAccount, toAccount, amount);

    if (!validation.isValid) {
      alert(validation.reason);
      return;
    }

    const result = await createTransfer({
      fromAccountId,
      toAccountId,
      amount,
      description:
        transferDescription ||
        `Transferência - ${new Date().toLocaleDateString()}`,
    });

    if (result.success) {
      setFromAccountId("");
      setToAccountId("");
      setTransferAmount("");
      setTransferDescription("");
      onTransferComplete?.();
    }
  };

  const handleAccountFilter = (accountId: string, checked: boolean) => {
    if (checked) {
      setSelectedAccounts([...selectedAccounts, accountId]);
    } else {
      setSelectedAccounts(selectedAccounts.filter((id) => id !== accountId));
    }
  };

  const filteredBalance =
    selectedAccounts.length > 0
      ? calculateConsolidatedBalance(accounts, transactions, selectedAccounts)
      : consolidatedBalance;

  return (
    <div className="space-y-6">
      {/* Saldo Consolidado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Saldo Consolidado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Saldo Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredBalance?.totalBalance || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Receitas</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(filteredBalance?.totalIncome || 0)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(filteredBalance?.totalExpenses || 0)}
              </p>
            </div>
          </div>

          {/* Filtros de Contas */}
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-3">Filtrar por contas:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {accountBalances.map((balance) => (
                <label
                  key={balance.accountId}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(balance.accountId)}
                    onChange={(e) =>
                      handleAccountFilter(balance.accountId, e.target.checked)
                    }
                    className="rounded"
                  />
                  <span className="text-sm">{balance.accountName}</span>
                </label>
              ))}
            </div>
            {selectedAccounts.length > 0 && (
              <p className="text-xs text-gray-500 mt-2">
                Mostrando saldo de {selectedAccounts.length} conta(s)
                selecionada(s)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Transferência entre Contas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transferência entre Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAccount">Conta de Origem</Label>
                <select
                  id="fromAccount"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione a conta de origem</option>
                  {accountBalances.map((balance) => (
                    <option key={balance.accountId} value={balance.accountId}>
                      {balance.accountName} -{" "}
                      {formatCurrency(balance.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="toAccount">Conta de Destino</Label>
                <select
                  id="toAccount"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione a conta de destino</option>
                  {accountBalances.map((balance) => (
                    <option key={balance.accountId} value={balance.accountId}>
                      {balance.accountName} -{" "}
                      {formatCurrency(balance.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor da Transferência</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Input
                  id="description"
                  value={transferDescription}
                  onChange={(e) => setTransferDescription(e.target.value)}
                  placeholder="Ex: Transferência mensal"
                />
              </div>
            </div>

            {/* Validação da Transferência */}
            {fromAccountId && toAccountId && transferAmount && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Resumo da Transferência</span>
                </div>
                <p className="text-sm text-gray-600">
                  Transferir{" "}
                  <strong>{formatCurrency(parseFloat(transferAmount))}</strong>{" "}
                  de{" "}
                  <strong>
                    {
                      accountBalances.find((b) => b.accountId === fromAccountId)
                        ?.accountName
                    }
                  </strong>{" "}
                  para{" "}
                  <strong>
                    {
                      accountBalances.find((b) => b.accountId === toAccountId)
                        ?.accountName
                    }
                  </strong>
                </p>
                {(() => {
                  const fromAccount = accountBalances.find(
                    (b) => b.accountId === fromAccountId
                  );
                  const toAccount = accountBalances.find(
                    (b) => b.accountId === toAccountId
                  );
                  if (fromAccount && toAccount) {
                    const validation = validateTransferData(
                      fromAccount,
                      toAccount,
                      parseFloat(transferAmount)
                    );
                    if (!validation.isValid) {
                      return (
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-4 w-4" />
                          {validation.reason}
                        </p>
                      );
                    }
                  }
                  return null;
                })()}
              </div>
            )}

            <Button
              onClick={handleTransfer}
              disabled={
                !fromAccountId ||
                !toAccountId ||
                !transferAmount ||
                isTransferring
              }
              className="w-full"
            >
              {isTransferring ? "Transferindo..." : "Realizar Transferência"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Saldos das Contas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            Saldos das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {accountBalances.map((balance) => (
              <div
                key={balance.accountId}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      balance.currentBalance >= 0
                        ? "bg-green-500"
                        : "bg-red-500"
                    }`}
                  ></div>
                  <div>
                    <p className="font-medium">{balance.accountName}</p>
                    <p className="text-sm text-gray-600">
                      {balance.transactionCount} transações •{" "}
                      {balance.accountType}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`text-lg font-bold ${
                      balance.currentBalance >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(balance.currentBalance)}
                  </p>
                  <div className="flex gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatCurrency(balance.totalIncome)}
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {formatCurrency(balance.totalExpenses)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Export com carregamento dinâmico para evitar problemas de hidratação
const AccountTransfer = dynamic(
  () => Promise.resolve(AccountTransferComponent),
  {
    ssr: false,
    loading: () => (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            Transferência entre Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Carregando transferências...</p>
        </CardContent>
      </Card>
    ),
  }
);

export default AccountTransfer;
