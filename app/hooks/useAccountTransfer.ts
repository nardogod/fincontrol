import { useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import type { TTransaction } from "@/app/lib/types";
import { validateTransfer, createTransferTransactions } from "@/app/lib/account-transfer";
import type { TransferData, AccountBalance } from "@/app/lib/account-transfer";

export function useAccountTransfer() {
  const [isTransferring, setIsTransferring] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const createTransfer = useCallback(async (transferData: TransferData) => {
    setIsTransferring(true);

    try {
      // Criar transações de transferência
      const { outTransaction, inTransaction } = createTransferTransactions(transferData);

      // 1. Criar transação de saída
      const { error: outError } = await supabase
        .from("transactions")
        .insert(outTransaction as any);

      if (outError) throw outError;

      // 2. Criar transação de entrada
      const { error: inError } = await supabase
        .from("transactions")
        .insert(inTransaction as any);

      if (inError) throw inError;

      toast({
        title: "Transferência realizada!",
        description: `Valor de ${transferData.amount} transferido com sucesso.`,
      });

      return { success: true };

    } catch (error) {
      console.error("Erro ao realizar transferência:", error);
      toast({
        variant: "destructive",
        title: "Erro na transferência",
        description: "Tente novamente mais tarde.",
      });
      return { success: false, error };
    } finally {
      setIsTransferring(false);
    }
  }, [supabase, toast]);

  const validateTransferData = useCallback((
    fromAccount: AccountBalance,
    toAccount: AccountBalance,
    amount: number
  ) => {
    return validateTransfer(fromAccount, toAccount, amount);
  }, []);

  return {
    createTransfer,
    validateTransferData,
    isTransferring
  };
}
