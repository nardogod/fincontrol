import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import SidebarWrapper from "@/app/components/SidebarWrapper";

export default async function DashboardPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <SidebarWrapper>
      <div className="p-6">
        <h1>Dashboard Simplificado</h1>
        <p>Usuário: {user.id}</p>
      </div>
    </SidebarWrapper>
  );
}
