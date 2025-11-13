"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import type { TAccount, TCategory } from "@/app/lib/types";
import { Plus, Trash2 } from "lucide-react";

// Helper function to generate unique IDs
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function to normalize category names
const normalizeName = (name: string) => {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
};

interface BulkTransactionFormProps {
  accounts: TAccount[];
  categories: TCategory[];
  onSuccess?: () => void;
}

interface TransactionRow {
  id: string;
  type: "income" | "expense";
  amount: string;
  categoryId: string;
  accountId: string;
  date: string;
  description: string;
}

export default function BulkTransactionForm({
  accounts,
  categories,
  onSuccess,
}: BulkTransactionFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [rows, setRows] = useState<TransactionRow[]>(() => {
    const initialId = generateId();
    return [
      {
        id: initialId,
        type: "expense",
        amount: "",
        categoryId: "",
        accountId: accounts[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);

  // Unify duplicate categories by normalized name - memoized
  const unifiedCategories = useMemo(() => {
    const categoryMap = new Map<string, TCategory>();
    
    categories.forEach((category) => {
      const normalizedName = normalizeName(category.name);
      if (!categoryMap.has(normalizedName)) {
        categoryMap.set(normalizedName, category);
      }
    });
    
    return Array.from(categoryMap.values());
  }, [categories]);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: generateId(),
        type: "expense",
        amount: "",
        categoryId: "",
        accountId: accounts[0]?.id || "",
        date: new Date().toISOString().split("T")[0],
        description: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows(rows.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, field: keyof TransactionRow, value: any) => {
    setRows(
      rows.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Usuário não autenticado");
      }

      // Validate all rows
      const validRows = rows.filter(
        (r) =>
          r.amount &&
          parseFloat(r.amount) > 0 &&
          r.categoryId &&
          r.accountId &&
          r.date
      );

      if (validRows.length === 0) {
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Preencha pelo menos uma transação válida",
        });
        setIsLoading(false);
        return;
      }

      // Create transactions
      const transactions = validRows.map((r) => ({
        type: r.type,
        amount: parseFloat(r.amount),
        category_id: r.categoryId,
        account_id: r.accountId,
        transaction_date: r.date,
        description: r.description || null,
        user_id: user.id,
      }));

      const { error } = await supabase.from("transactions").insert(transactions);

      if (error) throw error;

      toast({
        title: "Transações criadas!",
        description: `${validRows.length} transação(ões) criada(s) com sucesso.`,
      });

      // Reset form
      setRows([
        {
          id: generateId(),
          type: "expense",
          amount: "",
          categoryId: "",
          accountId: accounts[0]?.id || "",
          date: new Date().toISOString().split("T")[0],
          description: "",
        },
      ]);

      onSuccess?.();
      router.refresh();
    } catch (error: any) {
      console.error("Erro ao criar transações:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar transações",
        description: error.message || "Tente novamente mais tarde.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {rows.map((row, index) => {
          // Filter categories by type, plus include "Balanço" for both types
          const filteredCategories = unifiedCategories.filter((c) => 
            c.type === row.type || normalizeName(c.name) === "balanco"
          );
          
          return (
            <div
              key={row.id}
              className="p-4 border rounded-lg space-y-3 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Transação {index + 1}
                </span>
                {rows.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(row.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={row.type}
                    onValueChange={(value: "income" | "expense") =>
                      updateRow(row.id, "type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Despesa</SelectItem>
                      <SelectItem value="income">Receita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, "amount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select
                    value={row.categoryId}
                    onValueChange={(value) => updateRow(row.id, "categoryId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Conta</Label>
                  <Select
                    value={row.accountId}
                    onValueChange={(value) => updateRow(row.id, "accountId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.icon} {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, "date", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição (Opcional)</Label>
                  <Input
                    value={row.description}
                    onChange={(e) => updateRow(row.id, "description", e.target.value)}
                    placeholder="Descrição da transação"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={addRow}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Adicionar Transação
        </Button>
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Salvando..." : `Criar ${rows.length} Transação(ões)`}
        </Button>
      </div>
    </form>
  );
}

