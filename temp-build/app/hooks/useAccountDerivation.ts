import { useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import type { TTransaction } from "@/app/lib/types";

interface DerivationData {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export function useAccountDerivation() {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const createDerivation = useCallback(async (data: DerivationData) => {
    setIsCreating(true);

    try {
      // 1. Criar transação de saída na conta principal
      const { error: outError } = await supabase
        .from("transactions")
        .insert({
          account_id: data.fromAccountId,
          type: "expense",
          amount: data.amount,
          description: data.description || `Derivação para ${data.toAccountId}`,
          transaction_date: new Date().toISOString().split('T')[0],
          created_via: "system"
        } as any);

      if (outError) throw outError;

      // 2. Criar transação de entrada na conta de destino
      const { error: inError } = await supabase
        .from("transactions")
        .insert({
          account_id: data.toAccountId,
          type: "income",
          amount: data.amount,
          description: data.description || `Derivação da conta principal`,
          transaction_date: new Date().toISOString().split('T')[0],
          created_via: "system"
        } as any);

      if (inError) throw inError;

      toast({
        title: "Derivação criada!",
        description: `Valor de ${data.amount} transferido com sucesso.`,
      });

      return { success: true };

    } catch (error) {
      console.error("Erro ao criar derivação:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar derivação",
        description: "Tente novamente mais tarde.",
      });
      return { success: false, error };
    } finally {
      setIsCreating(false);
    }
  }, [supabase, toast]);

  const reverseDerivation = useCallback(async (data: DerivationData) => {
    setIsCreating(true);

    try {
      // Reverter: entrada na principal, saída na derivada
      const { error: inError } = await supabase
        .from("transactions")
        .insert({
          account_id: data.fromAccountId, // conta principal
          type: "income",
          amount: data.amount,
          description: `Reversão de derivação de ${data.toAccountId}`,
          transaction_date: new Date().toISOString().split('T')[0],
          created_via: "system"
        } as any);

      if (inError) throw inError;

      const { error: outError } = await supabase
        .from("transactions")
        .insert({
          account_id: data.toAccountId, // conta derivada
          type: "expense",
          amount: data.amount,
          description: `Reversão de derivação para conta principal`,
          transaction_date: new Date().toISOString().split('T')[0],
          created_via: "system"
        } as any);

      if (outError) throw outError;

      toast({
        title: "Derivação revertida!",
        description: `Valor de ${data.amount} retornou para a conta principal.`,
      });

      return { success: true };

    } catch (error) {
      console.error("Erro ao reverter derivação:", error);
      toast({
        variant: "destructive",
        title: "Erro ao reverter derivação",
        description: "Tente novamente mais tarde.",
      });
      return { success: false, error };
    } finally {
      setIsCreating(false);
    }
  }, [supabase, toast]);

  return {
    createDerivation,
    reverseDerivation,
    isCreating
  };
}
