"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { AuthLayout } from "@/components/auth-layout";
import { authApi } from "@/lib/endpoints";
import { extractErrorMessage } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { useGuestGuard } from "@/hooks/use-auth-guard";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  useGuestGuard();
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setServerError(null);
    try {
      const { user, tokens } = await authApi.login(values);
      setAuth(user, tokens.access, tokens.refresh);
      router.replace("/dashboard");
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      eyebrow="Gate 14 · Now boarding"
      headline="Every trip, one honest ledger."
      subhead="Log expenses as they happen and let Waypoint work out who owes whom — down to the last cent."
    >
      <span className="eyebrow text-gold">Welcome back</span>
      <h1 className="font-display mt-2 text-3xl font-semibold text-white">Log in</h1>
      <p className="mt-1.5 text-sm text-slate-300">Pick up right where your trip left off.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            className="mt-1.5"
            error={errors.email?.message}
            {...register("email")}
          />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            className="mt-1.5"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>

        {serverError ? <p className="text-sm text-rust">{serverError}</p> : null}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-300">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold text-white underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
