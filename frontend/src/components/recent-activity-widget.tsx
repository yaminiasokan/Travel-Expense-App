"use client";

import { useQueries } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { tripsApi } from "@/lib/endpoints";
import { formatDateTime } from "@/lib/format";
import type { Trip } from "@/lib/types";
import { Card } from "@/components/ui/card";

export function RecentActivityWidget({ trips }: { trips: Trip[] }) {
  // Bounded to the 5 most recently updated trips to keep this to a handful
  // of requests rather than one per trip.
  const candidateTrips = [...trips]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 5);

  const results = useQueries({
    queries: candidateTrips.map((trip) => ({
      queryKey: ["activity", trip.id],
      queryFn: () => tripsApi.activity(trip.id),
      refetchInterval: 15000,
    })),
  });

  const isLoading = results.some((r) => r.isLoading);

  const items = results
    .flatMap((r, i) =>
      (r.data ?? []).map((log) => ({ ...log, tripName: candidateTrips[i].name, tripId: candidateTrips[i].id }))
    )
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Activity className="h-4 w-4 text-teal" />
        <h3 className="font-display text-lg font-semibold">Recent activity</h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-paper-dim" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-ink-soft">Nothing yet — activity shows up here as your trips get moving.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item, i) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="relative flex gap-3 text-sm"
            >
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold" />
              <div className="min-w-0">
                <p className="leading-snug text-ink">{item.description}</p>
                <p className="mt-0.5 text-xs text-ink-soft">
                  {item.tripName} · {formatDateTime(item.created_at)}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </Card>
  );
}
