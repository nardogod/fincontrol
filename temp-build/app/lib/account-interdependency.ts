import type { TAccount, TTransaction } from "./types";

export interface AccountValue {
  accountId: string;
  accountName: string;
  currentValue: number;
  isDerived: boolean;
  sourceAccountId?: string;
  derivedValue?: number;
}

export interface InterdependencyData {
  mainAccount: AccountValue;
  derivedAccounts: AccountValue[];
  totalAllocated: number;
  remainingInMain: number;
}

/**
 * Calcula a interdependência entre contas
 * A conta principal é a fonte, outras contas derivam dela
 */
export function calculateAccountInterdependency(
  accounts: TAccount[],
  transactions: TTransaction[]
): InterdependencyData | null {
  // 1. Encontrar a conta principal
  const mainAccount = accounts.find(acc => acc.type === "personal" && acc.name.toLowerCase().includes("principal"));
  
  if (!mainAccount) {
    console.warn("Conta principal não encontrada");
    return null;
  }

  // 2. Calcular valor atual da conta principal
  const mainAccountTransactions = transactions.filter(t => t.account_id === mainAccount.id);
  const mainAccountValue = mainAccountTransactions.reduce((sum, t) => {
    return sum + (t.type === "income" ? t.amount : -t.amount);
  }, 0);

  // 3. Encontrar contas derivadas (não principais)
  const derivedAccounts = accounts
    .filter(acc => acc.id !== mainAccount.id)
    .map(account => {
      const accountTransactions = transactions.filter(t => t.account_id === account.id);
      const currentValue = accountTransactions.reduce((sum, t) => {
        return sum + (t.type === "income" ? t.amount : -t.amount);
      }, 0);

      return {
        accountId: account.id,
        accountName: account.name,
        currentValue,
        isDerived: true,
        sourceAccountId: mainAccount.id,
        derivedValue: currentValue
      };
    });

  // 4. Calcular total alocado e restante
  const totalAllocated = derivedAccounts.reduce((sum, acc) => sum + acc.currentValue, 0);
  const remainingInMain = mainAccountValue - totalAllocated;

  return {
    mainAccount: {
      accountId: mainAccount.id,
      accountName: mainAccount.name,
      currentValue: mainAccountValue,
      isDerived: false
    },
    derivedAccounts,
    totalAllocated,
    remainingInMain
  };
}

/**
 * Cria uma transação de derivação entre contas
 */
export function createDerivationTransaction(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description: string = "Derivação automática entre contas"
): Partial<TTransaction> {
  return {
    account_id: toAccountId,
    type: "income",
    amount,
    description,
    transaction_date: new Date().toISOString().split('T')[0],
    created_via: "system"
  };
}

/**
 * Valida se uma derivação é possível
 */
export function validateDerivation(
  mainAccountValue: number,
  requestedAmount: number,
  currentAllocated: number
): { isValid: boolean; reason?: string } {
  const availableAmount = mainAccountValue - currentAllocated;
  
  if (requestedAmount > availableAmount) {
    return {
      isValid: false,
      reason: `Valor solicitado (${requestedAmount}) excede o disponível na conta principal (${availableAmount})`
    };
  }

  if (requestedAmount <= 0) {
    return {
      isValid: false,
      reason: "Valor deve ser maior que zero"
    };
  }

  return { isValid: true };
}
