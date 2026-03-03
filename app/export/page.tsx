import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import ExportPageContent from "./ExportPageContent";

export default async function ExportPage() {
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

  // Fetch export history
  const { data: exportHistory } = await supabase
    .from("export_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    <SidebarWrapper user={user}>
      <ExportPageContent accounts={accounts || []} exportHistory={exportHistory || null} />
    </SidebarWrapper>
  );
}
