"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, TicketPlus, Compass, MapPin, Wallet2, Users2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { TripCard } from "@/components/trip-card";
import { CreateTripDialog } from "@/components/create-trip-dialog";
import { JoinTripDialog } from "@/components/join-trip-dialog";
import { UpcomingTripWidget } from "@/components/upcoming-trip-widget";
import { RecentActivityWidget } from "@/components/recent-activity-widget";
import { QuickExpenseFab } from "@/components/quick-expense-fab";
import { tripsApi } from "@/lib/endpoints";
import { useAuthStore } from "@/lib/store";
import { useAuthGuard } from "@/hooks/use-auth-guard";

export default function DashboardPage() {
  const { ready } = useAuthGuard();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["trips"],
    queryFn: () => tripsApi.list(),
    enabled: ready,
  });

  if (!ready) return null;

  const trips = data?.results ?? [];
  const activeTrips = trips.filter((t) => t.status === "active" || t.status === "planning").length;
  const destinations = new Set(trips.map((t) => t.destination).filter(Boolean)).size;

  const stats = [
    { label: "Trips planned", value: trips.length, icon: Compass },
    { label: "In progress", value: activeTrips, icon: Wallet2 },
    { label: "Destinations", value: destinations, icon: MapPin },
  ];

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* Hero band */}
        <div className="relative overflow-hidden rounded-2xl bg-navy p-7 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="eyebrow text-gold">Welcome back</span>
              <h1 className="font-display mt-2 text-3xl font-semibold">
                {user?.full_name?.split(" ")[0] ?? "Traveler"}&apos;s trips
              </h1>
              <p className="mt-1.5 max-w-md text-sm text-white/60">
                Everything you&apos;re planning, going on, or just got back from.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="border-white/15 bg-white/10 text-white hover:bg-white/20" onClick={() => setJoinOpen(true)}>
                <TicketPlus className="h-4 w-4" /> Join with code
              </Button>
              <Button className="bg-gold text-navy hover:bg-gold/90" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" /> New trip
              </Button>
            </div>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                  <stat.icon className="h-4 w-4 text-gold" />
                </div>
                <div>
                  <p className="font-ledger text-lg font-semibold">{stat.value}</p>
                  <p className="text-xs text-white/50">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {trips.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.4fr]">
            <UpcomingTripWidget trips={trips} />
            <RecentActivityWidget trips={trips} />
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="pass h-56 animate-pulse bg-line/30" />
            ))}
          </div>
        ) : trips.length === 0 ? (
          <div className="pass flex flex-col items-center gap-3 p-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold-soft">
              <Users2 className="h-6 w-6 text-[#8a5f10]" />
            </div>
            <h2 className="font-display text-lg font-semibold">No trips booked yet</h2>
            <p className="max-w-sm text-sm text-ink-soft">
              Start planning your next group trip, or join one a friend already created.
            </p>
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" onClick={() => setJoinOpen(true)}>
                Join with code
              </Button>
              <Button onClick={() => setCreateOpen(true)}>Create your first trip</Button>
            </div>
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          >
            {trips.map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </motion.div>
        )}
      </div>

      <CreateTripDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <JoinTripDialog open={joinOpen} onClose={() => setJoinOpen(false)} />
      <QuickExpenseFab trips={trips} />
    </AppShell>
  );
}
