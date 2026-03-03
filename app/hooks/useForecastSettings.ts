import { useState, useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { getCurrentUserWithRefresh } from "@/app/lib/auth-helpers";

export interface ForecastSettings {
  monthly_budget: number | null;
  alert_threshold: number;
  budget_type: "fixed" | "flexible";
  auto_adjust: boolean;
  notifications_enabled: boolean;
  // Campos de atualização manual
  last_manual_update?: string | null;
  manual_current_week_spent?: number | null;
  manual_current_month_spent?: number | null;
  manual_remaining_this_month?: number | null;
  manual_projected_monthly_total?: number | null;
  manual_progress_percentage?: number | null;
  manual_status?: string | null;
  manual_status_message?: string | null;
}

export interface ManualForecastUpdate {
  currentWeekSpent: number;
  currentMonthSpent: number;
  remainingThisMonth: number;
  projectedMonthlyTotal: number;
  progressPercentage: number;
  status: string;
  statusMessage: string;
}

export function useForecastSettings(accountId: string) {
  const [settings, setSettings] = useState<ForecastSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retryCountRef = useRef(0);
  const isLoadingRef = useRef(false); // Flag para evitar múltiplas chamadas simultâneas

  const supabase = createClient();

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    retryCountRef.current = 0; // Reset retry count when accountId changes
    isLoadingRef.current = false; // Reset loading flag
    loadSettings();
  }, [accountId]);

  const loadSettings = async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);

      // Verificar se o usuário está autenticado (com tentativa de refresh)
      const user = await getCurrentUserWithRefresh();

      if (!user) {
        // Se já tentou 3 vezes, desistir e usar configurações padrão sem mais tentativas
        if (retryCountRef.current >= 3) {
          setSettings({
            monthly_budget: null,
            alert_threshold: 80,
            budget_type: "flexible",
            auto_adjust: true,
            notifications_enabled: true,
          });
          setIsLoading(false);
          isLoadingRef.current = false;
          return;
        }

        retryCountRef.current += 1;
        // Aguardar antes de tentar novamente (exponencial backoff)
        const delay = Math.min(1000 * retryCountRef.current, 3000);
        isLoadingRef.current = false;
        setTimeout(() => {
          loadSettings();
        }, delay);
        return;
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      // Primeiro, tentar carregar do banco de dados
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("*")
        .eq("account_id", accountId)
        .single();

      if (data && !error) {
        const typedData = data as any;
        const loadedSettings: ForecastSettings = {
          monthly_budget: typedData.monthly_budget,
          alert_threshold: typedData.alert_threshold || 80,
          budget_type: typedData.budget_type || "flexible",
          auto_adjust:
            typedData.auto_adjust !== null ? typedData.auto_adjust : true,
          notifications_enabled:
            typedData.notifications_enabled !== null
              ? typedData.notifications_enabled
              : true,
          // Campos de atualização manual
          last_manual_update: typedData.last_manual_update || null,
          manual_current_week_spent:
            typedData.manual_current_week_spent || null,
          manual_current_month_spent:
            typedData.manual_current_month_spent || null,
          manual_remaining_this_month:
            typedData.manual_remaining_this_month || null,
          manual_projected_monthly_total:
            typedData.manual_projected_monthly_total || null,
          manual_progress_percentage:
            typedData.manual_progress_percentage || null,
          manual_status: typedData.manual_status || null,
          manual_status_message: typedData.manual_status_message || null,
        };
        setSettings(loadedSettings);

        // Sincronizar localStorage com banco (banco é fonte de verdade)
        const localKey = `forecast_settings_${accountId}`;
        localStorage.setItem(localKey, JSON.stringify(loadedSettings));

        setIsLoading(false);
        isLoadingRef.current = false;
        return;
      }

      // Tratamento específico de erros
      if (error) {
        if (error.code === "PGRST116") {
          // PGRST116 = no rows returned (não é erro, apenas não existe)
          // Não precisa logar, é comportamento esperado
        } else if (
          error.code === "PGRST301" ||
          error.message?.includes("permission") ||
          error.message?.includes("row-level security")
        ) {
          // Erro de permissão/RLS - logar apenas em desenvolvimento
          if (process.env.NODE_ENV === "development") {
            console.error(
              "❌ Erro de permissão ao buscar forecast settings:",
              error.message
            );
          }
          // Continuar para tentar localStorage como fallback
        } else if (process.env.NODE_ENV === "development") {
          console.error(
            "❌ Erro ao buscar no banco:",
            error.message,
            error.code
          );
        }
      }

      // Fallback: tentar carregar do localStorage
      const localKey = `forecast_settings_${accountId}`;
      const localSettings = localStorage.getItem(localKey);

      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
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
          isLoadingRef.current = false;
          return;
        } catch (parseError) {
          // Se houver erro ao parsear localStorage, continuar para padrão
        }
      }

      // Configurações padrão se não existirem em lugar nenhum
      setSettings({
        monthly_budget: null,
        alert_threshold: 80,
        budget_type: "flexible",
        auto_adjust: true,
        notifications_enabled: true,
      });
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("❌ Erro ao carregar configurações:", err);
      }
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
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

  const updateManualForecast = async (update: ManualForecastUpdate) => {
    try {
      setError(null);

      console.log("💾 Salvando atualização manual de previsão:", update);

      const manualUpdateData = {
        last_manual_update: new Date().toISOString(),
        manual_current_week_spent: update.currentWeekSpent,
        manual_current_month_spent: update.currentMonthSpent,
        manual_remaining_this_month: update.remainingThisMonth,
        manual_projected_monthly_total: update.projectedMonthlyTotal,
        manual_progress_percentage: update.progressPercentage,
        manual_status: update.status,
        manual_status_message: update.statusMessage,
      };

      // Salvar no banco de dados PRIMEIRO (antes de atualizar estado)
      try {
        const { error } = await supabase
          .from("account_forecast_settings")
          .upsert(
            {
              account_id: accountId,
              ...manualUpdateData,
              updated_at: new Date().toISOString(),
            } as any,
            {
              onConflict: "account_id",
            }
          );

        if (error) {
          console.log("❌ Erro ao salvar atualização manual:", error.message);
          throw error;
        }

        console.log(
          "✅ Atualização manual salva no banco de dados com sucesso"
        );

        // Atualizar estado local APENAS após sucesso do banco
        setSettings((prev) => (prev ? { ...prev, ...manualUpdateData } : null));
      } catch (dbError) {
        console.log("🔄 Erro ao salvar no banco:", dbError);
        // Não atualizar estado se o banco falhar
        throw dbError;
      }

      return { success: true };
    } catch (err) {
      console.error("❌ Erro ao atualizar previsão manual:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
      // Estado não foi atualizado, então não precisa fazer rollback
      return { success: false, error: err };
    }
  };

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateManualForecast,
    refetch: loadSettings,
  };
}
