import clsx from "clsx";
import { initials } from "@/lib/format";

export const Card = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={clsx("pass p-5 shadow-[0_1px_2px_rgba(18,26,43,0.04)]", className)} {...props} />
);

type BadgeTone = "teal" | "rust" | "gold" | "neutral";

const badgeTones: Record<BadgeTone, string> = {
  teal: "bg-teal-soft text-teal",
  rust: "bg-rust-soft text-rust",
  gold: "bg-gold-soft text-[#8a6414]",
  neutral: "bg-paper-dim text-ink-soft",
};

export const Badge = ({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
      badgeTones[tone],
      className
    )}
    {...props}
  />
);

export const Avatar = ({ name, size = 36 }: { name: string; size?: number }) => (
  <div
    className="flex shrink-0 items-center justify-center rounded-full bg-navy font-display text-paper"
    style={{ width: size, height: size, fontSize: size * 0.38 }}
  >
    {initials(name) || "?"}
  </div>
);
