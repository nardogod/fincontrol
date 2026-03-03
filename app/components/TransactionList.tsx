"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tTransactions, tDashboardFilters, getCategoryDisplayName } from "@/app/lib/i18n";
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
  Calendar,
} from "lucide-react";
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
  account?: TAccount & {
    is_shared?: boolean;
    member_role?: string;
  };
  user?: {
    full_name: string;
    email: string;
  };
  created_via?: string;
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
  const { language } = useLanguage();
  const supabase = createClient();

  const [accountFilter, setAccountFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [customMonth, setCustomMonth] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Função para normalizar nome da categoria (unificar duplicatas)
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  };

  // Unificar categorias duplicadas
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

  const periods = [
    { value: "all", label: tDashboardFilters.periods.all[language] },
    { value: "current-month", label: tDashboardFilters.periods.currentMonth[language] },
    { value: "last-month", label: tDashboardFilters.periods.lastMonth[language] },
    { value: "last-3-months", label: tDashboardFilters.periods.last3Months[language] },
    { value: "last-6-months", label: tDashboardFilters.periods.last6Months[language] },
    { value: "current-year", label: tDashboardFilters.periods.currentYear[language] },
    { value: "custom-month", label: tDashboardFilters.periods.customMonth[language] },
  ];

  // Função para obter range de datas baseado no período
  const getDateRange = (period: string) => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (period.startsWith("custom-month:")) {
      const monthStr = period.replace("custom-month:", "");
      const [year, month] = monthStr.split("-").map(Number);
      const customStart = new Date(year, month - 1, 1);
      const customEnd = new Date(year, month, 0);
      return { start: customStart, end: customEnd };
    }

    switch (period) {
      case "current-month":
        return { start: firstDayOfMonth, end: lastDayOfMonth };
      case "last-month":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        return { start: lastMonth, end: lastMonthEnd };
      case "last-3-months":
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return { start: threeMonthsAgo, end: lastDayOfMonth };
      case "last-6-months":
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return { start: sixMonthsAgo, end: lastDayOfMonth };
      case "current-year":
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        return { start: yearStart, end: yearEnd };
      default:
        return { start: null, end: null };
    }
  };

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

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    console.log("🔄 Recarregando dados após edição...");
    // Forçar recarregamento da página para atualizar todos os dados
    window.location.reload();
  };

  const handlePeriodChange = (value: string) => {
    setPeriodFilter(value);
    if (value === "custom-month" && customMonth) {
      // Aplicar filtro imediatamente se já houver mês selecionado
      applyFiltersWithPeriod(`custom-month:${customMonth}`);
    }
  };

  const handleCustomMonthChange = (monthValue: string) => {
    setCustomMonth(monthValue);
    if (monthValue) {
      applyFiltersWithPeriod(`custom-month:${monthValue}`);
    }
  };

  const applyFiltersWithPeriod = (period: string = periodFilter) => {
    const params = new URLSearchParams();
    if (accountFilter !== "all") params.set("account", accountFilter);
    if (categoryFilter !== "all") params.set("category", categoryFilter);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (userFilter !== "all") params.set("user", userFilter);
    if (period !== "all") params.set("period", period);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());

    router.push(`/transactions?${params.toString()}`);
  };

  const applyFilters = () => {
    applyFiltersWithPeriod();
  };

  // Filter transactions by search query and period
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filtro por período
    if (periodFilter !== "all") {
      const { start, end } = getDateRange(periodFilter);
      if (start && end) {
        filtered = filtered.filter((t) => {
          const transactionDate = new Date(t.transaction_date);
          return transactionDate >= start && transactionDate <= end;
        });
      }
    }

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((transaction) => {
        return (
          transaction.description?.toLowerCase().includes(query) ||
          transaction.category?.name.toLowerCase().includes(query) ||
          transaction.account?.name.toLowerCase().includes(query) ||
          transaction.amount.toString().includes(query)
        );
      });
    }

    return filtered;
  }, [transactions, periodFilter, searchQuery]);

  const resetFilters = () => {
    setAccountFilter("all");
    setCategoryFilter("all");
    setTypeFilter("all");
    setUserFilter("all");
    setPeriodFilter("all");
    setCustomMonth("");
    router.push("/transactions");
  };

  if (transactions.length === 0) {
    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select value={accountFilter} onValueChange={setAccountFilter}>
            <SelectTrigger>
              <SelectValue placeholder={tTransactions.allAccounts[language]} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tTransactions.allAccounts[language]}</SelectItem>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.icon} {account.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder={tTransactions.allCategories[language]} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tTransactions.allCategories[language]}</SelectItem>
              {unifiedCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.icon} {getCategoryDisplayName(category.name, language)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={tTransactions.allTypes[language]} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tTransactions.allTypes[language]}</SelectItem>
              <SelectItem value="income">{tTransactions.incomeType[language]}</SelectItem>
              <SelectItem value="expense">{tTransactions.expenseType[language]}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={applyFilters} variant="default">
            {tTransactions.applyFilters[language]}
          </Button>
          <Button onClick={resetFilters} variant="outline">
            {tTransactions.clear[language]}
          </Button>
        </div>

        <div className="py-12 text-center">
          <p className="text-slate-500">{tTransactions.noTransactionsFound[language]}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select value={accountFilter} onValueChange={setAccountFilter}>
          <SelectTrigger>
            <SelectValue placeholder={tTransactions.allAccounts[language]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tTransactions.allAccounts[language]}</SelectItem>
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
            <SelectItem value="all">{tTransactions.allCategories[language]}</SelectItem>
            {unifiedCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {getCategoryDisplayName(category.name, language)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={periodFilter} onValueChange={handlePeriodChange}>
          <SelectTrigger>
              <SelectValue placeholder={tTransactions.allPeriods[language]} />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{period.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger>
            <SelectValue placeholder={tTransactions.allTypes[language]} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tTransactions.allTypes[language]}</SelectItem>
            <SelectItem value="income">{tTransactions.incomeType[language]}</SelectItem>
            <SelectItem value="expense">{tTransactions.expenseType[language]}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {periodFilter === "custom-month" && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            type="month"
            value={customMonth}
            onChange={(e) => handleCustomMonthChange(e.target.value)}
            placeholder={tTransactions.selectMonth[language]}
            className="w-full"
          />
        </div>
      )}

      {/* User Filter - Only show for shared accounts */}
      {transactions.some(t => t.account?.is_shared) && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger>
              <SelectValue placeholder={tTransactions.allUsers[language]} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tTransactions.allUsers[language]}</SelectItem>
              {Array.from(new Set(transactions
                .filter(t => t.user?.email)
                .map(t => ({ id: t.user?.email || '', name: t.user?.full_name || t.user?.email || '' }))
                .filter(u => u.id && u.name)
              )).map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  👤 {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder={tTransactions.searchPlaceholder[language]}
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
          {tTransactions.applyFilters[language]}
        </Button>
        <Button
          onClick={resetFilters}
          variant="outline"
          className="w-full sm:w-auto"
        >
          {tTransactions.clear[language]}
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
                    {getCategoryDisplayName(transaction.category?.name, language) || tTransactions.noCategory[language]}
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
                  {transaction.account?.icon} {transaction.account?.name}
                  {transaction.user && (
                    <span className="ml-2 text-blue-600">
                      • Por {transaction.user.full_name || transaction.user.email}
                    </span>
                  )}
                  {transaction.created_via && (
                    <span className="ml-1 text-xs bg-gray-100 px-1 rounded">
                      via {transaction.created_via}
                    </span>
                  )}
                  {transaction.account?.is_shared && (
                    <span className="ml-2 text-green-600">
                      • Conta compartilhada
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
            {tTransactions.clear[language]} busca
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
