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
import SidebarWrapper from "@/app/components/SidebarWrapper";
import { Plus, Home, Building, Car, Users, Settings } from "lucide-react";

export default async function AccountsPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar contas do usuário (simplified for debugging)
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  console.log("Accounts query result:", { accounts, accountsError });

  // Buscar membros das contas separadamente
  const { data: accountMembers } = await supabase
    .from("account_members")
    .select(
      `
      *,
      user:users(full_name, email)
    `
    )
    .in("account_id", accounts?.map((a) => a.id) || []);

  // Buscar convites pendentes
  const { data: pendingInvites } = await supabase
    .from("account_invites")
    .select("*")
    .eq("email", user.email)
    .eq("status", "pending");

  // Buscar transações históricas para previsões (últimos 6 meses)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const { data: historicalTransactions } = await supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(*),
      account:accounts(*)
    `
    )
    .in("account_id", accounts?.map((a) => a.id) || [])
    .gte("transaction_date", sixMonthsAgo.toISOString())
    .order("transaction_date", { ascending: false });

  // Buscar transações do mês atual
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: currentMonthTransactions } = await supabase
    .from("transactions")
    .select(
      `
      *,
      category:categories(*),
      account:accounts(*)
    `
    )
    .in("account_id", accounts?.map((a) => a.id) || [])
    .gte("transaction_date", firstDayOfMonth.toISOString())
    .lte("transaction_date", lastDayOfMonth.toISOString())
    .order("transaction_date", { ascending: false });

  const getAccountIcon = (type: string) => {
    switch (type) {
      case "personal":
        return <Home className="h-5 w-5" />;
      case "shared":
        return <Users className="h-5 w-5" />;
      case "business":
        return <Building className="h-5 w-5" />;
      case "vehicle":
        return <Car className="h-5 w-5" />;
      default:
        return <Home className="h-5 w-5" />;
    }
  };

  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case "personal":
        return "Pessoal";
      case "shared":
        return "Compartilhada";
      case "business":
        return "Empresa";
      case "vehicle":
        return "Veículo";
      default:
        return "Pessoal";
    }
  };

  return (
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Minhas Contas
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Gerencie suas contas pessoais e compartilhadas
                </p>
              </div>
              <Link href="/accounts/new">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:px-6">
          {/* Convites Pendentes */}
          {pendingInvites && pendingInvites.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-orange-800">
                  Convites Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border"
                    >
                      <div>
                        <p className="font-medium">
                          Convite para: {invite.account_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          Enviado por: {invite.invited_by_name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Aceitar
                        </Button>
                        <Button size="sm" variant="ghost">
                          Recusar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lista de Contas */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts?.map((account) => (
              <Card
                key={account.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                        style={{ backgroundColor: account.color }}
                      >
                        {getAccountIcon(account.type)}
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {account.name}
                        </CardTitle>
                        <p className="text-sm text-gray-600">
                          {getAccountTypeLabel(account.type)}
                        </p>
                      </div>
                    </div>
                    <Link href={`/accounts/${account.id}/settings`}>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Membros - Temporarily simplified */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Membros (1)
                      </p>
                      <div className="space-y-1">
                        {account.account_members
                          ?.slice(0, 3)
                          .map((member: any) => (
                            <div
                              key={member.user_id}
                              className="flex items-center gap-2 text-sm"
                            >
                              <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-xs font-medium">
                                  {member.user?.full_name?.charAt(0) || "?"}
                                </span>
                              </div>
                              <span>{member.user?.full_name || "Usuário"}</span>
                              {member.role === "owner" && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                  Owner
                                </span>
                              )}
                            </div>
                          ))}
                        {account.account_members &&
                          account.account_members.length > 3 && (
                            <p className="text-xs text-gray-500">
                              +{account.account_members.length - 3} mais
                            </p>
                          )}
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/dashboard?account=${account.id}`}
                        className="flex-1"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          Acessar
                        </Button>
                      </Link>
                      <Link
                        href={`/accounts/${account.id}/settings`}
                        className="flex-1"
                      >
                        <Button variant="ghost" size="sm" className="w-full">
                          Configurar
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Estado vazio */}
          {(!accounts || accounts.length === 0) && (
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
      </div>
    </SidebarWrapper>
  );
}
