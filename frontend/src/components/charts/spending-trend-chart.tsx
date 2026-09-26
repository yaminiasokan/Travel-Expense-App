"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Expense } from "@/lib/types";
import { formatMoney } from "@/lib/format";

export function SpendingTrendChart({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    totals.set(expense.expense_date, (totals.get(expense.expense_date) ?? 0) + parseFloat(expense.amount));
  }
  const data = Array.from(totals.entries())
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    }));

  if (data.length === 0) {
    return <p className="text-sm text-ink-soft">Spending over time will show up here once you log expenses.</p>;
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#4b5261" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#4b5261" }} axisLine={false} tickLine={false} width={40} />
          <Tooltip
            formatter={(value) => formatMoney(Number(value), currency)}
            contentStyle={{ borderRadius: 12, border: "1px solid #e4ddc9", fontSize: 12 }}
            cursor={{ fill: "#f1ecdf" }}
          />
          <Bar dataKey="amount" fill="#2f6f63" radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
