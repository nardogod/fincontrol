import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

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

  const supabase = createClient();

  useEffect(() => {
    if (!accountId) return;

    loadSettings();
  }, [accountId]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("🔍 Carregando configurações para conta:", accountId);

      // Primeiro, tentar carregar do banco de dados
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("*")
        .eq("account_id", accountId)
        .single();

      if (data && !error) {
        console.log("✅ Configurações encontradas no banco de dados:", data);
        setSettings({
          monthly_budget: data.monthly_budget,
          alert_threshold: data.alert_threshold || 80,
          budget_type: data.budget_type || "flexible",
          auto_adjust: data.auto_adjust || true,
          notifications_enabled: data.notifications_enabled || true,
        });
        setIsLoading(false);
        return;
      }

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.log("❌ Erro ao buscar no banco:", error.message);
      } else {
        console.log("📝 Nenhuma configuração encontrada no banco de dados");
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
          });

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
