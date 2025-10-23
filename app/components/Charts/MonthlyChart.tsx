"use client";

import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getShortMonthName } from "@/app/lib/utils";
import type { TTransaction } from "@/app/lib/types";

interface MonthlyChartProps {
  transactions: TTransaction[];
}

export default function MonthlyChart({ transactions }: MonthlyChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const monthsData: { month: string; amount: number; monthIndex: number }[] =
      [];

    // Generate data for last 10 months
    for (let i = 9; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthIndex = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthStr = getShortMonthName(monthIndex);

      // Filter transactions for this month
      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.transaction_date);
        return (
          tDate.getFullYear() === year &&
          tDate.getMonth() + 1 === monthIndex &&
          t.type === "expense"
        );
      });

      const total = monthTransactions.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );

      monthsData.push({
        month: monthStr,
        amount: total,
        monthIndex,
      });
    }

    return monthsData;
  }, [transactions]);

  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
        >
          <XAxis
            dataKey="month"
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-white p-2 shadow-lg">
                    <p className="text-sm font-semibold text-slate-900">
                      {payload[0].value?.toLocaleString("sv-SE")} SEK
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="amount"
            fill="url(#colorGradient)"
            radius={[8, 8, 0, 0]}
            maxBarSize={50}
          />
          <defs>
            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
              <stop offset="100%" stopColor="#60a5fa" stopOpacity={1} />
            </linearGradient>
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
