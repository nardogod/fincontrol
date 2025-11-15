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
import BulkTransactionForm from "@/app/components/BulkTransactionForm";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import { ArrowLeft } from "lucide-react";

export default async function BulkTransactionPage() {
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

  // Fetch shared accounts
  const { data: sharedAccounts } = await supabase
    .from("account_members")
    .select(
      `
      *,
      account:accounts(*)
    `
    )
    .eq("user_id", user.id);

  const allAccounts = [
    ...(accounts || []),
    ...(sharedAccounts?.map((m: any) => ({
      ...m.account,
      is_shared: true,
      member_role: m.role,
    })) || []),
  ];

  // Fetch categories
  let categoriesQuery = supabase
    .from("categories")
    .select("*");

  // Se há contas, filtrar por contas ou padrões
  if (allAccounts && allAccounts.length > 0) {
    const accountIds = allAccounts.map((a: any) => a.id).filter(Boolean);
    if (accountIds.length > 0) {
      categoriesQuery = categoriesQuery.or(
        `is_default.eq.true,account_id.in.(${accountIds.join(",")})`
      );
    } else {
      // Se não há IDs válidos, buscar apenas padrões
      categoriesQuery = categoriesQuery.eq("is_default", true);
    }
  } else {
    // Se não há contas, buscar apenas categorias padrão
    categoriesQuery = categoriesQuery.eq("is_default", true);
  }

  const { data: categories, error: categoriesError } = await categoriesQuery
    .order("type")
    .order("name");

  if (categoriesError) {
    console.error("Error fetching categories:", categoriesError);
  }

  return (
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex items-center gap-4">
              <Link href="/transactions">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Criar Múltiplas Transações
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Adicione várias transações de uma vez
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-4xl px-4 py-6 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>Transações em Lote</CardTitle>
            </CardHeader>
            <CardContent>
              {allAccounts && allAccounts.length > 0 ? (
                <BulkTransactionForm
                  accounts={allAccounts}
                  categories={categories || []}
                  onSuccess={() => {
                    // Redirect handled by router.refresh() in component
                  }}
                />
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    Você precisa ter pelo menos uma conta para criar transações.
                  </p>
                  <Link href="/accounts">
                    <Button>Criar Conta</Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarWrapper>
  );
}

