"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/app/lib/supabase/client";
import { useEffect, useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Plus,
  Home,
  ArrowRightLeft,
  CreditCard,
  RotateCcw,
} from "lucide-react";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import DeleteAccountButton from "@/app/components/DeleteAccountButton";
import RecoverAccountDialog from "@/app/components/RecoverAccountDialog";
import type { TAccount } from "@/app/lib/types";

export default function AccountsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<
    (TAccount & { is_shared?: boolean; member_role?: string })[]
  >([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Error getting user:", userError);
          setIsLoading(false);
          return;
        }

        setUser(user);

        if (!user) {
          setIsLoading(false);
          return;
        }

        // Buscar contas próprias
        const { data: userAccounts, error: userAccountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (userAccountsError) {
          console.error("Error fetching user accounts:", userAccountsError);
        }

        // Buscar contas compartilhadas
        let sharedAccounts: any[] = [];
        try {
          const { data, error } = await supabase
            .from("account_members")
            .select(
              `
              *,
              account:accounts(
                id,
                name,
                description,
                icon,
                type,
                color,
                is_active,
                created_at,
                updated_at,
                currency
              )
            `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching shared accounts:", error);
          } else {
            sharedAccounts = data || [];
          }
        } catch (error) {
          console.error("Exception fetching shared accounts:", error);
        }

        // Combinar contas próprias e compartilhadas
        const userAccountIds = new Set(
          (userAccounts || []).map((acc: TAccount) => acc.id)
        );
        const sharedAccountData =
          sharedAccounts?.map((member: any) => ({
            ...member.account,
            is_shared: true,
            member_role: member.role,
          })) || [];

        const uniqueSharedAccounts = sharedAccountData.filter(
          (acc: any) => acc && acc.id && !userAccountIds.has(acc.id)
        );

        const allAccounts = [...(userAccounts || []), ...uniqueSharedAccounts];
        setAccounts(allAccounts);

        // Buscar transações para todas as contas
        if (allAccounts.length > 0) {
          const { data: transactionsData, error: transactionsError } =
            await supabase
              .from("transactions")
              .select(
                `
                *,
                category:categories(*),
                account:accounts(*)
              `
              )
              .in(
                "account_id",
                allAccounts.map((a) => a.id)
              )
              .order("transaction_date", { ascending: false });

          if (transactionsError) {
            console.error("Error fetching transactions:", transactionsError);
          } else {
            setTransactions(transactionsData || []);
          }
        }
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirecionar se não houver usuário (após carregamento completo)
  useEffect(() => {
    if (!isLoading && user === null) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  const handleAccountDeleted = () => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Buscar contas próprias
        const { data: userAccounts, error: userAccountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (userAccountsError) {
          console.error("Error fetching user accounts:", userAccountsError);
        }

        // Buscar contas compartilhadas
        let sharedAccounts: any[] = [];
        try {
          const { data, error } = await supabase
            .from("account_members")
            .select(
              `
              *,
              account:accounts(
                id,
                name,
                description,
                icon,
                type,
                color,
                is_active,
                created_at,
                updated_at,
                currency
              )
            `
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

          if (error) {
            console.error("Error fetching shared accounts:", error);
          } else {
            sharedAccounts = data || [];
          }
        } catch (error) {
          console.error("Exception fetching shared accounts:", error);
        }

        // Combinar contas
        const userAccountIds = new Set(
          (userAccounts || []).map((acc: TAccount) => acc.id)
        );
        const sharedAccountData =
          sharedAccounts?.map((member: any) => ({
            ...member.account,
            is_shared: true,
            member_role: member.role,
          })) || [];

        const uniqueSharedAccounts = sharedAccountData.filter(
          (acc: any) => acc && acc.id && !userAccountIds.has(acc.id)
        );

        const allAccounts = [...(userAccounts || []), ...uniqueSharedAccounts];
        setAccounts(allAccounts);

        // Buscar transações
        if (allAccounts.length > 0) {
          const { data: transactionsData, error: transactionsError } =
            await supabase
              .from("transactions")
              .select(
                `
                *,
                category:categories(*),
                account:accounts(*)
              `
              )
              .in(
                "account_id",
                allAccounts.map((a) => a.id)
              )
              .order("transaction_date", { ascending: false });

          if (transactionsError) {
            console.error("Error fetching transactions:", transactionsError);
          } else {
            setTransactions(transactionsData || []);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  };

  if (isLoading) {
    return (
      <SidebarWrapper user={user}>
        <div className="p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Carregando contas...</div>
          </div>
        </div>
      </SidebarWrapper>
    );
  }

  // Calcular saldo total consolidado
  const calculateTotalBalance = () => {
    let totalIncome = 0;
    let totalExpenses = 0;

    transactions.forEach((transaction: any) => {
      if (transaction.type === "income") {
        totalIncome += Number(transaction.amount);
      } else if (transaction.type === "expense") {
        totalExpenses += Number(transaction.amount);
      }
    });

    return {
      totalBalance: totalIncome - totalExpenses,
      totalIncome,
      totalExpenses,
    };
  };

  const balanceData = calculateTotalBalance();

  return (
    <SidebarWrapper user={user}>
      <div className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Minhas Contas
          </h1>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <RecoverAccountDialog>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-xs sm:text-sm"
              >
                <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="hidden sm:inline">Recuperar</span>
              </Button>
            </RecoverAccountDialog>
            <Button
              variant="outline"
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              <ArrowRightLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Transferir</span>
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link
                href="/accounts/new"
                className="flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                Nova Conta
              </Link>
            </Button>
          </div>
        </div>

        {/* Saldo Total Consolidado */}
        <Card className="mb-6 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <span className="text-green-600">💰</span>
              Saldo Total Consolidado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-green-600">💰</span>
                  <span className="text-sm font-medium text-gray-600">
                    Saldo Total
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  R$ {balanceData.totalBalance.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {accounts.length} conta(s)
                </p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-blue-600">📈</span>
                  <span className="text-sm font-medium text-gray-600">
                    Total Receitas
                  </span>
                </div>
                <p className="text-2xl font-bold text-blue-600">
                  R$ {balanceData.totalIncome.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Todas as contas</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-red-600">📉</span>
                  <span className="text-sm font-medium text-gray-600">
                    Total Despesas
                  </span>
                </div>
                <p className="text-2xl font-bold text-red-600">
                  R$ {balanceData.totalExpenses.toFixed(2)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Todas as contas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Contas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            // Calcular estatísticas da conta
            const accountTransactions = transactions.filter(
              (t: any) => t.account_id === account.id
            );

            const accountIncome = accountTransactions
              .filter((t: any) => t.type === "income")
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            const accountExpenses = accountTransactions
              .filter((t: any) => t.type === "expense")
              .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

            const accountBalance = accountIncome - accountExpenses;

            return (
              <Card
                key={account.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: account.color || "#3B82F6" }}
                      >
                        <span className="text-lg">{account.icon || "🏦"}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {account.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 capitalize">
                          {account.type}
                          {account.is_shared && (
                            <span className="ml-2 text-blue-600">
                              (Compartilhada)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    {!account.is_shared && (
                      <DeleteAccountButton
                        accountId={account.id}
                        accountName={account.name}
                        onDeleted={handleAccountDeleted}
                      />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Saldo:</span>
                      <span
                        className={`font-medium ${
                          accountBalance >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        R$ {accountBalance.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Receitas:</span>
                      <span className="font-medium text-blue-600">
                        R$ {accountIncome.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Despesas:</span>
                      <span className="font-medium text-red-600">
                        R$ {accountExpenses.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Moeda:</span>
                      <span className="font-medium">
                        {account.currency || "BRL"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Transações:</span>
                      <span className="font-medium">
                        {accountTransactions.length}
                      </span>
                    </div>
                  </div>

                  {/* Botões de Ação */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                        disabled={accountBalance <= 0}
                      >
                        <ArrowRightLeft className="h-3 w-3 mr-1" />
                        Transferir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-xs"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        PIX/TED
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {accounts.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma conta encontrada
              </h3>
              <p className="text-gray-600 mb-6">
                Crie sua primeira conta para começar a controlar suas finanças
              </p>
              <Link href="/accounts/new">
                <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Primeira Conta
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarWrapper>
  );
}
