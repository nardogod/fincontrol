import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TransactionList from "@/components/TransactionList";
import { Plus } from "lucide-react";

interface TransactionsPageProps {
  searchParams: {
    page?: string;
    account?: string;
    category?: string;
    type?: string;
  };
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const page = parseInt(searchParams.page || "1");
  const pageSize = 50;
  const offset = (page - 1) * pageSize;

  // Fetch user accounts
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .eq("is_active", true);

  // Build query
  let query = supabase
    .from("transactions")
    .select("*, category:categories(*), account:accounts(*)", {
      count: "exact",
    })
    .in("account_id", accounts?.map((a) => a.id) || []);

  // Apply filters
  if (searchParams.account) {
    query = query.eq("account_id", searchParams.account);
  }
  if (searchParams.category) {
    query = query.eq("category_id", searchParams.category);
  }
  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }

  // Pagination and ordering
  const { data: transactions, count } = await query
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  // Fetch categories for filters
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(
      `is_default.eq.true,account_id.in.(${
        accounts?.map((a) => a.id).join(",") || "null"
      })`
    )
    .order("name");

  const totalPages = count ? Math.ceil(count / pageSize) : 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Transações</h1>
              <p className="mt-1 text-sm text-slate-600">
                {count} transação{count !== 1 ? "ões" : ""} encontrada
                {count !== 1 ? "s" : ""}
              </p>
            </div>
            <Link href="/transactions/new">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Nova Transação
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionList
              transactions={transactions || []}
              accounts={accounts || []}
              categories={categories || []}
              currentPage={page}
              totalPages={totalPages}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
