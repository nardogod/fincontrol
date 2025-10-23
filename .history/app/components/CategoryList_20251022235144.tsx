"use client";

import { formatCurrency } from "@/app/lib/utils";
import type { TCategory } from "@/app/lib/types";

interface CategoryWithStats extends TCategory {
  amount: number;
  percentage: number;
}

interface CategoryListProps {
  categories: CategoryWithStats[];
}

export default function CategoryList({ categories }: CategoryListProps) {
  if (categories.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">
          Nenhuma categoria com gastos este mês
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.id} className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-2xl shadow-sm bg-blue-100 text-blue-600"
            style={{ backgroundColor: category.color + '20', color: category.color }}
          >
            {category.icon}
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-slate-800 truncate">
                {category.name}
              </span>
              <span className="ml-2 font-bold text-slate-800 whitespace-nowrap">
                {formatCurrency(category.amount)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all ${category.color}`}
                  style={{ width: `${category.percentage}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                {category.percentage}%
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
