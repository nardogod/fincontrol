"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SidebarWrapper from "@/app/components/SidebarWrapper";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/app/components/ui/card";
import { ArrowLeft, CheckCircle2, XCircle, Loader2, Bot } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tTelegram } from "@/app/lib/i18n";

interface TelegramLink {
  id: string;
  telegram_id: number;
  telegram_username: string | null;
  telegram_first_name: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TelegramSettingsPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const { toast } = useToast();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [telegramLink, setTelegramLink] = useState<TelegramLink | null>(null);

  useEffect(() => {
    loadTelegramLink();
  }, []);

  async function loadTelegramLink() {
    try {
      setIsLoading(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data, error } = await supabase
        .from("user_telegram_links")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      setTelegramLink(data || null);
    } catch (error) {
      console.error("Erro ao carregar link do Telegram:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar as configurações do Telegram.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDisconnect() {
    try {
      setIsDisconnecting(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase
        .from("user_telegram_links")
        .update({ is_active: false })
        .eq("user_id", user.id)
        .eq("is_active", true);

      if (error) throw error;

      toast({
        title: "Desconectado!",
        description: "Sua conta do Telegram foi desconectada com sucesso.",
      });

      setTelegramLink(null);
    } catch (error) {
      console.error("Erro ao desconectar:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível desconectar a conta do Telegram.",
      });
    } finally {
      setIsDisconnecting(false);
    }
  }

  function generateAuthLink() {
    // Este link será usado quando o usuário clicar em /start no bot
    return "https://t.me/your_bot_username"; // Substituir pelo username real do bot
  }

  if (isLoading) {
    return (
      <SidebarWrapper>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">{tTelegram.loading[language]}...</p>
          </div>
        </div>
      </SidebarWrapper>
    );
  }

  return (
    <SidebarWrapper>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Header */}
        <div className="border-b bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6 lg:px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/dashboard")}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  {tTelegram.title[language]}
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  {tTelegram.subtitle[language]}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6 lg:px-6">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                {tTelegram.connectionStatus[language]}
              </CardTitle>
              <CardDescription>
                {tTelegram.connectDescription[language]}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {telegramLink ? (
                <>
                  <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                    <div className="flex-1">
                      <p className="font-medium text-green-900">
                        {tTelegram.accountConnected[language]}
                      </p>
                      <p className="text-sm text-green-700">
                        {tTelegram.telegramLinked[language]}
                      </p>
                      {telegramLink.telegram_username && (
                        <p className="text-xs text-green-600 mt-1">
                          @{telegramLink.telegram_username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">{tTelegram.howToUse[language]}</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                      <li>{tTelegram.openTelegram[language]}</li>
                      <li>{tTelegram.useStart[language]}</li>
                      <li>{tTelegram.useGasto[language]}</li>
                      <li>{tTelegram.useReceita[language]}</li>
                      <li>{tTelegram.useHelp[language]}</li>
                    </ul>
                  </div>

                  <div className="pt-4 border-t">
                    <Button
                      variant="destructive"
                      onClick={handleDisconnect}
                      disabled={isDisconnecting}
                    >
                      {isDisconnecting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          {tTelegram.disconnecting[language]}
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-2" />
                          {tTelegram.disconnect[language]}
                        </>
                      )}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <XCircle className="h-6 w-6 text-gray-400" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Conta não conectada
                      </p>
                      <p className="text-sm text-gray-600">
                        Conecte sua conta do Telegram para começar a usar o bot
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Como conectar:</h3>
                      <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
                        <li>
                          Abra o Telegram e procure pelo bot do FinControl
                        </li>
                        <li>Envie o comando /start</li>
                        <li>
                          Clique no botão "Conectar Conta" que aparecerá
                        </li>
                        <li>
                          Você será redirecionado para esta página para confirmar
                        </li>
                      </ol>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-900">
                        <strong>Dica:</strong> O bot do Telegram permite registrar
                        transações rapidamente sem precisar abrir o navegador!
                      </p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarWrapper>
  );
}

