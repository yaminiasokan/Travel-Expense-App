"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export function useAuthGuard() {
  const router = useRouter();
  const { user, accessToken, hydrated, hydrate } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!hydrated) {
      hydrate();
      return;
    }
    if (!accessToken || !user) {
      router.replace("/login");
    } else {
      setChecked(true);
    }
  }, [hydrated, accessToken, user, hydrate, router]);

  return { user, ready: checked };
}

export function useGuestGuard() {
  const router = useRouter();
  const { user, accessToken, hydrated, hydrate } = useAuthStore();

  useEffect(() => {
    if (!hydrated) {
      hydrate();
      return;
    }
    if (accessToken && user) {
      router.replace("/dashboard");
    }
  }, [hydrated, accessToken, user, hydrate, router]);
}
