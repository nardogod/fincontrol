"use client";

import { useState, useEffect } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { cn } from "@/app/lib/utils";
import { z } from "zod";
import type { TAccount, TCategory } from "@/app/lib/types";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transaction_date: string;
  category_id: string;
  account_id: string;
  category?: TCategory | null;
  account?: TAccount;
  user?: {
    full_name: string;
    email: string;
  };
  created_via?: string;
}

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: TAccount[];
  categories: TCategory[];
}

const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("O valor deve ser maior que zero"),
  category_id: z.string().uuid("Selecione uma categoria"),
  account_id: z.string().uuid("Selecione uma conta"),
  transaction_date: z.string().min(1, "Selecione uma data"),
  description: z.string().optional(),
});

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSuccess,
  accounts,
  categories,
}: EditTransactionModalProps) {
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category_id: "",
    account_id: "",
    transaction_date: "",
    description: "",
  });

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      // Preservar valor exato sem arredondamento
      const amountValue = Number(transaction.amount);
      const amountString = amountValue % 1 === 0 
        ? amountValue.toString() 
        : amountValue.toFixed(2);
      
      setFormData({
        type: transaction.type,
        amount: amountString,
        category_id: transaction.category_id || "",
        account_id: transaction.account_id,
        transaction_date: transaction.transaction_date,
        description: transaction.description || "",
      });
    }
  }, [transaction]);

  // Filter categories by type and unify duplicates by normalized name
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, " "); // Normaliza espaços
  };

  // Include categories of the selected type, plus "Balanço" category for both types
  const categoriesByType = categories.filter((c) => 
    c.type === formData.type || normalizeName(c.name) === "balanco"
  );
  const categoryMap = new Map<string, typeof categories[0]>();
  
  categoriesByType.forEach((category) => {
    const normalizedName = normalizeName(category.name);
    if (!categoryMap.has(normalizedName)) {
      categoryMap.set(normalizedName, category);
    }
  });

  const filteredCategories = Array.from(categoryMap.values());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setIsLoading(true);
    console.log("🔧 Editando transação:", transaction.id);
    console.log("📝 Dados do formulário:", formData);

    try {
      const validated = transactionSchema.parse({
        ...formData,
        amount: parseFloat(formData.amount),
        description: formData.description || undefined,
      });

      console.log("✅ Dados validados:", validated);

      const { data, error } = await supabase
        .from("transactions")
        .update(validated)
        .eq("id", transaction.id)
        .select();

      console.log("💾 Resultado da atualização:", { data, error });

      if (error) {
        console.error("❌ Erro ao atualizar:", error);
        throw error;
      }

      toast({
        title: "Transação atualizada!",
        description: "A transação foi editada com sucesso.",
      });

      onSuccess();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
      } else {
        console.error("Error updating transaction:", error);
        toast({
          variant: "destructive",
          title: "Erro ao atualizar transação",
          description: "Tente novamente mais tarde.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Transação</DialogTitle>
          <DialogDescription>
            Modifique os detalhes da transação abaixo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type Toggle */}
          <div className="space-y-2">
            <Label>Tipo de Transação</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, type: "income", category_id: "" });
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all",
                  formData.type === "income"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                <span className="text-xl">💰</span>
                <span className="font-semibold">Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    ...formData,
                    type: "expense",
                    category_id: "",
                  });
                }}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-xl border-2 p-3 transition-all",
                  formData.type === "expense"
                    ? "border-red-500 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                )}
              >
                <span className="text-xl">💸</span>
                <span className="font-semibold">Saída</span>
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor (SEK)</Label>
            <Input
              id="amount"
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => {
                // Permitir apenas números e ponto decimal
                const value = e.target.value.replace(/[^0-9.]/g, '');
                // Garantir apenas um ponto decimal
                const parts = value.split('.');
                const formattedValue = parts.length > 2 
                  ? parts[0] + '.' + parts.slice(1).join('')
                  : value;
                setFormData({ ...formData, amount: formattedValue });
              }}
              onBlur={(e) => {
                // Formatar para 2 casas decimais ao perder foco, mas preservar valor exato
                const numValue = parseFloat(e.target.value);
                if (!isNaN(numValue)) {
                  const formatted = numValue % 1 === 0 
                    ? numValue.toString() 
                    : numValue.toFixed(2);
                  setFormData({ ...formData, amount: formatted });
                }
              }}
              required
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Account */}
          <div className="space-y-2">
            <Label htmlFor="account">Conta</Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) =>
                setFormData({ ...formData, account_id: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.icon} {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.transaction_date}
              onChange={(e) =>
                setFormData({ ...formData, transaction_date: e.target.value })
              }
              required
              disabled={isLoading}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Compras do supermercado"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              disabled={isLoading}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
              disabled={isLoading}
            >
              {isLoading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
