"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/app/lib/supabase/client";

interface AccountBudget {
  monthly_budget: number | null;
  alert_threshold: number;
}

export function useAccountBudget(accountId: string) {
  const [budget, setBudget] = useState<AccountBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    loadBudget();
  }, [accountId]);

  const loadBudget = async () => {
    try {
      setIsLoading(true);

      // Primeiro, tentar carregar do localStorage
      const localKey = `forecast_settings_${accountId}`;
      const localSettings = localStorage.getItem(localKey);

      if (localSettings) {
        const parsed = JSON.parse(localSettings);
        setBudget({
          monthly_budget: parsed.monthly_budget,
          alert_threshold: parsed.alert_threshold || 80,
        });
        setIsLoading(false);
        return;
      }

      // Tentar carregar do banco de dados
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("monthly_budget, alert_threshold")
        .eq("account_id", accountId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.log("Tabela account_forecast_settings não existe ainda");
      }

      if (data) {
        setBudget({
          monthly_budget: data.monthly_budget,
          alert_threshold: data.alert_threshold || 80,
        });
      } else {
        // Configurações padrão
        setBudget({
          monthly_budget: null,
          alert_threshold: 80,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      setBudget({
        monthly_budget: null,
        alert_threshold: 80,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { budget, isLoading };
}
