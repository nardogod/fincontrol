"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";
import type { TAccount, TRecurringBillPayment } from "@/app/lib/types";

interface RecurringBillInfo {
  account: TAccount;
  payment: TRecurringBillPayment | null;
  isPaid: boolean;
  amount: number;
}

/**
 * Hook para buscar contas fixas (mensalidades) não pagas do mês atual
 */
export function useRecurringBills(accountId: string) {
  const [recurringBills, setRecurringBills] = useState<RecurringBillInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState(0);

  useEffect(() => {
    async function fetchRecurringBills() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        // Obter mês atual no formato YYYY-MM
        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

        // Buscar todas as contas fixas relacionadas à conta atual
        // (assumindo que contas fixas são contas com is_recurring = true)
        // Por enquanto, vamos buscar todas as contas do usuário que são fixas
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError(new Error("Usuário não autenticado"));
          setIsLoading(false);
          return;
        }

        // Buscar contas fixas próprias
        const { data: userAccounts, error: userAccountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("is_recurring", true)
          .eq("is_active", true)
          .eq("user_id", user.id);

        if (userAccountsError) throw userAccountsError;

        // Buscar account_ids das contas compartilhadas
        const { data: sharedAccountIds } = await supabase
          .from("account_members")
          .select("account_id")
          .eq("user_id", user.id);

        const sharedIds = sharedAccountIds?.map((m) => m.account_id) || [];

        // Buscar contas fixas compartilhadas se houver
        let sharedAccounts: any[] = [];
        if (sharedIds.length > 0) {
          const { data: sharedAccountsData, error: sharedAccountsError } = await supabase
            .from("accounts")
            .select("*")
            .eq("is_recurring", true)
            .eq("is_active", true)
            .in("id", sharedIds);

          if (sharedAccountsError) throw sharedAccountsError;
          sharedAccounts = sharedAccountsData || [];
        }

        // Combinar e remover duplicatas
        const allAccounts = [...(userAccounts || []), ...sharedAccounts];
        const accounts = Array.from(
          new Map(allAccounts.map(acc => [acc.id, acc])).values()
        );

        if (!accounts || accounts.length === 0) {
          setRecurringBills([]);
          setTotalUnpaidAmount(0);
          setIsLoading(false);
          return;
        }

        // Buscar pagamentos do mês atual para essas contas
        const accountIds = accounts.map((a) => a.id);
        const { data: payments, error: paymentsError } = await supabase
          .from("recurring_bill_payments")
          .select("*")
          .in("account_id", accountIds)
          .eq("month_year", currentMonthYear);

        if (paymentsError) throw paymentsError;

        // Criar mapa de pagamentos por account_id
        const paymentsMap = new Map<string, TRecurringBillPayment>();
        if (payments) {
          payments.forEach((payment) => {
            paymentsMap.set(payment.account_id, payment);
          });
        }

        // Montar lista de contas fixas com informações de pagamento
        const bills: RecurringBillInfo[] = accounts
          .filter((account) => account.recurring_amount && account.recurring_amount > 0)
          .map((account) => {
            const payment = paymentsMap.get(account.id) || null;
            return {
              account: account as TAccount,
              payment,
              isPaid: payment?.is_paid || false,
              amount: account.recurring_amount || 0,
            };
          });

        setRecurringBills(bills);

        // Calcular total não pago
        const unpaidTotal = bills
          .filter((bill) => !bill.isPaid)
          .reduce((sum, bill) => sum + bill.amount, 0);
        setTotalUnpaidAmount(unpaidTotal);
      } catch (err) {
        console.error("Erro ao buscar contas fixas:", err);
        setError(err instanceof Error ? err : new Error("Erro desconhecido"));
      } finally {
        setIsLoading(false);
      }
    }

    if (accountId) {
      fetchRecurringBills();
    } else {
      setIsLoading(false);
    }
  }, [accountId]);

  return {
    recurringBills,
    totalUnpaidAmount,
    isLoading,
    error,
  };
}

/**
 * Hook simplificado para calcular apenas o total não pago do mês atual
 * Busca TODAS as contas fixas do usuário (não apenas de uma conta específica)
 * Usado no SpendingForecast para deduzir do "Restante Este Mês"
 */
export function useUnpaidRecurringBillsTotal() {
  const [totalUnpaidAmount, setTotalUnpaidAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTotal() {
      try {
        setIsLoading(true);
        const supabase = createClient();

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Obter mês atual no formato YYYY-MM
        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        const currentDate = new Date(now.getFullYear(), now.getMonth(), 1); // Primeiro dia do mês atual

        // Buscar account_ids das contas compartilhadas primeiro
        const { data: sharedAccountIds } = await supabase
          .from("account_members")
          .select("account_id")
          .eq("user_id", user.id);

        const sharedIds = sharedAccountIds?.map((m) => m.account_id) || [];

        // Buscar todas as contas fixas do usuário
        let accountsQuery = supabase
          .from("accounts")
          .select("*")
          .eq("is_recurring", true)
          .eq("is_active", true);

        if (sharedIds.length > 0) {
          accountsQuery = accountsQuery.or(`user_id.eq.${user.id},id.in.(${sharedIds.map(id => `"${id}"`).join(",")})`);
        } else {
          accountsQuery = accountsQuery.eq("user_id", user.id);
        }

        const { data: accounts, error: accountsError } = await accountsQuery;

        if (accountsError) throw accountsError;

        if (!accounts || accounts.length === 0) {
          setTotalUnpaidAmount(0);
          setIsLoading(false);
          return;
        }

        // Buscar pagamentos do mês atual
        const accountIds = accounts.map((a) => a.id);
        const { data: payments, error: paymentsError } = await supabase
          .from("recurring_bill_payments")
          .select("*")
          .in("account_id", accountIds)
          .eq("month_year", currentMonthYear);

        if (paymentsError) throw paymentsError;

        // Criar mapa de pagamentos
        const paymentsMap = new Map<string, boolean>();
        if (payments) {
          payments.forEach((payment) => {
            if (payment.is_paid) {
              paymentsMap.set(payment.account_id, true);
            }
          });
        }

        // Calcular total não pago
        // Verificar se a conta fixa está ativa no período atual
        
        const unpaidTotal = accounts
          .filter((account) => {
            const isPaid = paymentsMap.get(account.id) || false;
            if (isPaid || !account.recurring_amount || account.recurring_amount <= 0) {
              return false;
            }
            
            // Verificar se está dentro do período de vigência
            if (account.recurring_start_date) {
              const startDate = new Date(account.recurring_start_date);
              const startMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
              if (currentDate < startMonth) {
                return false; // Ainda não começou
              }
            }
            
            if (account.recurring_end_date) {
              const endDate = new Date(account.recurring_end_date);
              const endMonth = new Date(endDate.getFullYear(), endDate.getMonth() + 1, 0); // Último dia do mês
              if (currentDate > endMonth) {
                return false; // Já terminou
              }
            }
            
            return true;
          })
          .reduce((sum, account) => sum + (account.recurring_amount || 0), 0);

        setTotalUnpaidAmount(unpaidTotal);
      } catch (err) {
        console.error("Erro ao calcular total de contas fixas não pagas:", err);
        setTotalUnpaidAmount(0);
      } finally {
        setIsLoading(false);
      }
    }

    fetchTotal();
  }, []);

  return { totalUnpaidAmount, isLoading };
}

