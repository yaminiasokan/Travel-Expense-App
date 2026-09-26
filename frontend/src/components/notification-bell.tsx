"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Check } from "lucide-react";
import { notificationsApi } from "@/lib/endpoints";
import { formatDateTime } from "@/lib/format";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.list,
    refetchInterval: 10000,
  });

  const markAllRead = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.results ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-8 w-8 items-center justify-center rounded-full border border-line bg-paper-dim text-ink-soft transition-colors hover:text-gold"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rust text-[9px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="pass absolute right-0 z-50 mt-2 w-80 origin-top-right p-0 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-sm font-semibold">Notifications</span>
                {unreadCount > 0 ? (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1 text-xs text-teal hover:underline"
                  >
                    <Check className="h-3 w-3" /> Mark all read
                  </button>
                ) : null}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-ink-soft">You&apos;re all caught up.</p>
                ) : (
                  notifications.slice(0, 15).map((n) => (
                    <button
                      key={n.id}
                      onClick={() => !n.is_read && markRead.mutate(n.id)}
                      className={`block w-full border-b border-line px-4 py-3 text-left text-sm transition-colors last:border-0 hover:bg-paper-dim ${
                        n.is_read ? "text-ink-soft" : "text-ink"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!n.is_read ? <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" /> : <span className="mt-1.5 h-1.5 w-1.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="leading-snug">{n.message}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">{formatDateTime(n.created_at)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
