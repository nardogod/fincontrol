"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { getCurrentUserWithRefresh } from "@/app/lib/auth-helpers";

interface AccountBudget {
  monthly_budget: number | null;
  alert_threshold: number;
}

export function useAccountBudget(accountId: string) {
  const [budget, setBudget] = useState<AccountBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const retryCountRef = useRef(0);

  const supabase = createClient();

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    retryCountRef.current = 0; // Reset retry count when accountId changes
    loadBudget();
  }, [accountId]);

  const loadBudget = async () => {
    try {
      setIsLoading(true);

      console.log(
        "🔍 useAccountBudget - Carregando orçamento para conta:",
        accountId
      );

      // Verificar se o usuário está autenticado (com tentativa de refresh)
      const user = await getCurrentUserWithRefresh();

      if (!user) {
        // Se já tentou 3 vezes, desistir e usar valores padrão
        if (retryCountRef.current >= 3) {
          console.log(
            "⏳ Usuário não autenticado após 3 tentativas, usando valores padrão"
          );
          setBudget({
            monthly_budget: null,
            alert_threshold: 80,
          });
          setIsLoading(false);
          return;
        }

        retryCountRef.current += 1;
        console.log(
          `⏳ Usuário não autenticado ao buscar account budget, tentativa ${retryCountRef.current}/3...`
        );
        setTimeout(() => {
          loadBudget();
        }, 1000);
        return;
      }

      // Reset retry count on success
      retryCountRef.current = 0;

      console.log("✅ Usuário autenticado:", user.id);

      // Primeiro, tentar carregar do banco de dados (para garantir que usuários convidados vejam)
      const { data, error } = await supabase
        .from("account_forecast_settings")
        .select("monthly_budget, alert_threshold")
        .eq("account_id", accountId)
        .single();

      if (data && !error) {
        console.log(
          "✅ useAccountBudget - Orçamento encontrado no banco:",
          data
        );
        setBudget({
          monthly_budget: data.monthly_budget,
          alert_threshold: data.alert_threshold || 80,
        });
        setIsLoading(false);
        return;
      }

      // Tratamento de erros
      if (error) {
        if (error.code === "PGRST116") {
          // PGRST116 = no rows returned (não é erro, apenas não existe)
          console.log(
            "📝 useAccountBudget - Nenhuma configuração encontrada no banco"
          );
        } else if (
          error.code === "PGRST301" ||
          error.message?.includes("permission") ||
          error.message?.includes("row-level security")
        ) {
          console.error(
            "❌ useAccountBudget - Erro de permissão:",
            error.message
          );
          // Continuar para tentar localStorage como fallback
        } else {
          console.error(
            "❌ useAccountBudget - Erro ao buscar:",
            error.message,
            error.code
          );
        }
      }

      // Fallback: tentar carregar do localStorage (apenas se não encontrou no banco)
      const localKey = `forecast_settings_${accountId}`;
      const localSettings = localStorage.getItem(localKey);

      if (localSettings) {
        console.log("🔄 useAccountBudget - Usando localStorage como fallback");
        const parsed = JSON.parse(localSettings);
        setBudget({
          monthly_budget: parsed.monthly_budget,
          alert_threshold: parsed.alert_threshold || 80,
        });
        setIsLoading(false);
        return;
      }

      // Configurações padrão
      console.log("📝 useAccountBudget - Usando configurações padrão");
      setBudget({
        monthly_budget: null,
        alert_threshold: 80,
      });
    } catch (error) {
      console.error("❌ useAccountBudget - Erro ao carregar orçamento:", error);
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
