"use client";

import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Trip } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function UpcomingTripWidget({ trips }: { trips: Trip[] }) {
  const today = new Date();
  const upcoming = trips
    .filter((t) => t.start_date && differenceInCalendarDays(new Date(t.start_date), today) >= 0)
    .sort((a, b) => new Date(a.start_date!).getTime() - new Date(b.start_date!).getTime())[0];

  if (!upcoming) {
    return (
      <Card className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-dim">
          <CalendarClock className="h-5 w-5 text-ink-soft" />
        </div>
        <div>
          <p className="text-sm font-medium">No upcoming trips</p>
          <p className="text-xs text-ink-soft">Plan your next one to see a countdown here.</p>
        </div>
      </Card>
    );
  }

  const daysLeft = differenceInCalendarDays(new Date(upcoming.start_date!), today);

  return (
    <Link href={`/trips/${upcoming.id}`}>
      <Card className="flex items-center justify-between gap-4 transition-shadow hover:shadow-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold-soft">
            <CalendarClock className="h-5 w-5 text-[#8a5f10]" />
          </div>
          <div>
            <p className="text-sm font-medium">{upcoming.name}</p>
            <p className="text-xs text-ink-soft">Departs {formatDate(upcoming.start_date)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-ledger text-2xl font-semibold text-gold">{daysLeft === 0 ? "Today" : daysLeft}</p>
          {daysLeft > 0 ? <p className="text-xs text-ink-soft">day{daysLeft === 1 ? "" : "s"} to go</p> : null}
        </div>
      </Card>
    </Link>
  );
}
