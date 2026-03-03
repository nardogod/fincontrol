"use client";

import { useState, useMemo } from "react";
import { Calendar, Filter, X } from "lucide-react";
import { useLanguage } from "@/app/contexts/LanguageContext";
import { tDashboardFilters, getCategoryDisplayName } from "@/app/lib/i18n";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
  const { language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [customMonth, setCustomMonth] = useState("");

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
    { value: "current-month", label: tDashboardFilters.periods.currentMonth[language] },
    { value: "last-month", label: tDashboardFilters.periods.lastMonth[language] },
    { value: "last-3-months", label: tDashboardFilters.periods.last3Months[language] },
    { value: "last-6-months", label: tDashboardFilters.periods.last6Months[language] },
    { value: "current-year", label: tDashboardFilters.periods.currentYear[language] },
    { value: "custom-month", label: tDashboardFilters.periods.customMonth[language] },
    { value: "all", label: tDashboardFilters.periods.all[language] },
  ];

  const transactionTypes = [
    { value: "all", label: tDashboardFilters.types.all[language] },
    { value: "income", label: tDashboardFilters.types.income[language] },
    { value: "expense", label: tDashboardFilters.types.expense[language] },
  ];

  const handleFilterChange = (key: string, value: string) => {
    if (key === "period" && value === "custom-month") {
      // Quando selecionar "Mês específico", manter o valor mas não aplicar ainda
      onFiltersChange({
        ...activeFilters,
        period: "custom-month",
      });
    } else {
      onFiltersChange({
        ...activeFilters,
        [key]: value === "all" ? null : value,
      });
    }
  };

  const handleCustomMonthChange = (monthValue: string) => {
    setCustomMonth(monthValue);
    if (monthValue) {
      // Formato: YYYY-MM
      onFiltersChange({
        ...activeFilters,
        period: `custom-month:${monthValue}`,
      });
    }
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
            {tDashboardFilters.title[language]}
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
                {tDashboardFilters.clear[language]}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? tDashboardFilters.collapse[language] : tDashboardFilters.expand[language]}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro por Conta */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{tDashboardFilters.account[language]}</label>
              <Select
                value={activeFilters.accountId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("accountId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tDashboardFilters.selectAccount[language]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tDashboardFilters.allAccounts[language]}</SelectItem>
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
                {tDashboardFilters.category[language]}
              </label>
              <Select
                value={activeFilters.categoryId || "all"}
                onValueChange={(value) =>
                  handleFilterChange("categoryId", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={tDashboardFilters.selectCategory[language]} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tDashboardFilters.allCategories[language]}</SelectItem>
                  {unifiedCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{getCategoryDisplayName(category.name, language)}</span>
                        <span className="text-xs text-gray-500">
                          ({category.type === "income" ? tDashboardFilters.income[language] : tDashboardFilters.expense[language]})
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
                {tDashboardFilters.period[language]}
              </label>
              <Select
                value={activeFilters.period && activeFilters.period.startsWith("custom-month:") 
                  ? "custom-month" 
                  : activeFilters.period}
                onValueChange={(value) => handleFilterChange("period", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tDashboardFilters.selectPeriod[language]} />
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
              {(() => {
                const isCustomMonth = activeFilters.period === "custom-month" || 
                  (activeFilters.period && activeFilters.period.startsWith("custom-month:"));
                if (!isCustomMonth) return null;
                
                const monthValue = activeFilters.period && activeFilters.period.startsWith("custom-month:") 
                  ? activeFilters.period.replace("custom-month:", "") 
                  : customMonth;
                
                return (
                  <Input
                    type="month"
                    value={monthValue}
                    onChange={(e) => handleCustomMonthChange(e.target.value)}
                    className="mt-2"
                  />
                );
              })()}
            </div>

            {/* Filtro por Tipo */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">{tDashboardFilters.type[language]}</label>
              <Select
                value={activeFilters.type || "all"}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={tDashboardFilters.selectType[language]} />
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
                {tDashboardFilters.activeFilters[language]}
              </h4>
              <div className="flex flex-wrap gap-2">
                {activeFilters.accountId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {tDashboardFilters.accountLabel[language]}{" "}
                    {
                      accounts.find((a) => a.id === activeFilters.accountId)
                        ?.name
                    }
                  </span>
                )}
                {activeFilters.categoryId && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {tDashboardFilters.categoryLabel[language]}{" "}
                    {
                      categories.find((c) => c.id === activeFilters.categoryId)
                        ?.name
                    }
                  </span>
                )}
                {activeFilters.period !== "current-month" && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {tDashboardFilters.periodLabel[language]}{" "}
                    {activeFilters.period && activeFilters.period.startsWith("custom-month:") 
                      ? new Date(activeFilters.period.replace("custom-month:", "") + "-01").toLocaleDateString(
                          language === "pt" ? "pt-BR" : language === "sv" ? "sv-SE" : "en",
                          { month: "long", year: "numeric" }
                        )
                      : periods.find((p) => p.value === activeFilters.period)?.label}
                  </span>
                )}
                {activeFilters.type && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                    {tDashboardFilters.typeLabel[language]}{" "}
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
