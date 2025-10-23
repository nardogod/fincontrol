"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { 
  Calculator, 
  ArrowRight, 
  AlertTriangle, 
  CheckCircle,
  TrendingUp,
  TrendingDown
} from "lucide-react";
import type { TAccount, TTransaction } from "@/app/lib/types";
import { 
  calculateAccountInterdependency, 
  type InterdependencyData,
  validateDerivation 
} from "@/app/lib/account-interdependency";
import { formatCurrency } from "@/app/lib/utils";
import { useAccountDerivation } from "@/app/hooks/useAccountDerivation";

interface AccountInterdependencyProps {
  accounts: TAccount[];
  transactions: TTransaction[];
  onUpdateTransaction?: (transaction: Partial<TTransaction>) => void;
}

export default function AccountInterdependency({
  accounts,
  transactions,
  onUpdateTransaction
}: AccountInterdependencyProps) {
  const [interdependencyData, setInterdependencyData] = useState<InterdependencyData | null>(null);
  const [derivationAmount, setDerivationAmount] = useState<string>("");
  const [selectedTargetAccount, setSelectedTargetAccount] = useState<string>("");
  const { createDerivation, isCreating } = useAccountDerivation();

  useEffect(() => {
    const data = calculateAccountInterdependency(accounts, transactions);
    setInterdependencyData(data);
  }, [accounts, transactions]);

  const handleCreateDerivation = async () => {
    if (!interdependencyData || !selectedTargetAccount || !derivationAmount) return;

    const amount = parseFloat(derivationAmount);
    const validation = validateDerivation(
      interdependencyData.mainAccount.currentValue,
      amount,
      interdependencyData.totalAllocated
    );

    if (!validation.isValid) {
      alert(validation.reason);
      return;
    }

    const result = await createDerivation({
      fromAccountId: interdependencyData.mainAccount.accountId,
      toAccountId: selectedTargetAccount,
      amount,
      description: `Derivação automática - ${new Date().toLocaleDateString()}`
    });

    if (result.success) {
      setDerivationAmount("");
      setSelectedTargetAccount("");
      // Recarregar página para atualizar dados
      window.location.reload();
    }
  };

  if (!interdependencyData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Interdependência de Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-gray-600">
              Conta principal não encontrada. Crie uma conta do tipo "personal" 
              com "principal" no nome para ativar a interdependência.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo da Conta Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Conta Principal: {interdependencyData.mainAccount.accountName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(interdependencyData.mainAccount.currentValue)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Alocado</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(interdependencyData.totalAllocated)}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">Restante</p>
              <p className={`text-2xl font-bold ${
                interdependencyData.remainingInMain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(interdependencyData.remainingInMain)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contas Derivadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-blue-600" />
            Contas Derivadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {interdependencyData.derivedAccounts.map((account) => (
              <div key={account.accountId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <div>
                    <p className="font-medium">{account.accountName}</p>
                    <p className="text-sm text-gray-600">
                      Derivada da conta principal
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-blue-600">
                    {formatCurrency(account.currentValue)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((account.currentValue / interdependencyData.mainAccount.currentValue) * 100).toFixed(1)}% do total
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Criar Nova Derivação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Criar Nova Derivação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Valor a Derivar</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={derivationAmount}
                  onChange={(e) => setDerivationAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="targetAccount">Conta de Destino</Label>
                <select
                  id="targetAccount"
                  value={selectedTargetAccount}
                  onChange={(e) => setSelectedTargetAccount(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Selecione uma conta</option>
                  {interdependencyData.derivedAccounts.map((account) => (
                    <option key={account.accountId} value={account.accountId}>
                      {account.accountName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {derivationAmount && selectedTargetAccount && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium">Resumo da Derivação</span>
                </div>
                <p className="text-sm text-gray-600">
                  Transferir <strong>{formatCurrency(parseFloat(derivationAmount))}</strong> da conta principal 
                  para <strong>{interdependencyData.derivedAccounts.find(a => a.accountId === selectedTargetAccount)?.accountName}</strong>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Restante na principal: {formatCurrency(interdependencyData.remainingInMain - parseFloat(derivationAmount))}
                </p>
              </div>
            )}

            <Button 
              onClick={handleCreateDerivation}
              disabled={!derivationAmount || !selectedTargetAccount || isCreating}
              className="w-full"
            >
              {isCreating ? "Criando..." : "Criar Derivação"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
