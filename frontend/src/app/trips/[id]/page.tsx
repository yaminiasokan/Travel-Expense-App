"use client";

import { use, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { differenceInCalendarDays } from "date-fns";
import { ArrowLeft, CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { OverviewPanel } from "@/components/overview-panel";
import { ExpensesPanel } from "@/components/expenses-panel";
import { SettlementsPanel } from "@/components/settlements-panel";
import { MembersPanel } from "@/components/members-panel";
import { Badge } from "@/components/ui/card";
import { AvatarStack } from "@/components/avatar-stack";
import { tripsApi } from "@/lib/endpoints";
import { formatDate } from "@/lib/format";
import { useAuthGuard } from "@/hooks/use-auth-guard";

type Tab = "overview" | "expenses" | "settlements" | "members";

// Deterministic gradient per trip so every trip gets a distinct "cover"
// without needing real image uploads.
const GRADIENTS = [
  "linear-gradient(135deg, #12806c, #0d1117)",
  "linear-gradient(135deg, #de5138, #121a2b)",
  "linear-gradient(135deg, #eea430, #121a2b)",
  "linear-gradient(135deg, #1d2740, #12806c)",
  "linear-gradient(135deg, #5b3fae, #121a2b)",
];

function coverForTrip(id: string) {
  const hash = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return GRADIENTS[hash % GRADIENTS.length];
}

export default function TripDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready } = useAuthGuard();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>("overview");
  const [autoOpenAdd, setAutoOpenAdd] = useState(false);

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: () => tripsApi.get(id),
    enabled: ready,
  });

  useEffect(() => {
    if (searchParams.get("addExpense") === "1") {
      setTab("expenses");
      setAutoOpenAdd(true);
      router.replace(`/trips/${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  if (!ready) return null;

  const daysToGo = trip?.start_date ? differenceInCalendarDays(new Date(trip.start_date), new Date()) : null;

  return (
    <AppShell>
      <Link href="/dashboard" className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All trips
      </Link>

      {isLoading || !trip ? (
        <div className="pass h-48 animate-pulse bg-line/30" />
      ) : (
        <>
          <motion.div
            className="pass mb-6 overflow-hidden"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="h-28 w-full" style={{ background: coverForTrip(trip.id) }} />
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="font-display text-2xl font-semibold">{trip.name}</h1>
                    <Badge tone="teal" className="capitalize">
                      {trip.status}
                    </Badge>
                    {daysToGo !== null && daysToGo >= 0 ? (
                      <Badge tone="gold">{daysToGo === 0 ? "Today" : `${daysToGo}d to go`}</Badge>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-ink-soft">
                    {trip.destination ? (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" /> {trip.destination}
                      </span>
                    ) : null}
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="h-4 w-4" />
                      {formatDate(trip.start_date)} — {formatDate(trip.end_date)}
                    </span>
                  </div>
                  {trip.description ? <p className="mt-3 max-w-xl text-sm text-ink-soft">{trip.description}</p> : null}
                </div>
                <div className="flex flex-col items-end gap-2">
                  <AvatarStack members={trip.members} />
                  <span className="text-xs text-ink-soft">{trip.members.length} on this trip</span>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="mb-6 flex gap-2 border-b border-line">
            {(["overview", "expenses", "settlements", "members"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`relative -mb-px px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                  tab === t ? "text-ink" : "text-ink-soft hover:text-ink"
                }`}
              >
                {t}
                {tab === t ? (
                  <motion.div
                    layoutId="trip-tab-underline"
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-navy"
                    transition={{ duration: 0.2 }}
                  />
                ) : null}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
            >
              {tab === "overview" && <OverviewPanel trip={trip} />}
              {tab === "expenses" && <ExpensesPanel trip={trip} autoOpenAdd={autoOpenAdd} />}
              {tab === "settlements" && <SettlementsPanel trip={trip} />}
              {tab === "members" && <MembersPanel trip={trip} />}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </AppShell>
  );
}
