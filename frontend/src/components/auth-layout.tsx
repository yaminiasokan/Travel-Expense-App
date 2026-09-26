"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plane, ShieldCheck, Sparkles } from "lucide-react";

const ROUTE_STOPS = [
  { x: 40, y: 210 },
  { x: 150, y: 120 },
  { x: 250, y: 170 },
  { x: 340, y: 70 },
];

export function AuthLayout({
  eyebrow,
  headline,
  subhead,
  children,
}: {
  eyebrow: string;
  headline: string;
  subhead: string;
  children: React.ReactNode;
}) {
  const pathD = ROUTE_STOPS.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(238,164,48,0.16),_transparent_28%),linear-gradient(180deg,#f5f6f4_0%,#eef3f7_100%)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl overflow-hidden rounded-[32px] border border-line/80 bg-surface shadow-[0_30px_80px_rgba(18,26,43,0.12)] lg:grid-cols-[1.08fr_0.92fr]">
        <div className="relative flex flex-col justify-between overflow-hidden bg-navy px-6 py-8 text-white sm:px-8 lg:px-12 lg:py-10">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
              backgroundSize: "22px 22px",
            }}
          />

          <div className="relative z-10 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Plane className="h-4 w-4 -rotate-45 text-gold" strokeWidth={2.4} />
              </div>
              <span className="font-display text-lg font-semibold tracking-tight">Waypoint</span>
            </Link>

            <div className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/75">
              Travel ledger
            </div>
          </div>

          <div className="relative z-10 mt-10 lg:mt-0">
            <span className="eyebrow text-gold">{eyebrow}</span>
            <h1 className="font-display mt-4 max-w-md text-3xl font-semibold leading-[1.05] sm:text-4xl lg:text-[3rem]">
              {headline}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/70 sm:text-base">{subhead}</p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/80">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <ShieldCheck className="h-4 w-4 text-gold" />
                Secure check-ins
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
                <Sparkles className="h-4 w-4 text-gold" />
                Smart splits
              </div>
            </div>
          </div>

          <div className="relative z-10 mt-8 h-[180px] w-full max-w-md sm:h-[220px]">
            <svg viewBox="0 0 380 260" className="h-full w-full" fill="none">
              <path
                d={pathD}
                stroke="rgba(255,255,255,0.18)"
                strokeWidth={2}
                strokeDasharray="1 8"
                strokeLinecap="round"
              />
              {ROUTE_STOPS.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={i === ROUTE_STOPS.length - 1 ? 5 : 3.5}
                  fill={i === ROUTE_STOPS.length - 1 ? "#eea430" : "rgba(255,255,255,0.35)"}
                />
              ))}
              <motion.g
                initial={false}
                animate={{
                  x: ROUTE_STOPS.map((p) => p.x),
                  y: ROUTE_STOPS.map((p) => p.y),
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", repeatType: "reverse" }}
              >
                <circle r={4} fill="#eea430" />
                <path d="M -7,-2 L 6,0 L -7,2 L -3,0 Z" fill="#eea430" />
              </motion.g>
            </svg>
          </div>
        </div>

        <div className="flex items-center justify-center bg-[#0f172a] px-4 py-8 sm:px-6 lg:px-8">
          <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-navy-soft/95 p-5 shadow-[0_22px_52px_rgba(2,6,23,0.42)] backdrop-blur-sm sm:p-7 lg:p-8">
            {children}
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-gold/20 bg-gold-soft/10 px-3 py-2 text-sm text-white/80">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/8 text-gold">
                <ArrowRight className="h-4 w-4" />
              </div>
              Keep every trip balanced, from the first hotel to the final round of drinks.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
