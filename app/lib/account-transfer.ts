import type { TAccount, TTransaction } from "./types";

export interface TransferData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: string;
  currentBalance: number;
  totalIncome: number;
  totalExpenses: number;
  transactionCount: number;
}

export interface ConsolidatedBalance {
  totalBalance: number;
  totalIncome: number;
  totalExpenses: number;
  accountBalances: AccountBalance[];
  filteredBalance?: number;
  filteredAccounts?: string[];
}

/**
 * Calcula o saldo de uma conta específica
 */
export function calculateAccountBalance(
  account: TAccount,
  transactions: TTransaction[]
): AccountBalance {
  const accountTransactions = transactions.filter(t => t.account_id === account.id);
  
  const totalIncome = accountTransactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = accountTransactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
    
  const currentBalance = totalIncome - totalExpenses;

  return {
    accountId: account.id,
    accountName: account.name,
    accountType: account.type,
    currentBalance,
    totalIncome,
    totalExpenses,
    transactionCount: accountTransactions.length
  };
}

/**
 * Calcula saldo consolidado de todas as contas
 */
export function calculateConsolidatedBalance(
  accounts: TAccount[],
  transactions: TTransaction[],
  filterAccountIds?: string[]
): ConsolidatedBalance {
  const accountBalances = accounts.map(account => 
    calculateAccountBalance(account, transactions)
  );

  const filteredBalances = filterAccountIds 
    ? accountBalances.filter(balance => filterAccountIds.includes(balance.accountId))
    : accountBalances;

  const totalBalance = filteredBalances.reduce((sum, balance) => sum + balance.currentBalance, 0);
  const totalIncome = filteredBalances.reduce((sum, balance) => sum + balance.totalIncome, 0);
  const totalExpenses = filteredBalances.reduce((sum, balance) => sum + balance.totalExpenses, 0);

  return {
    totalBalance,
    totalIncome,
    totalExpenses,
    accountBalances,
    filteredBalance: filterAccountIds ? totalBalance : undefined,
    filteredAccounts: filterAccountIds
  };
}

/**
 * Valida se uma transferência é possível
 */
export function validateTransfer(
  fromAccount: AccountBalance,
  toAccount: AccountBalance,
  amount: number
): { isValid: boolean; reason?: string } {
  if (amount <= 0) {
    return {
      isValid: false,
      reason: "Valor deve ser maior que zero"
    };
  }

  if (fromAccount.currentBalance < amount) {
    return {
      isValid: false,
      reason: `Saldo insuficiente. Disponível: ${fromAccount.currentBalance.toFixed(2)}`
    };
  }

  if (fromAccount.accountId === toAccount.accountId) {
    return {
      isValid: false,
      reason: "Não é possível transferir para a mesma conta"
    };
  }

  return { isValid: true };
}

/**
 * Cria transações de transferência
 */
export function createTransferTransactions(
  transferData: TransferData
): { outTransaction: Partial<TTransaction>; inTransaction: Partial<TTransaction> } {
  const outTransaction: Partial<TTransaction> = {
    account_id: transferData.fromAccountId,
    type: "expense",
    amount: transferData.amount,
    description: transferData.description || `Transferência para ${transferData.toAccountId}`,
    transaction_date: new Date().toISOString().split('T')[0],
    created_via: "transfer"
  };

  const inTransaction: Partial<TTransaction> = {
    account_id: transferData.toAccountId,
    type: "income",
    amount: transferData.amount,
    description: transferData.description || `Transferência de ${transferData.fromAccountId}`,
    transaction_date: new Date().toISOString().split('T')[0],
    created_via: "transfer"
  };

  return { outTransaction, inTransaction };
}
