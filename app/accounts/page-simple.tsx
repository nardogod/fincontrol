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
import { Plus, Home } from "lucide-react";

export default async function AccountsPageSimple() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar apenas contas do usuário (sem contas compartilhadas)
  const { data: userAccounts, error: userAccountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (userAccountsError) {
    console.error("Error fetching user accounts:", userAccountsError);
  }

  const accounts = userAccounts || [];

  return (
    <div className="flex min-h-screen">
      <div className="w-64 bg-gray-100"></div>
      <main className="flex-1 min-w-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Minhas Contas</h1>
            <Button asChild>
              <Link href="/accounts/new" className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Nova Conta
              </Link>
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl text-white"
                      style={{ backgroundColor: account.color }}
                    >
                      <span className="text-lg">{account.icon}</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.type}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Saldo:</span>
                      <span className="font-medium">R$ 0,00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Moeda:</span>
                      <span className="font-medium">
                        {account.currency || "BRL"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
      </main>
    </div>
  );
}
