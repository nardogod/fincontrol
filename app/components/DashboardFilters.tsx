"use client";

import { useState } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import type { TAccount, TCategory } from "@/app/lib/types";

interface DashboardFiltersProps {
  accounts: TAccount[];
  categories: TCategory[];
  onFiltersChange: (filters: {
    accountId: string | null;
    categoryId: string | null;
    period: string;
    type: string | null;
  }) => void;
  activeFilters: {
    accountId: string | null;
    categoryId: string | null;
    period: string;
    type: string | null;
  };
}

export default function DashboardFilters({
  accounts,
  categories,
  onFiltersChange,
  activeFilters,
}: DashboardFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const periods = [
    { value: "current-month", label: "Este mês" },
    { value: "last-month", label: "Mês passado" },
    { value: "last-3-months", label: "Últimos 3 meses" },
    { value: "last-6-months", label: "Últimos 6 meses" },
    { value: "current-year", label: "Este ano" },
    { value: "all", label: "Todos os períodos" },
  ];

  const transactionTypes = [
    { value: "all", label: "Todas" },
    { value: "income", label: "Receitas" },
    { value: "expense", label: "Despesas" },
  ];

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...activeFilters,
      [key]: value === "all" ? null : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      accountId: null,
      categoryId: null,
      period: "current-month",
      type: null,
    });
  };

  const hasActiveFilters =
    activeFilters.accountId ||
    activeFilters.categoryId ||
    activeFilters.period !== "current-month" ||
    activeFilters.type;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filtros do Dashboard
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Recolher" : "Expandir"}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Conta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Conta</label>
              <Select
                value={activeFilters.accountId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("accountId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as contas</SelectItem>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <span>{account.icon}</span>
                        <span>{account.name}</span>
                        <span className="text-xs text-gray-500">
                          ({account.type})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Categoria */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Categoria
              </label>
              <Select
                value={activeFilters.categoryId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("categoryId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                        <span className="text-xs text-gray-500">
                          ({category.type === "income" ? "Receita" : "Despesa"})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Período
              </label>
              <Select
                value={activeFilters.period}
                onValueChange={(value) => handleFilterChange("period", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar período" />
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
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select
                value={activeFilters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span
                          className={
                            type.value === "income"
                              ? "text-green-600"
                              : type.value === "expense"
                              ? "text-red-600"
                              : ""
                          }
                        >
                          {type.value === "income"
                            ? "💰"
                            : type.value === "expense"
                            ? "💸"
                            : "📊"}
                        </span>
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Resumo dos Filtros Ativos */}
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Filtros Ativos:
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.accountId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Conta:{" "}
                    {
                      accounts.find((a) => a.id === activeFilters.accountId)
                        ?.name
                    }
                  </span>
                )}
                {activeFilters.categoryId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Categoria:{" "}
                    {
                      categories.find((c) => c.id === activeFilters.categoryId)
                        ?.name
                    }
                  </span>
                )}
                {activeFilters.period !== "current-month" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Período:{" "}
                    {
                      periods.find((p) => p.value === activeFilters.period)
                        ?.label
                    }
                  </span>
                )}
                {activeFilters.type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    Tipo:{" "}
                    {
                      transactionTypes.find(
                        (t) => t.value === activeFilters.type
                      )?.label
                    }
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
