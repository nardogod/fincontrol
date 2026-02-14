import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import ExportDialog from "@/app/components/ExportDialog";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import { Download, FileSpreadsheet, Table } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <Download className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Exportar Dados
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Baixe suas transações em diferentes formatos
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto max-w-5xl px-4 py-6 lg:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Export Options */}
            <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500 text-white">
                  <Table className="h-5 w-5" />
                </div>
                <CardTitle>Exportar como CSV</CardTitle>
                <CardDescription>
                  Baixe suas transações em formato CSV para usar em planilhas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportDialog accounts={accounts || []} format="csv" />
              </CardContent>
            </Card>

            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white">
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <CardTitle>Exportar como Excel</CardTitle>
                <CardDescription>
                  Planilha por mês com totais para análise
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ExportDialog accounts={accounts || []} format="excel" />
              </CardContent>
            </Card>
          </div>

          {/* Export History */}
          {exportHistory && exportHistory.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Histórico de Exportações</CardTitle>
                <CardDescription>Suas últimas exportações</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {exportHistory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-lg border bg-white p-3"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          {item.format.toUpperCase()} Export
                        </p>
                        <p className="text-sm text-slate-600">
                          {new Date(item.period_start).toLocaleDateString(
                            "pt-BR"
                          )}{" "}
                          -{" "}
                          {new Date(item.period_end).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(item.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </SidebarWrapper>
  );
}
