"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, RefreshCw, ScaleIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Badge, Avatar } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { tripsApi, settlementsApi } from "@/lib/endpoints";
import { formatMoney } from "@/lib/format";
import { notify } from "@/lib/toast";
import type { Settlement, TripDetail } from "@/lib/types";
import { extractErrorMessage } from "@/lib/api";

const statusTone = {
  pending: "gold",
  partial: "teal",
  paid: "neutral",
} as const;

export function SettlementsPanel({ trip }: { trip: TripDetail }) {
  const queryClient = useQueryClient();

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ["balances", trip.id],
    queryFn: () => tripsApi.balances(trip.id),
    refetchInterval: 6000,
  });

  const { data: settlements, isLoading: settlementsLoading } = useQuery({
    queryKey: ["settlements", trip.id],
    queryFn: () => settlementsApi.list(trip.id),
    refetchInterval: 6000,
  });

  const generateMutation = useMutation({
    mutationFn: () => tripsApi.generateSettlements(trip.id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["settlements", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["balances", trip.id] });
      notify.success(data.message);
    },
    onError: (err) => notify.error(extractErrorMessage(err)),
  });

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Balances</h3>
          <Button size="sm" variant="secondary" onClick={() => generateMutation.mutate()} isLoading={generateMutation.isPending}>
            <RefreshCw className="h-3.5 w-3.5" /> Recalculate settlements
          </Button>
        </div>
        {balancesLoading ? (
          <p className="text-sm text-ink-soft">Loading balances…</p>
        ) : (
          <div className="flex flex-col divide-y divide-line">
            <AnimatePresence initial={false}>
              {balances?.map((b) => {
                const value = parseFloat(b.net_balance);
                return (
                  <motion.div
                    key={b.user.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center justify-between py-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar name={b.user.full_name} size={32} />
                      <span className="text-sm font-medium">{b.user.full_name}</span>
                    </div>
                    <motion.span
                      key={value}
                      initial={{ scale: 1.08 }}
                      animate={{ scale: 1 }}
                      className={`font-ledger text-sm font-semibold ${value >= 0 ? "text-teal" : "text-rust"}`}
                    >
                      {value >= 0 ? "gets back " : "owes "}
                      {formatMoney(Math.abs(value), trip.currency)}
                    </motion.span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-4 flex items-center gap-2">
          <ScaleIcon className="h-4 w-4 text-teal" />
          <h3 className="font-display text-lg font-semibold">Settle up</h3>
        </div>
        {settlementsLoading ? (
          <p className="text-sm text-ink-soft">Loading settlements…</p>
        ) : (settlements?.results.length ?? 0) === 0 ? (
          <p className="text-sm text-ink-soft">
            No settlements yet. Hit &ldquo;Recalculate settlements&rdquo; once expenses are in to see who should pay whom.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence initial={false}>
              {settlements!.results.map((s) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                >
                  <SettlementRow settlement={s} tripId={trip.id} currency={trip.currency} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </div>
  );
}

function SettlementRow({
  settlement,
  tripId,
  currency,
}: {
  settlement: Settlement;
  tripId: string;
  currency: string;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(settlement.remaining_amount);
  const [showPayForm, setShowPayForm] = useState(false);

  const payMutation = useMutation({
    mutationFn: () => settlementsApi.pay(settlement.id, amount),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["settlements", tripId] });
      setShowPayForm(false);
      notify.success(
        updated.status === "paid" ? "Settlement fully paid 🎉" : `Payment of ${formatMoney(amount, currency)} recorded`
      );
    },
    onError: (err) => notify.error(extractErrorMessage(err)),
  });

  return (
    <div className="rounded-xl border border-line p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Avatar name={settlement.from_user.full_name} size={28} />
          <span>{settlement.from_user.full_name}</span>
          <ArrowRight className="h-4 w-4 text-ink-soft" />
          <Avatar name={settlement.to_user.full_name} size={28} />
          <span>{settlement.to_user.full_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-ledger text-sm font-semibold">{formatMoney(settlement.amount, currency)}</span>
          <Badge tone={statusTone[settlement.status]} className="capitalize">
            {settlement.status}
          </Badge>
        </div>
      </div>

      {settlement.status !== "paid" && (
        <div className="mt-3">
          <AnimatePresence mode="wait" initial={false}>
            {showPayForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-wrap items-center gap-2 overflow-hidden"
              >
                <Input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-32 font-ledger"
                />
                <Button size="sm" onClick={() => payMutation.mutate()} isLoading={payMutation.isPending}>
                  Confirm payment
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPayForm(false)}>
                  Cancel
                </Button>
              </motion.div>
            ) : (
              <motion.div key="button" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Button size="sm" variant="secondary" onClick={() => setShowPayForm(true)}>
                  Mark payment
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
