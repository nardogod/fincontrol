"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
import type { TAccount, TCategory } from "@/app/lib/types";
import { getCurrentUserWithRefresh, redirectToLogin, isAuthError } from "@/app/lib/auth-helpers";

// Validation schema
const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("O valor deve ser maior que zero"),
  category_id: z.string().uuid("Selecione uma categoria"),
  account_id: z.string().uuid("Selecione uma conta"),
  transaction_date: z.string().min(1, "Selecione uma data"),
  description: z.string().optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  accounts: TAccount[];
  categories: TCategory[];
}

export default function TransactionForm({
  accounts,
  categories,
}: TransactionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    c.type === type || normalizeName(c.name) === "balanco"
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
    setIsLoading(true);

    try {
      // Normalizar e converter valor (suporta vírgula ou ponto como separador decimal)
      // Remove espaços e substitui vírgula por ponto
      const normalizedAmount = amount.replace(/,/g, ".").replace(/\s/g, "").trim();
      const parsedAmount = parseFloat(normalizedAmount);
      
      console.log("💰 [TransactionForm] Valor original:", amount);
      console.log("💰 [TransactionForm] Valor normalizado:", normalizedAmount);
      console.log("💰 [TransactionForm] Valor parseado:", parsedAmount);
      
      // Validar se o valor é válido
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast({
          variant: "destructive",
          title: "Valor inválido",
          description: "Digite um valor maior que zero.",
        });
        setIsLoading(false);
        return;
      }
      
      // Arredondar para 2 casas decimais para evitar problemas de precisão
      // Multiplica por 100, arredonda, divide por 100
      const finalAmount = Math.round(parsedAmount * 100) / 100;
      
      console.log("💰 [TransactionForm] Valor final (arredondado):", finalAmount);
      
      // Parse and validate
      const formData: TransactionFormData = {
        type,
        amount: finalAmount,
        category_id: categoryId,
        account_id: accountId,
        transaction_date: date,
        description: description || undefined,
      };

      const validated = transactionSchema.parse(formData);

      // Buscar usuário atual com tentativa de refresh
      let currentUser = await getCurrentUserWithRefresh();

      if (!currentUser) {
        // Tentar uma última vez após um pequeno delay (pode ser problema de sincronização)
        await new Promise(resolve => setTimeout(resolve, 500));
        const retryUser = await getCurrentUserWithRefresh();
        
        if (!retryUser) {
          console.error("User authentication failed after retry");
          toast({
            variant: "destructive",
            title: "Sessão expirada",
            description: "Sua sessão expirou. Redirecionando para login...",
          });
          // Usar setTimeout para permitir que o toast seja exibido
          setTimeout(() => {
            redirectToLogin("/transactions/new");
          }, 1000);
          return;
        }
        
        // Se conseguiu na segunda tentativa, usar esse usuário
        currentUser = retryUser;
      }

      // Insert transaction
      const { error } = await supabase.from("transactions").insert({
        ...validated,
        created_via: "web",
        user_id: currentUser.id,
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Transação criada!",
        description: "A transação foi adicionada com sucesso.",
      });

      router.push("/transactions");
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          variant: "destructive",
          title: "Erro de validação",
          description: error.errors[0].message,
        });
      } else if (isAuthError(error)) {
        toast({
          variant: "destructive",
          title: "Sessão expirada",
          description: "Sua sessão expirou. Redirecionando para login...",
        });
        redirectToLogin("/transactions/new");
      } else {
        console.error("Error creating transaction:", error);
        toast({
          variant: "destructive",
          title: "Erro ao criar transação",
          description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Type Toggle */}
      <div className="space-y-2">
        <Label>Tipo de Transação</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setType("income");
              setCategoryId("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
              type === "income"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <span className="text-2xl">💰</span>
            <span className="font-semibold">Entrada</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType("expense");
              setCategoryId("");
            }}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all",
              type === "expense"
                ? "border-red-500 bg-red-50 text-red-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            <span className="text-2xl">💸</span>
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
          value={amount}
          onChange={(e) => {
            let value = e.target.value;
            // Permite apenas números, vírgula e ponto
            value = value.replace(/[^\d,.]/g, "");
            // Substitui vírgula por ponto
            value = value.replace(/,/g, ".");
            // Remove múltiplos pontos, mantendo apenas o primeiro
            const parts = value.split(".");
            if (parts.length > 2) {
              value = parts[0] + "." + parts.slice(1).join("");
            }
            setAmount(value);
          }}
          required
          disabled={isLoading}
        />
      </div>

      {/* Category Grid */}
      <div className="space-y-2">
        <Label>Categoria</Label>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              onClick={() => setCategoryId(category.id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border-2 p-3 transition-all",
                categoryId === category.id
                  ? `${category.color} border-current shadow-lg`
                  : "border-slate-200 bg-white hover:border-slate-300"
              )}
            >
              <span className="text-3xl">{category.icon}</span>
              <span className="text-xs font-medium">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Account */}
      <div className="space-y-2">
        <Label htmlFor="account">Conta</Label>
        <Select
          value={accountId}
          onValueChange={setAccountId}
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
          value={date}
          onChange={(e) => setDate(e.target.value)}
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
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
        disabled={isLoading}
      >
        {isLoading ? "Salvando..." : "Criar Transação"}
      </Button>
    </form>
  );
}
