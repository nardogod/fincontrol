import { createClient } from "@/app/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function SimpleTransactionsPage() {
  const supabase = createClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/login");
  }

  console.log("🔍 Usuário:", user.email);

  // Buscar TODAS as transações (sem filtro) - CORRIGIDO
  const { data: allTransactions, error: allError } = await supabase
    .from("transactions")
    .select(
      `
      id, type, amount, description, transaction_date, created_via,
      category:categories(name, icon),
      account:accounts(name, icon, user_id)
    `
    )
    .order("transaction_date", { ascending: false });

  console.log("📊 Todas as transações:", allTransactions?.length || 0);
  console.log("❌ Erro:", allError);

  // Buscar contas do usuário
  const { data: userAccounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id);

  console.log("🏦 Contas do usuário:", userAccounts?.length || 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Transações Simples (Debug)
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">
              Total de Transações
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {allTransactions?.length || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">
              Contas do Usuário
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {userAccounts?.length || 0}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-700">Status</h3>
            <p className="text-lg font-bold text-gray-600">
              {allError ? "❌ Erro" : "✅ OK"}
            </p>
          </div>
        </div>

        {/* Error Display */}
        {allError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <h4 className="font-bold">Erro na consulta:</h4>
            <p>{allError.message}</p>
            <p>Código: {allError.code}</p>
          </div>
        )}

        {/* Accounts List */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Contas do Usuário ({userAccounts?.length || 0})
          </h2>
          {userAccounts && userAccounts.length > 0 ? (
            <div className="space-y-2">
              {userAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                >
                  <span className="text-lg">{account.icon}</span>
                  <div>
                    <p className="font-medium">{account.name}</p>
                    <p className="text-sm text-gray-500">ID: {account.id}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma conta encontrada</p>
          )}
        </div>

        {/* Transactions List */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Todas as Transações ({allTransactions?.length || 0})
          </h2>
          {allTransactions && allTransactions.length > 0 ? (
            <div className="space-y-4">
              {allTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {transaction.type === "income" ? "💰" : "💸"}
                      </span>
                      <div>
                        <p className="font-medium">
                          {transaction.category?.[0]?.name || "Sem categoria"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {transaction.account?.name} •{" "}
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(
                            transaction.transaction_date
                          ).toLocaleDateString("pt-BR")}
                          {transaction.created_via &&
                            ` • via ${transaction.created_via}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold text-lg ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {transaction.amount.toFixed(2)} kr
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 text-lg">
                Nenhuma transação encontrada
              </p>
              {allError && (
                <p className="text-red-500 text-sm mt-2">
                  Erro: {allError.message}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
