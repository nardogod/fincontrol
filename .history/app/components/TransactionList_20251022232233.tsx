"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { createClient } from "@/app/lib/supabase/client";
import { toast } from "@/app/hooks/use-toast";
import { formatCurrency, formatDate } from "@/app/lib/utils";
import EditTransactionModal from "@/app/components/EditTransactionModal";
import {
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Edit,
  Search,
} from "lucide-react";
import type { TAccount, TCategory, TTransactionWithRelations } from "@/app/lib/types";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string | null;
  transaction_date: string;
  category: TCategory | null;
  account: TAccount;
  user?: {
    full_name: string;
    email: string;
  };
  created_via?: string;
}

interface TransactionListProps {
  transactions: TTransactionWithRelations[];
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
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<TTransaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const handleEdit = (transaction: TTransaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    console.log("🔄 Recarregando dados após edição...");
    // Forçar recarregamento da página para atualizar todos os dados
    window.location.reload();
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (accountFilter !== "all") params.set("account", accountFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    router.push(`/transactions?${params.toString()}`);
  };

  // Filter transactions by search query
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      transaction.description?.toLowerCase().includes(query) ||
      transaction.category?.name.toLowerCase().includes(query) ||
      transaction.account?.name.toLowerCase().includes(query) ||
      transaction.amount.toString().includes(query)
    );
  });

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Buscar por descrição, categoria, conta ou valor..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={applyFilters}
          variant="default"
          className="w-full sm:w-auto"
        >
          Aplicar Filtros
        </Button>
        <Button
          onClick={resetFilters}
          variant="outline"
          className="w-full sm:w-auto"
        >
          Limpar
        </Button>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {filteredTransactions.map((transaction) => (
          <div
            key={transaction.id}
            className="flex flex-col gap-4 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
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
                  {transaction.user && (
                    <span className="ml-2 text-blue-600">
                      • Adicionado por {transaction.user.full_name}
                    </span>
                  )}
                  {transaction.created_via && (
                    <span className="ml-1 text-xs bg-gray-100 px-1 rounded">
                      via {transaction.created_via}
                    </span>
                  )}
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

              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(transaction)}
                  title="Editar transação"
                >
                  <Edit className="h-4 w-4 text-blue-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(transaction.id)}
                  disabled={deletingId === transaction.id}
                  title="Deletar transação"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* No results message */}
      {filteredTransactions.length === 0 && transactions.length > 0 && (
        <div className="py-12 text-center">
          <p className="text-slate-500">
            Nenhuma transação encontrada para "{searchQuery}"
          </p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery("")}
            className="mt-2"
          >
            Limpar busca
          </Button>
        </div>
      )}

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

      {/* Edit Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTransaction(null);
        }}
        onSuccess={handleEditSuccess}
        accounts={accounts}
        categories={categories}
      />
    </div>
  );
}
