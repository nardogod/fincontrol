"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tAccounts } from "@/app/lib/i18n";
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
  const { language } = useLanguage();
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
      userId: "", // Será preenchido automaticamente no hook
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-blue-600" />
            {tAccounts.transferBetween[language]}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fromAccount">{tAccounts.originAccount[language]}</Label>
                <select
                  id="fromAccount"
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">{tAccounts.selectOrigin[language]}</option>
                  {accountBalances.map((balance) => (
                    <option key={balance.accountId} value={balance.accountId}>
                      {balance.accountName} -{" "}
                      {formatCurrency(balance.currentBalance)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="toAccount">{tAccounts.destinationAccount[language]}</Label>
                <select
                  id="toAccount"
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">{tAccounts.selectDestination[language]}</option>
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
                <Label htmlFor="amount">{tAccounts.transferValue[language]}</Label>
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
                <Label htmlFor="description">{tAccounts.descriptionOptional[language]}</Label>
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
                  <span className="font-medium">{tAccounts.transferSummary[language]}</span>
                </div>
                <p className="text-sm text-gray-600">
                  {tAccounts.transfer[language]}{" "}
                  <strong>{formatCurrency(parseFloat(transferAmount))}</strong>{" "}
                  {tAccounts.from[language]}{" "}
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
              {isTransferring ? tAccounts.transferring[language] : tAccounts.doTransfer[language]}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Saldos das Contas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-purple-600" />
            {tAccounts.accountBalances[language]}
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
                      {balance.transactionCount} {tAccounts.transactionsCount[language]} •{" "}
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

function AccountTransferLoading() {
  const { language } = useLanguage();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-blue-600" />
          {tAccounts.transferBetween[language]}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500">{tAccounts.loadingTransfers[language]}</p>
      </CardContent>
    </Card>
  );
}

// Export com carregamento dinâmico para evitar problemas de hidratação
const AccountTransfer = dynamic(
  () => Promise.resolve(AccountTransferComponent),
  {
    ssr: false,
    loading: () => <AccountTransferLoading />,
  }
);

export default AccountTransfer;
