import { Avatar } from "@/components/ui/card";
import type { TripMember } from "@/lib/types";

export function AvatarStack({ members, max = 5 }: { members: TripMember[]; max?: number }) {
  const shown = members.slice(0, max);
  const overflow = members.length - shown.length;

  return (
    <div className="flex items-center">
      {shown.map((m, i) => (
        <div key={m.id} className="rounded-full ring-2 ring-surface" style={{ marginLeft: i === 0 ? 0 : -10 }}>
          <Avatar name={m.user.full_name} size={30} />
        </div>
      ))}
      {overflow > 0 ? (
        <div
          className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-paper-dim text-[11px] font-medium text-ink-soft ring-2 ring-surface"
          style={{ marginLeft: -10 }}
        >
          +{overflow}
        </div>
      ) : null}
    </div>
  );
}
