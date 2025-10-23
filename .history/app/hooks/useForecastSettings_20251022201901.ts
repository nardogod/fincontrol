import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface ForecastSettings {
  monthly_budget: number | null;
  alert_threshold: number;
  budget_type: 'fixed' | 'flexible';
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

      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("*")
        .eq("account_id", accountId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setSettings({
          monthly_budget: data.monthly_budget,
          alert_threshold: data.alert_threshold || 80,
          budget_type: data.budget_type || 'flexible',
          auto_adjust: data.auto_adjust || true,
          notifications_enabled: data.notifications_enabled || true,
        });
      } else {
        // Configurações padrão se não existirem
        setSettings({
          monthly_budget: null,
          alert_threshold: 80,
          budget_type: 'flexible',
          auto_adjust: true,
          notifications_enabled: true,
        });
      }
    } catch (err) {
      console.error("Erro ao carregar configurações:", err);
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setIsLoading(false);
    }
  };

  const updateSettings = async (newSettings: Partial<ForecastSettings>) => {
    try {
      setError(null);

      const { error } = await supabase
        .from("account_forecast_settings")
        .upsert({
          account_id: accountId,
          ...newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Atualizar estado local
      setSettings(prev => prev ? { ...prev, ...newSettings } : null);
      
      return { success: true };
    } catch (err) {
      console.error("Erro ao atualizar configurações:", err);
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
