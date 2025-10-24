"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { RotateCcw, Clock, AlertCircle } from "lucide-react";

interface DeletedAccount {
  id: string;
  original_account_id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  currency: string;
  description: string;
  deleted_at: string;
  can_recover: boolean;
  recovery_expires_at: string;
}

interface RecoverAccountDialogProps {
  children: React.ReactNode;
}

function RecoverAccountDialogComponent({
  children,
}: RecoverAccountDialogProps) {
  const [deletedAccounts, setDeletedAccounts] = useState<DeletedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecovering, setIsRecovering] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    if (isOpen) {
      loadDeletedAccounts();
    }
  }, [isOpen]);

  const loadDeletedAccounts = async () => {
    try {
      setIsLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("deleted_accounts")
        .select("*")
        .eq("user_id", user.id)
        .eq("can_recover", true)
        .gt("recovery_expires_at", new Date().toISOString())
        .order("deleted_at", { ascending: false });

      if (error) {
        console.error("Error loading deleted accounts:", error);
        return;
      }

      setDeletedAccounts(data || []);
    } catch (error) {
      console.error("Error loading deleted accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecover = async (deletedAccount: DeletedAccount) => {
    try {
      setIsRecovering(deletedAccount.id);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create new account with same data
      const { data: newAccount, error: createError } = await supabase
        .from("accounts")
        .insert({
          user_id: user.id,
          name: deletedAccount.name,
          type: deletedAccount.type,
          color: deletedAccount.color,
          icon: deletedAccount.icon,
          currency: deletedAccount.currency,
          description: deletedAccount.description,
        })
        .select()
        .single();

      if (createError) {
        throw createError;
      }

      // Add user as owner
      const { error: memberError } = await supabase
        .from("account_members")
        .insert({
          account_id: newAccount.id,
          user_id: user.id,
          role: "owner",
        });

      if (memberError) {
        throw memberError;
      }

      // Mark as recovered
      const { error: updateError } = await supabase
        .from("deleted_accounts")
        .update({ can_recover: false })
        .eq("id", deletedAccount.id);

      if (updateError) {
        console.error("Error updating deleted account:", updateError);
      }

      toast({
        title: "Conta recuperada!",
        description: `A conta "${deletedAccount.name}" foi recuperada com sucesso.`,
      });

      // Reload deleted accounts
      await loadDeletedAccounts();
    } catch (error) {
      console.error("Error recovering account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível recuperar a conta: ${
          error instanceof Error ? error.message : "Erro desconhecido"
        }`,
      });
    } finally {
      setIsRecovering(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const now = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Recuperar Contas Excluídas
          </DialogTitle>
          <DialogDescription>
            Você pode recuperar contas excluídas nos últimos 30 dias. Após esse
            período, as contas serão permanentemente removidas.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Carregando contas...</p>
            </div>
          ) : deletedAccounts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nenhuma conta excluída encontrada.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Contas excluídas há mais de 30 dias não podem ser recuperadas.
              </p>
            </div>
          ) : (
            deletedAccounts.map((account) => {
              const daysLeft = getDaysUntilExpiry(account.recovery_expires_at);
              const isExpiringSoon = daysLeft <= 7;

              return (
                <Card key={account.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-white text-lg"
                          style={{ backgroundColor: account.color }}
                        >
                          {account.icon}
                        </div>
                        <div>
                          <CardTitle className="text-lg">
                            {account.name}
                          </CardTitle>
                          <p className="text-sm text-gray-600 capitalize">
                            {account.type === "personal"
                              ? "Pessoal"
                              : account.type === "shared"
                              ? "Compartilhada"
                              : account.type === "business"
                              ? "Empresa"
                              : account.type === "vehicle"
                              ? "Veículo"
                              : account.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={isExpiringSoon ? "destructive" : "secondary"}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {daysLeft} dias
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <p>Excluída em: {formatDate(account.deleted_at)}</p>
                        {account.description && (
                          <p className="mt-1">
                            Descrição: {account.description}
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRecover(account)}
                        disabled={isRecovering === account.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isRecovering === account.id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Recuperando...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Recuperar
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Export com carregamento dinâmico para evitar problemas de hidratação
const RecoverAccountDialog = dynamic(
  () => Promise.resolve(RecoverAccountDialogComponent),
  {
    ssr: false,
    loading: () => (
      <Button variant="outline" disabled>
        <RotateCcw className="h-4 w-4 mr-2" />
        Recuperar Conta
      </Button>
    ),
  }
);

export default RecoverAccountDialog;
