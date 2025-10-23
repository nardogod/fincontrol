import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import Dashboard from "@/components/Dashboard";
import type { TAccount, TTransaction, TCategory } from "@/lib/types";

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

  // Fetch user accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  // Fetch categories (default + user categories)
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(
      `is_default.eq.true,account_id.in.(${
        accounts?.map((a) => a.id).join(",") || "null"
      })`
    )
    .order("name");

  // Fetch transactions for current month
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const { data: transactions } = await supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)")
    .gte("transaction_date", firstDayOfMonth.toISOString())
    .lte("transaction_date", lastDayOfMonth.toISOString())
    .order("transaction_date", { ascending: false });

  // Fetch transactions for last 10 months for chart
  const tenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 9, 1);
  const { data: historicalTransactions } = await supabase
    .from("transactions")
    .select("amount, type, transaction_date")
    .gte("transaction_date", tenMonthsAgo.toISOString())
    .eq("type", "expense");

  return (
    <Dashboard
      user={user}
      accounts={(accounts as TAccount[]) || []}
      categories={(categories as TCategory[]) || []}
      transactions={(transactions as any[]) || []}
      historicalTransactions={(historicalTransactions as TTransaction[]) || []}
    />
  );
}
