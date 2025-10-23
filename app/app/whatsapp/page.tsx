import { redirect } from "next/navigation";
import { createClient, getCurrentUser } from "@/app/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import WhatsAppChat from "@/app/components/WhatsAppChat";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import { MessageCircle, Smartphone } from "lucide-react";

export default async function WhatsAppPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Buscar contas e categorias
  const { data: accounts } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("name");

  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("type")
    .order("name");

  return (
    <SidebarWrapper user={user}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  WhatsApp Chat
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Envie transações via mensagem de texto
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:px-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Chat Interface */}
            <div className="flex justify-center">
              <WhatsAppChat
                accounts={accounts || []}
                categories={categories || []}
              />
            </div>

            {/* Instructions */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Como usar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-medium text-green-600 mb-2">
                      📱 Receitas (Entradas)
                    </h3>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>
                        • <code>receita salário 5000</code>
                      </li>
                      <li>
                        • <code>entrada freelance 1200</code>
                      </li>
                      <li>
                        • <code>investimento 300</code>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-medium text-red-600 mb-2">
                      💸 Despesas (Saídas)
                    </h3>
                    <ul className="text-sm space-y-1 text-gray-600">
                      <li>
                        • <code>gasto mercado 150</code>
                      </li>
                      <li>
                        • <code>despesa transporte 50</code>
                      </li>
                      <li>
                        • <code>compras lazer 200</code>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>💡 Dica:</strong> Use valores em números. O
                      sistema reconhece automaticamente o tipo de transação e
                      categoria baseado nas palavras-chave.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🎯 Palavras-chave reconhecidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium text-green-600 mb-2">
                        Receitas:
                      </h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• receita, entrada</li>
                        <li>• salário, freelance</li>
                        <li>• investimento</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-red-600 mb-2">
                        Despesas:
                      </h4>
                      <ul className="space-y-1 text-gray-600">
                        <li>• gasto, despesa</li>
                        <li>• mercado, compras</li>
                        <li>• transporte, lazer</li>
                        <li>• saúde</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </SidebarWrapper>
  );
}
