"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Expense } from "@/lib/types";
import { formatMoney } from "@/lib/format";

const COLORS = ["#2f6f63", "#d9a441", "#c1502e", "#4b5261", "#7a9e94", "#e0b96b", "#d98868", "#8a92a3"];

export function CategoryPieChart({ expenses, currency }: { expenses: Expense[]; currency: string }) {
  const totals = new Map<string, number>();
  for (const expense of expenses) {
    const key = expense.category?.name ?? "Uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + parseFloat(expense.amount));
  }
  const data = Array.from(totals.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return <p className="text-sm text-ink-soft">Add expenses to see the category breakdown.</p>;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div className="h-56 w-56 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={COLORS[index % COLORS.length]} stroke="#faf7f0" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatMoney(Number(value), currency)}
              contentStyle={{ borderRadius: 12, border: "1px solid #e4ddc9", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-1 flex-col gap-2">
        {data.map((entry, index) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ background: COLORS[index % COLORS.length] }}
              />
              <span>{entry.name}</span>
            </div>
            <span className="font-ledger text-ink-soft">{formatMoney(entry.value, currency)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
