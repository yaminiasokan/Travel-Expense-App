"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Receipt, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge, Avatar } from "@/components/ui/card";
import { AddExpenseDialog } from "@/components/add-expense-dialog";
import { CategoryIcon } from "@/components/category-icon";
import { expensesApi } from "@/lib/endpoints";
import { formatDate, formatMoney } from "@/lib/format";
import { notify } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/api";
import type { TripDetail } from "@/lib/types";

export function ExpensesPanel({ trip, autoOpenAdd = false }: { trip: TripDetail; autoOpenAdd?: boolean }) {
  const [dialogOpen, setDialogOpen] = useState(autoOpenAdd);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["expenses", trip.id],
    queryFn: () => expensesApi.list(trip.id),
    refetchInterval: 8000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["balances", trip.id] });
      notify.success("Expense deleted");
    },
    onError: (err) => notify.error(extractErrorMessage(err)),
  });

  const expenses = data?.results ?? [];
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold">Expenses</h3>
          <p className="text-sm text-ink-soft">
            {expenses.length} expense{expenses.length === 1 ? "" : "s"} · {formatMoney(total, trip.currency)} total
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Add expense
        </Button>
      </div>

      {isLoading ? (
        <div className="pass h-32 animate-pulse bg-line/30" />
      ) : expenses.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10 text-center">
          <Receipt className="h-8 w-8 text-teal" />
          <p className="text-sm text-ink-soft">No expenses logged yet. Add the first one for this trip.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          <AnimatePresence initial={false}>
            {expenses.map((expense) => (
              <motion.div
                key={expense.id}
                layout
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 24, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-dim">
                        <CategoryIcon icon={expense.category?.icon} className="h-4 w-4 text-ink-soft" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{expense.title}</h4>
                          {expense.category ? <Badge tone="gold">{expense.category.name}</Badge> : null}
                          <Badge tone="neutral" className="capitalize">
                            {expense.split_type} split
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-soft">
                          {formatDate(expense.expense_date)} · Paid by {expense.paid_by.full_name}
                          {expense.location ? ` · ${expense.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-ledger text-base font-semibold">
                        {formatMoney(expense.amount, trip.currency)}
                      </span>
                      <button
                        onClick={() => deleteMutation.mutate(expense.id)}
                        className="rounded-full p-1.5 text-ink-soft transition-colors hover:bg-paper-dim hover:text-rust"
                        title="Delete expense"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="dashed-divider pt-3">
                    <div className="flex flex-wrap gap-3">
                      {expense.splits.map((split) => (
                        <div key={split.id} className="flex items-center gap-1.5 text-xs text-ink-soft">
                          <Avatar name={split.user.full_name} size={20} />
                          <span>{split.user.full_name.split(" ")[0]}</span>
                          <span className="font-ledger">{formatMoney(split.amount_owed, trip.currency)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <AddExpenseDialog open={dialogOpen} onClose={() => setDialogOpen(false)} trip={trip} />
    </div>
  );
}
