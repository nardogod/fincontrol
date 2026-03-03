import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import TransactionForm from "@/app/components/TransactionForm";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import NewTransactionHeader, { NewTransactionCardTitle } from "./NewTransactionHeader";

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
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <NewTransactionHeader />

        <div className="container mx-auto max-w-3xl px-4 py-6 lg:px-6">
          <Card>
            <CardHeader>
              <CardTitle>
                <NewTransactionCardTitle />
              </CardTitle>
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
    </SidebarWrapper>
  );
}
