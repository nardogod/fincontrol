import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient, getCurrentUser } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TransactionForm from "@/components/TransactionForm";
import { ArrowLeft } from "lucide-react";

export default async function NewTransactionPage() {
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

  // Fetch categories
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .or(
      `is_default.eq.true,account_id.in.(${
        accounts?.map((a) => a.id).join(",") || "null"
      })`
    )
    .order("type")
    .order("name");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex items-center gap-4">
            <Link href="/transactions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">
                Nova Transação
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Adicione uma entrada ou saída
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Detalhes da Transação</CardTitle>
          </CardHeader>
          <CardContent>
            <TransactionForm
              accounts={accounts || []}
              categories={categories || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
