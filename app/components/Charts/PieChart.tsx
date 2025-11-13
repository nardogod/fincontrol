"use client";

import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { TCategory } from "@/app/lib/types";

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon: string;
}

interface PieChartProps {
  categories: TCategory[];
  transactions: Array<{
    category_id: string;
    amount: number;
    type: "income" | "expense";
  }>;
  type: "income" | "expense";
  title: string;
}

export default function PieChart({
  categories,
  transactions,
  type,
  title,
}: PieChartProps) {
  // Paleta de cores única para evitar repetições (expandida)
  const colorPalette = [
    "#3B82F6", // Blue
    "#10B981", // Green
    "#F59E0B", // Amber
    "#EF4444", // Red
    "#8B5CF6", // Purple
    "#06B6D4", // Cyan
    "#EC4899", // Pink
    "#84CC16", // Lime
    "#F97316", // Orange
    "#6366F1", // Indigo
    "#14B8A6", // Teal
      "#A855F7", // Violet
      "#EAB308", // Yellow
      "#DC2626", // Red-600
      "#7C3AED", // Violet-600
      "#22C55E", // Green-500
      "#F43F5E", // Rose-500
      "#0EA5E9", // Sky-500
      "#9333EA", // Purple-600
    "#FB923C", // Orange-400
    "#60A5FA", // Blue-400
    "#34D399", // Emerald-400
    "#FBBF24", // Amber-400
    "#FB7185", // Rose-400
    "#818CF8", // Indigo-400
    "#4ADE80", // Green-400
    "#38BDF8", // Sky-400
    "#A78BFA", // Violet-400
    "#FCD34D", // Yellow-300
    "#F87171", // Red-400
    "#2DD4BF", // Teal-400
    "#C084FC", // Purple-400
  ];

  // Função para normalizar nome da categoria (unificar duplicatas)
  const normalizeName = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ");
  };

  // Agrupar categorias por nome normalizado (unificar duplicatas)
  const categoryMap = new Map<string, CategoryData>();

  categories
    .filter((category) => category.type === type)
    .forEach((category) => {
      const categoryTransactions = transactions.filter(
        (transaction) =>
          transaction.category_id === category.id && transaction.type === type
      );

      const totalAmount = categoryTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      if (totalAmount > 0) {
        const normalizedName = normalizeName(category.name);

        if (categoryMap.has(normalizedName)) {
          // Unificar: somar valores e manter dados da primeira ocorrência
          const existing = categoryMap.get(normalizedName)!;
          existing.value += totalAmount;
        } else {
          // Primeira ocorrência desta categoria
          categoryMap.set(normalizedName, {
            name: category.name, // Manter nome original (primeira ocorrência)
            value: totalAmount,
            color: category.color,
            icon: category.icon,
          });
        }
      }
    });

  // Converter para array e atribuir cores únicas
  const categoryData: CategoryData[] = Array.from(categoryMap.values())
    .map((item, index) => ({
      ...item,
      // Usar cor da categoria se disponível, senão usar cor da paleta
      color: item.color || colorPalette[index % colorPalette.length],
    }))
    .sort((a, b) => b.value - a.value);

  const total = categoryData.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);

      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{data.icon}</span>
            <span className="font-semibold text-slate-900">{data.name}</span>
          </div>
          <div className="text-sm text-slate-600">
            <div>
              Valor:{" "}
              {new Intl.NumberFormat("sv-SE", {
                style: "currency",
                currency: "SEK",
              }).format(data.value)}
            </div>
            <div>Percentual: {percentage}%</div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap gap-2 justify-center mt-4">
        {payload?.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-slate-700">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  };

  if (categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-slate-500">
            Nenhum {type === "income" ? "ganho" : "gasto"} encontrado para este
            período
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">{title}</h3>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {categoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </RechartsPieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-slate-600">
          Total:{" "}
          {new Intl.NumberFormat("sv-SE", {
            style: "currency",
            currency: "SEK",
          }).format(total)}
        </p>
      </div>
    </div>
  );
}
