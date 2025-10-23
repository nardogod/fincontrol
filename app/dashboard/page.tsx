import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import Dashboard from "@/app/components/Dashboard";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import type { TAccount, TTransaction, TCategory } from "@/app/lib/types";

/**
 * Dashboard page - Server Component
 * Fetches initial data from Supabase with RLS active
 */
export default async function DashboardPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  console.log("Dashboard carregando para usuário:", user.id);

  // Fetch user accounts (personal + shared) - Simplified for debugging
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  console.log("Accounts query result:", { accounts, accountsError });
  console.log("Number of accounts found:", accounts?.length || 0);
  if (accounts && accounts.length > 0) {
    console.log(
      "Account IDs:",
      accounts.map((a) => a.id)
    );
  }

  // Fetch categories (default + user categories)
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .or(
      `is_default.eq.true,account_id.in.(${
        accounts?.map((a) => a.id).join(",") || "null"
      })`
    )
    .order("name");

  console.log("Categories query result:", { categories, categoriesError });

  // Fetch transactions for current month (TEMPORARILY REMOVED DATE FILTER FOR DEBUGGING)
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  console.log("📅 Filtros de data:", {
    firstDayOfMonth: firstDayOfMonth.toISOString(),
    lastDayOfMonth: lastDayOfMonth.toISOString(),
    currentDate: now.toISOString(),
  });

  console.log("🕐 Timestamp do carregamento:", new Date().toISOString());

  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select(
      `
      *, 
      category:categories(*), 
      account:accounts(*)
    `
    )
    .in("account_id", accounts?.map((a) => a.id) || [])
    .order("transaction_date", { ascending: false });

  console.log("Transactions query result:", {
    transactions,
    transactionsError,
  });
  console.log("Number of transactions found:", transactions?.length || 0);
  if (transactions && transactions.length > 0) {
    console.log(
      "Transaction details:",
      transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount,
        account_id: t.account_id,
        date: t.transaction_date,
      }))
    );
  }

  // Fetch transactions for last 10 months for chart
  const tenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 9, 1);
  const { data: historicalTransactions, error: historicalError } =
    await supabase
      .from("transactions")
      .select("amount, type, transaction_date, account_id")
      .in("account_id", accounts?.map((a) => a.id) || [])
      .gte("transaction_date", tenMonthsAgo.toISOString())
      .eq("type", "expense");

  console.log("Historical transactions query result:", {
    historicalTransactions,
    historicalError,
  });

  return (
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8 lg:px-6">
          <Dashboard
            user={user}
            accounts={(accounts as TAccount[]) || []}
            categories={(categories as TCategory[]) || []}
            transactions={(transactions as any[]) || []}
            historicalTransactions={
              (historicalTransactions as TTransaction[]) || []
            }
          />
        </div>
      </div>
    </SidebarWrapper>
  );
}
