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
  // Calculate data for pie chart
  const categoryData: CategoryData[] = categories
    .filter((category) => category.type === type)
    .map((category) => {
      const categoryTransactions = transactions.filter(
        (transaction) =>
          transaction.category_id === category.id && transaction.type === type
      );

      const totalAmount = categoryTransactions.reduce(
        (sum, transaction) => sum + transaction.amount,
        0
      );

      return {
        name: category.name,
        value: totalAmount,
        color: category.color,
        icon: category.icon,
      };
    })
    .filter((item) => item.value > 0)
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
