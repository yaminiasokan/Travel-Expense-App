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

const schema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirm: z.string(),
  })
  .refine((data) => data.password === data.password_confirm, {
    message: "Passwords do not match",
    path: ["password_confirm"],
  });

type FormValues = z.infer<typeof schema>;

export default function RegisterPage() {
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
      const { user, tokens } = await authApi.register(values);
      setAuth(user, tokens.access, tokens.refresh);
      router.replace("/dashboard");
    } catch (err) {
      setServerError(extractErrorMessage(err));
    }
  };

  return (
    <AuthLayout
      eyebrow="Gate 14 · Check-in open"
      headline="Split it fair. Settle it fast."
      subhead="Equal, percentage, exact, or by shares — Waypoint works out the fewest payments to make everyone square."
    >
      <span className="eyebrow text-gold">Get started</span>
      <h1 className="font-display mt-2 text-3xl font-semibold text-white">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate-300">Free, and ready for your next trip in a minute.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            placeholder="Ada Lovelace"
            className="mt-1.5"
            error={errors.full_name?.message}
            {...register("full_name")}
          />
        </div>
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
            placeholder="At least 8 characters"
            className="mt-1.5"
            error={errors.password?.message}
            {...register("password")}
          />
        </div>
        <div>
          <Label htmlFor="password_confirm">Confirm password</Label>
          <Input
            id="password_confirm"
            type="password"
            className="mt-1.5"
            error={errors.password_confirm?.message}
            {...register("password_confirm")}
          />
        </div>

        {serverError ? <p className="text-sm text-rust">{serverError}</p> : null}

        <Button type="submit" className="w-full" size="lg" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-white underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
