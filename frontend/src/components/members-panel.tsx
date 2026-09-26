"use client";

import { useState } from "react";
import { Copy, Check, ShieldCheck, UserMinus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Badge, Avatar } from "@/components/ui/card";
import { tripsApi } from "@/lib/endpoints";
import type { TripDetail } from "@/lib/types";
import { useAuthStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { notify } from "@/lib/toast";
import { extractErrorMessage } from "@/lib/api";

export function MembersPanel({ trip }: { trip: TripDetail }) {
  const [copied, setCopied] = useState(false);
  const currentUser = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();

  const isManager = trip.my_role === "owner" || trip.my_role === "admin";

  const removeMutation = useMutation({
    mutationFn: (memberId: string) => tripsApi.removeMember(trip.id, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      notify.success("Member removed");
    },
    onError: (err) => notify.error(extractErrorMessage(err)),
  });

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      tripsApi.updateMemberRole(trip.id, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", trip.id] });
      notify.success("Role updated");
    },
    onError: (err) => notify.error(extractErrorMessage(err)),
  });

  const copyCode = async () => {
    await navigator.clipboard.writeText(trip.invite_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h3 className="font-display text-lg font-semibold">Invite friends</h3>
        <p className="mt-1 text-sm text-ink-soft">Share this code so friends can join the trip.</p>
        <button
          onClick={copyCode}
          className="mt-3 flex items-center gap-2 rounded-xl border border-dashed border-line bg-paper-dim px-4 py-3 font-ledger text-lg tracking-widest"
        >
          {trip.invite_code}
          {copied ? <Check className="h-4 w-4 text-teal" /> : <Copy className="h-4 w-4 text-ink-soft" />}
        </button>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Members ({trip.members.length})</h3>
        <div className="mt-3 flex flex-col divide-y divide-line">
          {trip.members.map((m) => (
            <div key={m.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Avatar name={m.user.full_name} size={32} />
                <div>
                  <p className="text-sm font-medium">
                    {m.user.full_name}
                    {m.user.id === currentUser?.id ? " (you)" : ""}
                  </p>
                  <p className="text-xs text-ink-soft">Joined {formatDate(m.joined_at)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={m.role === "owner" ? "gold" : m.role === "admin" ? "teal" : "neutral"} className="capitalize">
                  {m.role}
                </Badge>
                {isManager && m.role !== "owner" && (
                  <>
                    {m.role === "member" ? (
                      <button
                        title="Promote to admin"
                        onClick={() => roleMutation.mutate({ memberId: m.id, role: "admin" })}
                        className="rounded-full p-1.5 text-ink-soft hover:bg-paper-dim hover:text-teal"
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </button>
                    ) : null}
                    <button
                      title="Remove member"
                      onClick={() => removeMutation.mutate(m.id)}
                      className="rounded-full p-1.5 text-ink-soft hover:bg-paper-dim hover:text-rust"
                    >
                      <UserMinus className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
