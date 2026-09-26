"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import type { Trip } from "@/lib/types";

export function QuickExpenseFab({ trips }: { trips: Trip[] }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  if (trips.length === 0) return null;

  return (
    <>
      <motion.button
        onClick={() => setOpen(true)}
        className="fixed bottom-8 right-8 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gold text-navy shadow-lg"
        whileHover={{ scale: 1.06 }}
        whileTap={{ scale: 0.94 }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        title="Quick add expense"
      >
        <Plus className="h-6 w-6" strokeWidth={2.4} />
      </motion.button>

      <Modal open={open} onClose={() => setOpen(false)} title="Add expense to which trip?">
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {trips.map((trip) => (
              <motion.button
                key={trip.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => {
                  setOpen(false);
                  router.push(`/trips/${trip.id}?addExpense=1`);
                }}
                className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-left text-sm transition-colors hover:bg-paper-dim"
              >
                <Receipt className="h-4 w-4 text-teal" />
                <div>
                  <p className="font-medium">{trip.name}</p>
                  <p className="text-xs text-ink-soft">{trip.destination || "No destination set"}</p>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </Modal>
    </>
  );
}
