"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { tripsApi } from "@/lib/endpoints";
import { extractErrorMessage } from "@/lib/api";
import { notify } from "@/lib/toast";
import { useState } from "react";

const schema = z.object({
  name: z.string().min(2, "Give your trip a name"),
  destination: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  budget: z.string().optional(),
  currency: z.string().min(3).max(3),
});

type FormValues = z.infer<typeof schema>;

const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "SGD"];

export function CreateTripDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { currency: "INR" },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      tripsApi.create({
        ...values,
        budget: values.budget ? values.budget : undefined,
        start_date: values.start_date || undefined,
        end_date: values.end_date || undefined,
      }),
    onSuccess: (trip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      notify.success(`"${trip.name}" created`);
      reset();
      onClose();
      router.push(`/trips/${trip.id}`);
    },
    onError: (err) => {
      const message = extractErrorMessage(err);
      setServerError(message);
      notify.error(message);
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="Plan a new trip">
      <form
        onSubmit={handleSubmit((values) => {
          setServerError(null);
          mutation.mutate(values);
        })}
        className="space-y-4"
      >
        <div>
          <Label htmlFor="name">Trip name</Label>
          <Input id="name" className="mt-1.5" placeholder="Goa with the crew" error={errors.name?.message} {...register("name")} />
        </div>
        <div>
          <Label htmlFor="destination">Destination</Label>
          <Input id="destination" className="mt-1.5" placeholder="Goa, India" {...register("destination")} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start_date">Start date</Label>
            <Input id="start_date" type="date" className="mt-1.5" {...register("start_date")} />
          </div>
          <div>
            <Label htmlFor="end_date">End date</Label>
            <Input id="end_date" type="date" className="mt-1.5" {...register("end_date")} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="budget">Budget (optional)</Label>
            <Input id="budget" type="number" step="0.01" className="mt-1.5" placeholder="50000" {...register("budget")} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select id="currency" className="mt-1.5" {...register("currency")}>
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" className="mt-1.5" rows={3} placeholder="What's this trip about?" {...register("description")} />
        </div>

        {serverError ? <p className="text-sm text-rust">{serverError}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            Create trip
          </Button>
        </div>
      </form>
    </Modal>
  );
}
