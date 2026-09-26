"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { hydrated, hydrate, accessToken } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
      return;
    }
    router.replace(accessToken ? "/dashboard" : "/login");
  }, [hydrated, hydrate, accessToken, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-navy border-t-transparent" />
    </div>
  );
}
