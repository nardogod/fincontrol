import { useState, useCallback } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";

export function useDeleteAccount() {
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const deleteAccount = useCallback(
    async (accountId: string) => {
      setIsDeleting(true);

      try {
        // Verificar se há transações associadas à conta
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select("id")
          .eq("account_id", accountId)
          .limit(1);

        if (transactionsError) throw transactionsError;

        if (transactions && transactions.length > 0) {
          toast({
            variant: "destructive",
            title: "Não é possível deletar",
            description:
              "Esta conta possui transações associadas. Remova as transações primeiro.",
          });
          return { success: false, error: "Conta possui transações" };
        }

        // Deletar a conta
        const { error: deleteError } = await supabase
          .from("accounts")
          .delete()
          .eq("id", accountId);

        if (deleteError) throw deleteError;

        toast({
          title: "Conta deletada!",
          description: "A conta foi removida com sucesso.",
        });

        return { success: true };
      } catch (error) {
        console.error("Erro ao deletar conta:", error);
        toast({
          variant: "destructive",
          title: "Erro ao deletar conta",
          description: "Tente novamente mais tarde.",
        });
        return { success: false, error };
      } finally {
        setIsDeleting(false);
      }
    },
    [supabase, toast]
  );

  return {
    deleteAccount,
    isDeleting,
  };
}
