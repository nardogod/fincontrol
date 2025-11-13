"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ArrowLeft, Plus, Calendar, CheckCircle2, Circle, Edit, Target } from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";
import { useToast } from "@/app/hooks/use-toast";
import type { TAccount, TCategory, TTransaction } from "@/app/lib/types";
import { formatCurrencyWithSymbol } from "@/app/lib/utils";
import { useUnpaidRecurringBillsTotal } from "@/app/hooks/useRecurringBills";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/app/components/ui/dialog";

export default function RecurringBillsPage() {
  const [accounts, setAccounts] = useState<TAccount[]>([]);
  const [categories, setCategories] = useState<TCategory[]>([]);
  const [recurringBills, setRecurringBills] = useState<TAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingBill, setEditingBill] = useState<TAccount | null>(null);
  const [transactions, setTransactions] = useState<TTransaction[]>([]);
  const [forecastSettings, setForecastSettings] = useState<Record<string, { monthly_budget: number }>>({});
  const [formData, setFormData] = useState({
    account_id: "",
    recurring_amount: "",
    recurring_category_id: "",
    recurring_start_date: "",
    recurring_end_date: "",
  });
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const { totalUnpaidAmount: unpaidRecurringBillsTotal } = useUnpaidRecurringBillsTotal();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Buscar contas próprias do usuário
      const { data: userAccounts, error: userAccountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .eq("user_id", user.id)
        .order("name");

      if (userAccountsError) throw userAccountsError;

      // Buscar account_ids das contas compartilhadas
      const { data: sharedAccountIds, error: sharedIdsError } = await supabase
        .from("account_members")
        .select("account_id")
        .eq("user_id", user.id);

      const sharedIds = sharedAccountIds?.map((m) => m.account_id) || [];
      
      // Buscar contas compartilhadas se houver
      let sharedAccounts: any[] = [];
      if (sharedIds.length > 0) {
        const { data: sharedAccountsData, error: sharedAccountsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("is_active", true)
          .in("id", sharedIds)
          .order("name");

        if (sharedAccountsError) throw sharedAccountsError;
        sharedAccounts = sharedAccountsData || [];
      }

      // Combinar e remover duplicatas
      const allAccounts = [...(userAccounts || []), ...sharedAccounts];
      const uniqueAccounts = Array.from(
        new Map(allAccounts.map(acc => [acc.id, acc])).values()
      );

      setAccounts(uniqueAccounts);

      // Buscar categorias de despesa
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("type", "expense")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Buscar contas fixas próprias
      const { data: userBills, error: userBillsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_recurring", true)
        .eq("is_active", true)
        .eq("user_id", user.id)
        .order("name");

      if (userBillsError) throw userBillsError;

      // Buscar contas fixas compartilhadas se houver
      let sharedBills: any[] = [];
      if (sharedIds.length > 0) {
        const { data: sharedBillsData, error: sharedBillsError } = await supabase
          .from("accounts")
          .select("*")
          .eq("is_recurring", true)
          .eq("is_active", true)
          .in("id", sharedIds)
          .order("name");

        if (sharedBillsError) throw sharedBillsError;
        sharedBills = sharedBillsData || [];
      }

      // Combinar e remover duplicatas
      const allBills = [...(userBills || []), ...sharedBills];
      const uniqueBills = Array.from(
        new Map(allBills.map(bill => [bill.id, bill])).values()
      );

      setRecurringBills(uniqueBills);

      // Buscar transações do mês atual para calcular valor restante
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      const accountIds = uniqueAccounts.map(acc => acc.id);
      if (accountIds.length > 0) {
        const { data: transactionsData, error: transactionsError } = await supabase
          .from("transactions")
          .select("*")
          .in("account_id", accountIds)
          .eq("type", "expense")
          .gte("transaction_date", firstDayOfMonth.toISOString().split("T")[0])
          .lte("transaction_date", lastDayOfMonth.toISOString().split("T")[0]);

        if (!transactionsError && transactionsData) {
          setTransactions(transactionsData);
        }

        // Buscar configurações de forecast de todas as contas
        const { data: settingsData, error: settingsError } = await supabase
          .from("account_forecast_settings")
          .select("account_id, monthly_budget")
          .in("account_id", accountIds);

        if (!settingsError && settingsData) {
          const settingsMap: Record<string, { monthly_budget: number }> = {};
          settingsData.forEach((setting: any) => {
            settingsMap[setting.account_id] = { monthly_budget: setting.monthly_budget || 0 };
          });
          setForecastSettings(settingsMap);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os dados.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      if (!formData.account_id) {
        throw new Error("Selecione uma conta");
      }

      const { error } = await supabase
        .from("accounts")
        .update({
          is_recurring: true,
          recurring_amount: formData.recurring_amount 
            ? parseFloat(formData.recurring_amount) 
            : null,
          recurring_category_id: formData.recurring_category_id || null,
          recurring_start_date: formData.recurring_start_date 
            ? formData.recurring_start_date + "-01"
            : null,
          recurring_end_date: formData.recurring_end_date 
            ? formData.recurring_end_date + "-01"
            : null,
        })
        .eq("id", formData.account_id);

      if (error) throw error;

      toast({
        title: "Mensalidade criada!",
        description: "A mensalidade foi associada à conta com sucesso.",
      });

      setShowForm(false);
      setFormData({
        account_id: "",
        recurring_amount: "",
        recurring_category_id: "",
        recurring_start_date: "",
        recurring_end_date: "",
      });

      await loadData();
    } catch (error: any) {
      console.error("Erro ao criar mensalidade:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível criar a mensalidade.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (bill: TAccount) => {
    setEditingBill(bill);
    setFormData({
      account_id: bill.id,
      recurring_amount: bill.recurring_amount?.toString() || "",
      recurring_category_id: bill.recurring_category_id || "",
      recurring_start_date: bill.recurring_start_date 
        ? bill.recurring_start_date.substring(0, 7) 
        : "",
      recurring_end_date: bill.recurring_end_date 
        ? bill.recurring_end_date.substring(0, 7) 
        : "",
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    setIsCreating(true);

    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          recurring_amount: formData.recurring_amount 
            ? parseFloat(formData.recurring_amount) 
            : null,
          recurring_category_id: formData.recurring_category_id || null,
          recurring_start_date: formData.recurring_start_date 
            ? formData.recurring_start_date + "-01"
            : null,
          recurring_end_date: formData.recurring_end_date 
            ? formData.recurring_end_date + "-01"
            : null,
        })
        .eq("id", editingBill.id);

      if (error) throw error;

      toast({
        title: "Mensalidade atualizada!",
        description: "A mensalidade foi atualizada com sucesso.",
      });

      setShowForm(false);
      setEditingBill(null);
      setIsEditing(false);
      setFormData({
        account_id: "",
        recurring_amount: "",
        recurring_category_id: "",
        recurring_start_date: "",
        recurring_end_date: "",
      });

      await loadData();
    } catch (error: any) {
      console.error("Erro ao atualizar mensalidade:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível atualizar a mensalidade.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleRemoveRecurring = async (accountId: string) => {
    try {
      const { error } = await supabase
        .from("accounts")
        .update({
          is_recurring: false,
          recurring_amount: null,
          recurring_category_id: null,
          recurring_start_date: null,
          recurring_end_date: null,
        })
        .eq("id", accountId);

      if (error) throw error;

      toast({
        title: "Mensalidade removida!",
        description: "A mensalidade foi removida da conta.",
      });

      await loadData();
    } catch (error) {
      console.error("Erro ao remover mensalidade:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a mensalidade.",
      });
    }
  };

  // Calcular valor restante para meta do mês
  const calculateRemainingBudget = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calcular gasto atual do mês
    const currentMonthSpent = transactions
      .filter(t => {
        const transactionDate = new Date(t.transaction_date);
        return transactionDate.getMonth() === currentMonth && 
               transactionDate.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Number(t.amount), 0);

    // Calcular total de orçamento mensal de todas as contas
    const totalMonthlyBudget = Object.values(forecastSettings).reduce(
      (sum, setting) => sum + (setting.monthly_budget || 0),
      0
    );

    // Calcular valor restante (orçamento - gasto atual - mensalidades não pagas)
    const remaining = Math.max(0, totalMonthlyBudget - currentMonthSpent - unpaidRecurringBillsTotal);

    // Determinar moeda principal (primeira conta ou padrão)
    const primaryCurrency = accounts[0]?.currency || "kr";

    return {
      totalMonthlyBudget,
      currentMonthSpent,
      unpaidRecurringBillsTotal,
      remaining,
      currency: primaryCurrency,
    };
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "Sem categoria";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || "Sem categoria";
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
  };

  const isActive = (startDate: string | null, endDate: string | null) => {
    if (!startDate) return false;
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) return false;
    if (end && now > end) return false;
    return true;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="container mx-auto max-w-7xl px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Mensalidades
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Gerencie suas contas fixas e mensalidades
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Mensalidade
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-7xl px-4 py-6 lg:px-6">
        {/* Card de Resumo - Valor Restante */}
        {(() => {
          const budget = calculateRemainingBudget();
          if (budget.totalMonthlyBudget > 0) {
            return (
              <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    Resumo do Mês
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Valor Restante para Meta do Mês</p>
                      <p className="text-3xl font-bold text-slate-900">
                        {formatCurrencyWithSymbol(budget.remaining, budget.currency)}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-blue-200">
                      <p className="text-xs text-slate-500 leading-relaxed">
                        <span className="font-medium">Cálculo:</span> Meta mensal ({formatCurrencyWithSymbol(budget.totalMonthlyBudget, budget.currency)}) 
                        - Gasto atual ({formatCurrencyWithSymbol(budget.currentMonthSpent, budget.currency)}) 
                        - Mensalidades não pagas ({formatCurrencyWithSymbol(budget.unpaidRecurringBillsTotal, budget.currency)}) 
                        = <span className="font-medium">Restante</span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          }
          return null;
        })()}

        {/* Formulário de criação/edição */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{isEditing ? "Editar Mensalidade" : "Associar Mensalidade a uma Conta"}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={isEditing ? handleUpdate : handleSubmit} className="space-y-4">
                {!isEditing && (
                  <div className="space-y-2">
                    <Label htmlFor="account_id">Conta</Label>
                    <Select
                      value={formData.account_id}
                      onValueChange={(value) =>
                        setFormData({ ...formData, account_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {accounts
                          .filter((acc) => !acc.is_recurring)
                          .map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {isEditing && editingBill && (
                  <div className="space-y-2">
                    <Label>Conta Associada</Label>
                    <div className="p-3 bg-slate-50 rounded-lg border">
                      <p className="font-medium text-slate-900">{editingBill.name}</p>
                      <p className="text-sm text-slate-600">{editingBill.description || "Sem descrição"}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="recurring_amount">Valor Mensal</Label>
                  <Input
                    id="recurring_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.recurring_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, recurring_amount: e.target.value })
                    }
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurring_category_id">Categoria</Label>
                  <Select
                    value={formData.recurring_category_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, recurring_category_id: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.icon} {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurring_start_date">Data Inicial</Label>
                    <Input
                      id="recurring_start_date"
                      type="month"
                      value={formData.recurring_start_date}
                      onChange={(e) =>
                        setFormData({ ...formData, recurring_start_date: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurring_end_date">Data Final (Opcional)</Label>
                    <Input
                      id="recurring_end_date"
                      type="month"
                      value={formData.recurring_end_date}
                      onChange={(e) =>
                        setFormData({ ...formData, recurring_end_date: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingBill(null);
                      setIsEditing(false);
                      setFormData({
                        account_id: "",
                        recurring_amount: "",
                        recurring_category_id: "",
                        recurring_start_date: "",
                        recurring_end_date: "",
                      });
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  >
                    {isCreating ? (isEditing ? "Salvando..." : "Criando...") : (isEditing ? "Salvar Alterações" : "Criar Mensalidade")}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Lista de mensalidades */}
        {recurringBills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">Nenhuma mensalidade cadastrada</p>
              <p className="text-sm text-slate-500">
                Clique em "Nova Mensalidade" para começar
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recurringBills.map((bill) => {
              const active = isActive(bill.recurring_start_date || null, bill.recurring_end_date || null);
              return (
                <Card key={bill.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            Conta: {bill.name}
                          </span>
                        </div>
                        <CardTitle className="text-lg">Mensalidade</CardTitle>
                        <p className="text-sm text-slate-600 mt-1">
                          {getCategoryName(bill.recurring_category_id || null)}
                        </p>
                      </div>
                      {active ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-slate-600">Valor Mensal</p>
                        <p className="text-2xl font-bold text-slate-900">
                          {formatCurrencyWithSymbol(bill.recurring_amount || 0, bill.currency)}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <p className="text-slate-600">Início</p>
                          <p className="font-medium">
                            {formatDate(bill.recurring_start_date || null)}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-600">Fim</p>
                          <p className="font-medium">
                            {formatDate(bill.recurring_end_date || null)}
                          </p>
                        </div>
                      </div>

                      <div className="pt-2 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(bill)}
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveRecurring(bill.id)}
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

