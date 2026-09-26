"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Plane, Users, Wallet } from "lucide-react";
import type { Trip } from "@/lib/types";
import { formatDate, formatMoney } from "@/lib/format";

const statusColor: Record<Trip["status"], string> = {
  planning: "text-gold",
  active: "text-teal",
  completed: "text-ink-soft",
  archived: "text-rust",
};

const STUB_WIDTH = 112;

export function TripCard({ trip }: { trip: Trip }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link
        href={`/trips/${trip.id}`}
        className="pass relative grid shadow-sm transition-shadow hover:shadow-xl"
        style={{ gridTemplateColumns: `1fr ${STUB_WIDTH}px` }}
      >
        {/* Perforation notches sitting on the tear line */}
        <span
          className="absolute top-0 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper"
          style={{ right: STUB_WIDTH }}
        />
        <span
          className="absolute bottom-0 z-10 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-paper"
          style={{ right: STUB_WIDTH }}
        />

        {/* Main stub */}
        <div className="border-r-2 border-dashed border-line p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="eyebrow text-ink-soft">Boarding pass</span>
            <span className={`eyebrow ${statusColor[trip.status]}`}>{trip.status}</span>
          </div>

          <h3 className="font-display mt-2 text-xl font-semibold leading-tight">{trip.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ink-soft">
            <Plane className="h-3.5 w-3.5" />
            {trip.destination || "Destination TBD"}
          </p>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="eyebrow text-ink-soft">Depart</p>
              <p className="font-ledger text-sm font-medium">{formatDate(trip.start_date)}</p>
            </div>
            <div>
              <p className="eyebrow text-ink-soft">Return</p>
              <p className="font-ledger text-sm font-medium">{formatDate(trip.end_date)}</p>
            </div>
          </div>

          {trip.budget ? (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-ink-soft">
              <Wallet className="h-3.5 w-3.5" />
              <span className="font-ledger">{formatMoney(trip.budget, trip.currency)} budget</span>
            </div>
          ) : null}
        </div>

        {/* Stub */}
        <div className="flex flex-col items-center justify-between gap-3 bg-paper p-4">
          <div className="flex flex-col items-center gap-1 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-navy">
              <Users className="h-4 w-4 text-gold" />
            </div>
            <span className="font-ledger text-sm font-semibold">{trip.member_count}</span>
            <span className="eyebrow text-ink-soft">party</span>
          </div>
          {trip.my_role ? (
            <span className="eyebrow rounded-full bg-gold-soft px-2 py-1 text-center text-[10px] text-[#8a5f10] capitalize">
              {trip.my_role}
            </span>
          ) : (
            <span />
          )}
          <div className="barcode h-8 w-full" />
        </div>
      </Link>
    </motion.div>
  );
}
