import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="p-6">
      <h1>Dashboard Ultra Simplificado</h1>
      <p>Usuário: {user.id}</p>
    </div>
  );
}