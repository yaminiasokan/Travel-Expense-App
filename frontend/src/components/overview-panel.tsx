"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { PieChart as PieIcon, TrendingUp, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { CategoryPieChart } from "@/components/charts/category-pie-chart";
import { SpendingTrendChart } from "@/components/charts/spending-trend-chart";
import { ProgressRing } from "@/components/ui/progress-ring";
import { expensesApi, tripsApi } from "@/lib/endpoints";
import { formatMoney } from "@/lib/format";
import type { TripDetail } from "@/lib/types";

export function OverviewPanel({ trip }: { trip: TripDetail }) {
  const { data: expensesData } = useQuery({
    queryKey: ["expenses", trip.id],
    queryFn: () => expensesApi.list(trip.id),
    refetchInterval: 8000,
  });

  const { data: balances } = useQuery({
    queryKey: ["balances", trip.id],
    queryFn: () => tripsApi.balances(trip.id),
    refetchInterval: 8000,
  });

  const expenses = expensesData?.results ?? [];
  const totalSpent = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const owedToYou = balances?.filter((b) => parseFloat(b.net_balance) > 0).length ?? 0;

  const stats = [
    { label: "Total spent", value: formatMoney(totalSpent, trip.currency), icon: Wallet, tone: "text-navy" },
    { label: "Expenses logged", value: String(expenses.length), icon: TrendingUp, tone: "text-teal" },
    { label: "Members owed money", value: String(owedToYou), icon: PieIcon, tone: "text-gold" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <motion.div
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          >
            <Card className="flex items-center gap-3">
              <div className="rounded-full bg-paper-dim p-2.5">
                <stat.icon className={`h-5 w-5 ${stat.tone}`} />
              </div>
              <div>
                <p className="font-ledger text-lg font-semibold">{stat.value}</p>
                <p className="text-xs text-ink-soft">{stat.label}</p>
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {trip.budget ? (
        <Card>
          <h3 className="font-display text-lg font-semibold">Budget</h3>
          <div className="mt-4 flex items-center gap-6">
            {(() => {
              const budget = parseFloat(trip.budget);
              const pct = budget > 0 ? Math.min((totalSpent / budget) * 100, 100) : 0;
              const over = totalSpent > budget;
              return (
                <>
                  <ProgressRing
                    percent={pct}
                    color={over ? "var(--color-rust)" : "var(--color-teal)"}
                    label={`${pct.toFixed(0)}%`}
                    sublabel="used"
                  />
                  <div className="text-sm">
                    <p className="text-ink-soft">
                      <span className="font-ledger font-semibold text-ink">{formatMoney(totalSpent, trip.currency)}</span> of{" "}
                      {formatMoney(budget, trip.currency)} spent
                    </p>
                    {over ? (
                      <p className="mt-1 text-rust">Over budget by {formatMoney(totalSpent - budget, trip.currency)}</p>
                    ) : (
                      <p className="mt-1 text-teal">{formatMoney(budget - totalSpent, trip.currency)} remaining</p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
      ) : null}

      <Card>
        <h3 className="font-display text-lg font-semibold">Spending by category</h3>
        <div className="mt-4">
          <CategoryPieChart expenses={expenses} currency={trip.currency} />
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Spending over time</h3>
        <div className="mt-4">
          <SpendingTrendChart expenses={expenses} currency={trip.currency} />
        </div>
      </Card>
    </div>
  );
}
