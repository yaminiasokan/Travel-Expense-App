"use client";

import { motion } from "framer-motion";

export function ProgressRing({
  percent,
  size = 96,
  strokeWidth = 9,
  color = "var(--color-teal)",
  trackColor = "var(--color-line)",
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
}) {
  const clamped = Math.max(0, Math.min(percent, 100));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - (clamped / 100) * circumference }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        {label ? <span className="font-ledger text-sm font-semibold">{label}</span> : null}
        {sublabel ? <span className="text-[10px] text-ink-soft">{sublabel}</span> : null}
      </div>
    </div>
  );
}
