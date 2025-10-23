"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { TAccount, TCategory } from "@/lib/types";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transaction_date: string;
  category: TCategory | null;
  account: TAccount;
}

interface TransactionListProps {
  transactions: Transaction[];
  accounts: TAccount[];
  categories: TCategory[];
  currentPage: number;
  totalPages: number;
}

export default function TransactionList({
  transactions,
  accounts,
  categories,
  currentPage,
  totalPages,
}: TransactionListProps) {
  const router = useRouter();
  const supabase = createClient();

  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta transação?")) {
      return;
    }

    setDeletingId(id);

    try {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Transação deletada",
        description: "A transação foi removida com sucesso.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toast({
        variant: "destructive",
        title: "Erro ao deletar",
        description: "Tente novamente mais tarde.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (accountFilter !== "all") params.set("account", accountFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);

    router.push(`/transactions?${params.toString()}`);
  };

  const resetFilters = () => {
    setAccountFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
    router.push("/transactions");
  };

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as contas</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todas as categorias" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Todos os tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
              <SelectItem value="expense">Saídas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters} variant="default">
            Aplicar Filtros
          </Button>
          <Button onClick={resetFilters} variant="outline">
            Limpar
          </Button>
        </div>

        <div className="py-12 text-center">
          <p className="text-slate-500">Nenhuma transação encontrada</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as contas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as contas</SelectItem>
            {accounts.map((account) => (
              <SelectItem key={account.id} value={account.id}>
                {account.icon} {account.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="income">Entradas</SelectItem>
            <SelectItem value="expense">Saídas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters} variant="default">
          Aplicar Filtros
        </Button>
        <Button onClick={resetFilters} variant="outline">
          Limpar
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex items-center justify-between rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  transaction.type === "income"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}
              >
                {transaction.type === "income" ? (
                  <ArrowDownRight className="h-6 w-6" />
                ) : (
                  <ArrowUpRight className="h-6 w-6" />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-900">
                    {transaction.category?.name || "Sem categoria"}
                  </p>
                  <span className="text-sm text-slate-500">
                    {transaction.category?.icon}
                  </span>
                </div>
                <p className="text-sm text-slate-600">
                  {transaction.description || "Sem descrição"}
                </p>
                <p className="text-xs text-slate-500">
                  {formatDate(transaction.transaction_date)} •{" "}
                  {transaction.account.icon} {transaction.account.name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <p
                className={`text-lg font-bold ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(transaction.id)}
                disabled={deletingId === transaction.id}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/transactions?page=${currentPage - 1}`}
            className={
              currentPage === 1 ? "pointer-events-none opacity-50" : ""
            }
          >
            <Button variant="outline" size="icon" disabled={currentPage === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </Link>

          <span className="text-sm text-slate-600">
            Página {currentPage} de {totalPages}
          </span>

          <Link
            href={`/transactions?page=${currentPage + 1}`}
            className={
              currentPage === totalPages ? "pointer-events-none opacity-50" : ""
            }
          >
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
