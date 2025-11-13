"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/lib/supabase/client";
import { getCurrentUserWithRefresh } from "@/app/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function TelegramAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verificando token...");
  const supabase = createClient();

  useEffect(() => {
    async function authenticate() {
      try {
        // Pegar token da URL
        const params = new URLSearchParams(window.location.search);
        const token = params.get("token");

        console.log("🔍 Verificando token:", token ? "Token presente" : "Token ausente");

        if (!token) {
          setStatus("error");
          setMessage("Token não fornecido.");
          return;
        }

        // Verificar sessão atual primeiro
        console.log("🔍 Verificando sessão atual...");
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("❌ Erro ao obter sessão:", sessionError);
        } else {
          console.log("📋 Sessão atual:", currentSession ? `Usuário: ${currentSession.user?.id}` : "Nenhuma sessão");
        }

        // Verificar se usuário está autenticado (com tentativa de refresh)
        console.log("🔍 Verificando autenticação do usuário...");
        const user = await getCurrentUserWithRefresh();

        console.log("👤 Usuário:", user ? `ID: ${user.id}, Email: ${user.email}` : "Não autenticado");

        if (!user) {
          setStatus("error");
          setMessage(
            "Você precisa estar logado no site FinControl para vincular sua conta do Telegram.\n\n" +
            "Redirecionando para login..."
          );
          setTimeout(() => {
            const redirectUrl = `/telegram/auth?token=${token}`;
            console.log("🔄 Redirecionando para login com redirect:", redirectUrl);
            router.push(`/login?redirect=${encodeURIComponent(redirectUrl)}`);
          }, 3000);
          return;
        }

        // Buscar token no banco
        console.log("🔍 Buscando token no banco de dados...");
        const { data: tokenData, error: tokenError } = await supabase
          .from("telegram_auth_tokens")
          .select("*")
          .eq("token", token)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (tokenError) {
          console.error("❌ Erro ao buscar token:", tokenError);
          setStatus("error");
          setMessage("Token inválido ou expirado. Tente novamente no Telegram.");
          return;
        }

        if (!tokenData) {
          console.error("❌ Token não encontrado ou expirado");
          setStatus("error");
          setMessage("Token inválido ou expirado. Tente novamente no Telegram.");
          return;
        }

        console.log("✅ Token válido encontrado. Telegram ID:", tokenData.telegram_id);

        // Vincular conta do Telegram ao usuário
        console.log("🔗 Vinculando conta do Telegram ao usuário...");
        const { data: linkData, error: linkError } = await supabase.from("user_telegram_links").upsert(
          {
            user_id: user.id,
            telegram_id: tokenData.telegram_id,
            telegram_username: null, // Pode ser atualizado depois
            telegram_first_name: null,
            is_active: true,
          },
          {
            onConflict: "telegram_id",
          }
        ).select();

        if (linkError) {
          console.error("❌ Erro ao vincular conta:", linkError);
          console.error("Detalhes:", JSON.stringify(linkError, null, 2));
          setStatus("error");
          setMessage(`Erro ao vincular conta: ${linkError.message}. Tente novamente.`);
          return;
        }

        console.log("✅ Conta vinculada com sucesso:", linkData);

        // Deletar token usado
        console.log("🗑️ Deletando token usado...");
        await supabase.from("telegram_auth_tokens").delete().eq("token", token);

        setStatus("success");
        setMessage("✅ Conta vinculada com sucesso! Você pode voltar ao Telegram agora.");
      } catch (error) {
        console.error("❌ Erro na autenticação:", error);
        if (error instanceof Error) {
          console.error("Mensagem:", error.message);
          console.error("Stack:", error.stack);
        }
        setStatus("error");
        setMessage(`Erro ao processar autenticação: ${error instanceof Error ? error.message : "Erro desconhecido"}. Tente novamente.`);
      }
    }

    authenticate();
  }, [router, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            🔐 Vincular Telegram
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center justify-center py-8">
            {status === "loading" && (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-blue-500 mb-4" />
                <p className="text-gray-600">{message}</p>
              </>
            )}

            {status === "success" && (
              <>
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-gray-600 text-center">{message}</p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="mt-4"
                >
                  Ir para Dashboard
                </Button>
              </>
            )}

            {status === "error" && (
              <>
                <XCircle className="h-12 w-12 text-red-500 mb-4" />
                <p className="text-gray-600 text-center">{message}</p>
                <Button
                  onClick={() => router.push("/dashboard")}
                  variant="outline"
                  className="mt-4"
                >
                  Voltar
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

