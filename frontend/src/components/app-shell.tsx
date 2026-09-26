"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LayoutDashboard, LogOut, Plane } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { Avatar } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import { authApi } from "@/lib/endpoints";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshToken, logout } = useAuthStore();

  const handleLogout = async () => {
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore -- we clear local state regardless.
      }
    }
    logout();
    router.replace("/login");
  };

  const navItems = [{ href: "/dashboard", label: "Trips", icon: LayoutDashboard }];

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
        <aside className="hidden w-60 shrink-0 flex-col gap-8 md:flex">
          <div className="sticky top-8 flex flex-col gap-8">
            <div className="flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-navy">
                  <Plane className="h-4 w-4 -rotate-45 text-gold" strokeWidth={2.4} />
                </div>
                <span className="font-display text-lg font-semibold tracking-tight">Waypoint</span>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle compact />
            </div>

            <nav className="flex flex-col gap-1">
              {navItems.map((item) => {
                const active = pathname?.startsWith(item.href);
                return (
                  <Link key={item.href} href={item.href} className="relative">
                    {active ? (
                      <motion.div
                        layoutId="nav-active-pill"
                        className="absolute inset-0 rounded-xl bg-navy"
                        transition={{ duration: 0.2 }}
                      />
                    ) : null}
                    <span
                      className={`relative flex items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        active ? "text-gold" : "text-ink-soft hover:bg-surface"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex items-center gap-3 rounded-2xl bg-navy p-3">
              <Avatar name={user?.full_name || user?.email || "?"} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
                <p className="truncate text-xs text-white/50">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-gold"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <header className="flex items-center justify-between md:hidden">
            <Link href="/dashboard" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-navy">
                <Plane className="h-4 w-4 -rotate-45 text-gold" />
              </div>
              <span className="font-display text-lg font-semibold">Waypoint</span>
            </Link>
            <div className="flex items-center gap-2">
              <NotificationBell />
              <ThemeToggle compact />
              <button onClick={handleLogout} className="text-sm text-ink-soft">
                Log out
              </button>
            </div>
          </header>
          <main className="min-w-0 flex-1">{children}</main>
        </div>
      </div>
    </div>
  );
}
