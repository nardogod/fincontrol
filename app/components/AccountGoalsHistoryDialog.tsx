"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/app/lib/supabase/client";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tAccountCard, tAccountGoalsHistory } from "@/app/lib/i18n";
import type { TAccount } from "@/app/lib/types";
import { useAccountBudget } from "@/app/hooks/useAccountBudget";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { formatCurrencyWithSymbol } from "@/app/lib/utils";
import { Calendar, TrendingUp } from "lucide-react";

interface AccountGoalsHistoryDialogProps {
  account: TAccount;
}

interface MonthlyGoalRow {
  monthYear: string;
  totalExpense: number;
  monthlyBudget: number | null;
}

export default function AccountGoalsHistoryDialog({
  account,
}: AccountGoalsHistoryDialogProps) {
  const supabase = createClient();
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rows, setRows] = useState<MonthlyGoalRow[]>([]);
  const { budget, isLoading: isBudgetLoading } = useAccountBudget(account.id);

  useEffect(() => {
    if (!open) return;

    async function loadHistory() {
      try {
        setIsLoading(true);

        // Buscar últimos 12 meses de gastos dessa conta a partir da view monthly_summary
        const { data, error } = await supabase
          .from("monthly_summary")
          .select("month_year,total_expense")
          .eq("account_id", account.id)
          .order("month_year", { ascending: false })
          .limit(12);

        if (error) {
          console.error(
            "Erro ao carregar histórico de metas para conta:",
            account.id,
            error
          );
          setRows([]);
          return;
        }

        const typed = (data || []) as any[];
        const mappedBase = typed.map((row) => ({
          monthYear: row.month_year as string,
          totalExpense: Number(row.total_expense || 0),
        }));

        const monthYears = mappedBase.map((row) => row.monthYear);

        // Buscar metas mensais daquele mês na tabela budgets (category_id NULL = meta geral da conta)
        let budgetsByMonth = new Map<string, number>();
        if (monthYears.length > 0) {
          const { data: budgetsData, error: budgetsError } = await supabase
            .from("budgets")
            .select("month_year, planned_amount")
            .eq("account_id", account.id)
            .is("category_id", null)
            .in("month_year", monthYears);

          if (budgetsError) {
            console.error(
              "Erro ao carregar metas mensais (budgets) para conta:",
              account.id,
              budgetsError
            );
          } else {
            (budgetsData || []).forEach((row: any) => {
              budgetsByMonth.set(
                row.month_year as string,
                Number(row.planned_amount || 0)
              );
            });
          }
        }

        // Fallback: para o mês atual, usar a meta atual da conta se não houver registro em budgets
        const now = new Date();
        const currentMonthYear = `${now.getFullYear()}-${String(
          now.getMonth() + 1
        ).padStart(2, "0")}`;

        const mapped: MonthlyGoalRow[] = mappedBase.map((row) => {
          const budgetFromTable = budgetsByMonth.get(row.monthYear);
          let monthBudget: number | null =
            budgetFromTable !== undefined ? budgetFromTable : null;

          if (
            monthBudget === null &&
            row.monthYear === currentMonthYear &&
            budget &&
            budget.monthly_budget &&
            budget.monthly_budget > 0
          ) {
            monthBudget = budget.monthly_budget;
          }

          return {
            ...row,
            monthlyBudget: monthBudget,
          };
        });

        setRows(mapped);
      } finally {
        setIsLoading(false);
      }
    }

    loadHistory();
  }, [open, account.id, supabase]);

  const getStatus = (spent: number, monthBudget: number | null) => {
    if (!monthBudget || monthBudget <= 0) return "no-budget" as const;
    const ratio = spent / monthBudget;
    if (ratio >= 1.05) return "over-budget" as const;
    if (ratio <= 0.7) return "under-budget" as const;
    return "on-track" as const;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full text-xs"
        >
          <Calendar className="h-3 w-3 mr-1" />
          {tAccountCard.viewGoalsHistory[language]}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {tAccountGoalsHistory.title[language]}{account.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {tAccountGoalsHistory.description[language]}
          </p>

          {(isLoading || isBudgetLoading) && (
            <p className="text-sm text-slate-500">{tAccountGoalsHistory.loading[language]}</p>
          )}

          {!isLoading && rows.length === 0 && (
            <p className="text-sm text-slate-500">
              {tAccountGoalsHistory.noDataYet[language]}
            </p>
          )}

          {!isLoading && rows.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 gap-2 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-700">
                <div>{tAccountGoalsHistory.month[language]}</div>
                <div>{tAccountGoalsHistory.spendingInMonth[language]}</div>
                <div>{tAccountGoalsHistory.monthlyGoalOfMonth[language]}</div>
                <div>{tAccountGoalsHistory.percentOfGoal[language]}</div>
              </div>
              <div className="divide-y">
                {rows.map((row) => {
                  const metaValue = row.monthlyBudget;
                  const percent =
                    metaValue && metaValue > 0
                      ? (row.totalExpense / metaValue) * 100
                      : null;
                  const status = getStatus(row.totalExpense, metaValue);

                  const monthLabel = row.monthYear;

                  return (
                    <div
                      key={row.monthYear}
                      className="grid grid-cols-4 gap-2 px-4 py-2 text-xs items-center"
                    >
                      <div className="font-medium text-slate-800">
                        {monthLabel}
                      </div>
                      <div className="text-slate-800">
                        {formatCurrencyWithSymbol(
                          row.totalExpense,
                          account.currency || "kr"
                        )}
                      </div>
                      <div className="text-slate-800">
                        {metaValue && metaValue > 0
                          ? formatCurrencyWithSymbol(
                              metaValue,
                              account.currency || "kr"
                            )
                          : "-"}
                      </div>
                      <div>
                        {percent === null ? (
                          <span className="text-slate-500">{tAccountGoalsHistory.noGoal[language]}</span>
                        ) : (
                          <span
                            className={
                              status === "over-budget"
                                ? "text-red-600 font-semibold"
                                : status === "under-budget"
                                ? "text-emerald-600 font-semibold"
                                : "text-slate-800 font-semibold"
                            }
                          >
                            {percent.toFixed(0)}%
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

