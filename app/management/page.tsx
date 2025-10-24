import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
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
  TrendingUp,
  PieChart,
  Settings,
  Users,
  Download,
  BarChart3,
  Wallet,
  Target,
  AlertCircle,
} from "lucide-react";

export default async function ManagementPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar contas do usuário (próprias)
  const { data: userAccounts, error: userAccountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (userAccountsError) {
    console.error("Error fetching user accounts:", userAccountsError);
  }

  // Buscar contas compartilhadas (onde o usuário é membro)
  let sharedAccounts: any[] = [];
  let sharedAccountsError = null;

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
          updated_at
        )
      `
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shared accounts:", error);
      sharedAccountsError = error;
    } else {
      sharedAccounts = data || [];
    }
  } catch (error) {
    console.error("Exception fetching shared accounts:", error);
    sharedAccountsError = error;
  }

  // Combinar contas próprias e compartilhadas, evitando duplicatas
  const userAccountIds = new Set(
    (userAccounts || []).map((acc: any) => acc.id)
  );
  const sharedAccountData =
    sharedAccounts?.map((member: any) => ({
      ...member.account,
      is_shared: true,
      member_role: member.role,
    })) || [];

  // Filtrar contas compartilhadas que não são próprias
  const uniqueSharedAccounts = sharedAccountData.filter(
    (acc: any) => !userAccountIds.has(acc.id)
  );

  const accounts = [...(userAccounts || []), ...uniqueSharedAccounts];

  // Buscar transações para calcular saldos
  let allTransactions: any[] = [];
  if (accounts && accounts.length > 0) {
    try {
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
            accounts.map((a) => a.id)
          )
          .order("transaction_date", { ascending: false });

      if (transactionsError) {
        console.error("Error fetching all transactions:", transactionsError);
      } else {
        allTransactions = transactionsData || [];
      }
    } catch (error) {
      console.error("Exception fetching all transactions:", error);
    }
  }

  // Calcular saldo total consolidado
  const calculateTotalBalance = () => {
    let totalIncome = 0;
    let totalExpenses = 0;

    allTransactions.forEach((transaction: any) => {
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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo/Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">FinControl</h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <a
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">📊</span>
            Dashboard
          </a>
          <a
            href="/accounts"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">🏦</span>
            Contas
          </a>
          <a
            href="/management"
            className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg"
          >
            <span className="text-lg">⚙️</span>
            Gestão
          </a>
          <a
            href="/transactions"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">💳</span>
            Transações
          </a>
          <a
            href="/export"
            className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <span className="text-lg">📤</span>
            Exportar
          </a>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {(user as any)?.full_name?.charAt(0) ||
                user?.email?.charAt(0) ||
                "U"}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {(user as any)?.full_name || "Usuário"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>
        </div>
      </div>
      
      <main className="flex-1 min-w-0">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestão Financeira</h1>
              <p className="text-gray-600 mt-2">Controle completo das suas finanças</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5" />
                Transferir
              </Button>
              <Button variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                Recuperar
              </Button>
              <Button asChild>
                <Link href="/accounts/new" className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Nova Conta
                </Link>
              </Button>
            </div>
          </div>

          {/* Saldo Total Consolidado - Design Melhorado */}
          <Card className="mb-8 border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wallet className="h-6 w-6 text-green-600" />
                Saldo Total Consolidado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Wallet className="h-5 w-5 text-green-600" />
                    <span className="text-lg font-medium text-gray-700">
                      Saldo Total
                    </span>
                  </div>
                  <p className="text-4xl font-bold text-green-600 mb-2">
                    R$ {balanceData.totalBalance.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {accounts.length} conta(s) ativa(s)
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-lg font-medium text-gray-700">
                      Total Receitas
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-blue-600 mb-2">
                    R$ {balanceData.totalIncome.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Todas as contas</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-red-600 rotate-180" />
                    <span className="text-lg font-medium text-gray-700">
                      Total Despesas
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-red-600 mb-2">
                    R$ {balanceData.totalExpenses.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-500">Todas as contas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cards de Contas - Design Melhorado */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {accounts.map((account) => {
              // Calcular estatísticas da conta
              const accountTransactions = allTransactions.filter(
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
                  className="hover:shadow-xl transition-all duration-300 border-0 shadow-md"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg"
                        style={{ backgroundColor: account.color }}
                      >
                        <span className="text-xl">{account.icon}</span>
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold">
                          {account.name}
                        </CardTitle>
                        <p className="text-sm text-gray-500 capitalize">
                          {account.type}
                          {(account as any).is_shared && (
                            <span className="ml-2 text-blue-600 font-medium">
                              (Compartilhada)
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">Saldo:</span>
                        <span
                          className={`text-lg font-bold ${
                            accountBalance >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          R$ {accountBalance.toFixed(2)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-gray-600">Receitas</span>
                          </div>
                          <p className="text-sm font-bold text-blue-600">
                            R$ {accountIncome.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                            <span className="text-xs font-medium text-gray-600">Despesas</span>
                          </div>
                          <p className="text-sm font-bold text-red-600">
                            R$ {accountExpenses.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Moeda:</span>
                        <span className="font-medium">
                          {account.currency || "BRL"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">Transações:</span>
                        <span className="font-medium">
                          {accountTransactions.length}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Ação - Design Melhorado */}
                    <div className="mt-6 pt-4 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-medium"
                          disabled={accountBalance <= 0}
                        >
                          <ArrowRightLeft className="h-3 w-3 mr-1" />
                          Transferir
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs font-medium"
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

          {/* Menu Inferior com Funções Extras */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="h-5 w-5 text-blue-600" />
                Ferramentas de Gestão
              </CardTitle>
              <p className="text-sm text-gray-600">
                Acesse ferramentas avançadas para gerenciar suas finanças
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                >
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Relatórios</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-200 transition-colors"
                >
                  <PieChart className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Análises</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-200 transition-colors"
                >
                  <Target className="h-6 w-6 text-purple-600" />
                  <span className="text-sm font-medium">Metas</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-200 transition-colors"
                >
                  <Users className="h-6 w-6 text-orange-600" />
                  <span className="text-sm font-medium">Compartilhar</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-red-50 hover:border-red-200 transition-colors"
                >
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span className="text-sm font-medium">Alertas</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                >
                  <Download className="h-6 w-6 text-indigo-600" />
                  <span className="text-sm font-medium">Exportar</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-teal-50 hover:border-teal-200 transition-colors"
                >
                  <TrendingUp className="h-6 w-6 text-teal-600" />
                  <span className="text-sm font-medium">Previsões</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-20 flex flex-col items-center justify-center gap-2 hover:bg-pink-50 hover:border-pink-200 transition-colors"
                >
                  <Settings className="h-6 w-6 text-pink-600" />
                  <span className="text-sm font-medium">Configurações</span>
                </Button>
              </div>
            </CardContent>
          </Card>

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
      </main>
    </div>
  );
}
