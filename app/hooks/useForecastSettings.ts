import { useState, useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { getCurrentUserWithRefresh } from "@/app/lib/auth-helpers";

export interface ForecastSettings {
  monthly_budget: number | null;
  alert_threshold: number;
  budget_type: "fixed" | "flexible";
  auto_adjust: boolean;
  notifications_enabled: boolean;
}

export function useForecastSettings(accountId: string) {
  const [settings, setSettings] = useState<ForecastSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);

  const supabase = createClient();

  useEffect(() => {
    if (!accountId) return;

    retryCountRef.current = 0; // Reset retry count when accountId changes
    loadSettings();
  }, [accountId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Carregando configurações para conta:", accountId);

      // Verificar se o usuário está autenticado (com tentativa de refresh)
      const user = await getCurrentUserWithRefresh();

      if (!user) {
        // Se já tentou 3 vezes, desistir (pode ser que o usuário realmente não esteja autenticado)
        if (retryCountRef.current >= 3) {
          console.log(
            "⏳ Usuário não autenticado após 3 tentativas, usando configurações padrão"
          );
          setSettings({
            monthly_budget: null,
            alert_threshold: 80,
            budget_type: "flexible",
            auto_adjust: true,
            notifications_enabled: true,
          });
          setIsLoading(false);
          return;
        }

        retryCountRef.current += 1;
        console.log(
          `⏳ Usuário não autenticado ao buscar forecast settings, tentativa ${retryCountRef.current}/3...`
        );
        // Aguardar um pouco e tentar novamente (pode ser que a sessão ainda esteja sendo sincronizada)
        setTimeout(() => {
          loadSettings();
        }, 1000);
        return;
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      console.log("✅ Usuário autenticado:", user.id);

      // Primeiro, tentar carregar do banco de dados
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("*")
        .eq("account_id", accountId)
        .single();

      if (data && !error) {
        console.log(
          "✅ useForecastSettings - Configurações encontradas no banco de dados:",
          data
        );
        const typedData = data as any;
        const loadedSettings = {
          monthly_budget: typedData.monthly_budget,
          alert_threshold: typedData.alert_threshold || 80,
          budget_type: typedData.budget_type || "flexible",
          auto_adjust:
            typedData.auto_adjust !== null ? typedData.auto_adjust : true,
          notifications_enabled:
            typedData.notifications_enabled !== null
              ? typedData.notifications_enabled
              : true,
        };
        setSettings(loadedSettings);

        // Sincronizar localStorage com banco (banco é fonte de verdade)
        const localKey = `forecast_settings_${accountId}`;
        localStorage.setItem(localKey, JSON.stringify(loadedSettings));
        console.log(
          "✅ useForecastSettings - localStorage sincronizado com banco"
        );

        setIsLoading(false);
        return;
      }

      // Tratamento específico de erros
      if (error) {
        if (error.code === "PGRST116") {
          // PGRST116 = no rows returned (não é erro, apenas não existe)
          console.log(
            "📝 Nenhuma configuração encontrada no banco de dados para conta:",
            accountId
          );
        } else if (
          error.code === "PGRST301" ||
          error.message?.includes("permission") ||
          error.message?.includes("row-level security")
        ) {
          // Erro de permissão/RLS
          console.error(
            "❌ Erro de permissão ao buscar forecast settings:",
            error.message
          );
          console.error("   Código:", error.code);
          console.error("   Detalhes:", error.details);
          console.error("   Hint:", error.hint);
          // Continuar para tentar localStorage como fallback
        } else {
          console.error(
            "❌ Erro ao buscar no banco:",
            error.message,
            error.code
          );
        }
      }

      // Fallback: tentar carregar do localStorage
      const localKey = `forecast_settings_${accountId}`;
      console.log("🔄 Tentando localStorage com chave:", localKey);
      const localSettings = localStorage.getItem(localKey);

      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        console.log("✅ Configurações encontradas no localStorage:", parsed);
        setSettings({
          monthly_budget: parsed.monthly_budget,
          alert_threshold: parsed.alert_threshold || 80,
          budget_type: parsed.budget_type || "flexible",
          auto_adjust:
            parsed.auto_adjust !== undefined ? parsed.auto_adjust : true,
          notifications_enabled:
            parsed.notifications_enabled !== undefined
              ? parsed.notifications_enabled
              : true,
        });
        setIsLoading(false);
        return;
      }

      // Configurações padrão se não existirem em lugar nenhum
      console.log("📝 Usando configurações padrão");
      setSettings({
        monthly_budget: null,
        alert_threshold: 80,
        budget_type: "flexible",
        auto_adjust: true,
        notifications_enabled: true,
      });
    } catch (err) {
      console.error("❌ Erro ao carregar configurações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ForecastSettings>) => {
    try {
      setError(null);

      console.log(
        "💾 Salvando configurações para conta:",
        accountId,
        newSettings
      );

      // Atualizar estado local primeiro
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : null));

      // Primeiro, tentar salvar no banco de dados
      try {
        const { error } = await supabase
          .from("account_forecast_settings")
          .upsert({
            account_id: accountId,
            ...newSettings,
            updated_at: new Date().toISOString(),
          } as any);

        if (error) {
          console.log("❌ Erro ao salvar no banco:", error.message);
          throw error;
        } else {
          console.log("✅ Configurações salvas no banco de dados com sucesso");
        }
      } catch (dbError) {
        console.log(
          "🔄 Erro ao salvar no banco, usando localStorage:",
          dbError
        );

        // Fallback: salvar no localStorage
        const localKey = `forecast_settings_${accountId}`;
        const currentSettings = { ...settings, ...newSettings };
        localStorage.setItem(localKey, JSON.stringify(currentSettings));
        console.log("✅ Configurações salvas no localStorage como fallback");
      }

      return { success: true };
    } catch (err) {
      console.error("❌ Erro ao atualizar configurações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      return { success: false, error: err };
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    refetch: loadSettings,
  };
}
