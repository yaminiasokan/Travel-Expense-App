"use client";

import { motion } from "framer-motion";
import { formatMoney } from "@/lib/format";

export function BudgetProgress({
  spent,
  budget,
  currency,
}: {
  spent: number;
  budget: number;
  currency: string;
}) {
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
  const over = spent > budget;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-ink-soft">
          {formatMoney(spent, currency)} of {formatMoney(budget, currency)} spent
        </span>
        <span className={`font-ledger font-semibold ${over ? "text-rust" : "text-teal"}`}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-paper-dim">
        <motion.div
          className={`h-full rounded-full ${over ? "bg-rust" : "bg-teal"}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      {over ? <p className="mt-1.5 text-xs text-rust">Over budget by {formatMoney(spent - budget, currency)}</p> : null}
    </div>
  );
}
