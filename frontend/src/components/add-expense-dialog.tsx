"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { expensesApi } from "@/lib/endpoints";
import { extractErrorMessage } from "@/lib/api";
import { notify } from "@/lib/toast";
import type { SplitType, TripDetail } from "@/lib/types";

const splitTypeLabels: Record<SplitType, string> = {
  equal: "Equal",
  percentage: "Percentage",
  exact: "Exact amount",
  share: "Share-based",
};

const schema = z.object({
  title: z.string().min(2, "Give the expense a title"),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be greater than zero"),
  category_id: z.string().optional(),
  paid_by_id: z.string().min(1, "Choose who paid"),
  split_type: z.enum(["equal", "percentage", "exact", "share"]),
  expense_date: z.string().min(1, "Pick a date"),
  notes: z.string().optional(),
  location: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export function AddExpenseDialog({
  open,
  onClose,
  trip,
}: {
  open: boolean;
  onClose: () => void;
  trip: TripDetail;
}) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [splitValues, setSplitValues] = useState<Record<string, string>>({});

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: expensesApi.categories,
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      split_type: "equal",
      paid_by_id: trip.members[0]?.user.id,
      expense_date: new Date().toISOString().slice(0, 10),
    },
  });

  const splitType = watch("split_type");
  const amount = watch("amount");

  useEffect(() => {
    if (open) {
      const initialSelected: Record<string, boolean> = {};
      trip.members.forEach((m) => (initialSelected[m.user.id] = true));
      setSelected(initialSelected);
      setSplitValues({});
      setServerError(null);
    }
  }, [open, trip.members]);

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([id]) => id),
    [selected]
  );

  const mutation = useMutation({
    mutationFn: expensesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["balances", trip.id] });
      notify.success("Expense added");
      reset();
      onClose();
    },
    onError: (err) => {
      const message = extractErrorMessage(err);
      setServerError(message);
      notify.error(message);
    },
  });

  const onSubmit = (values: FormValues) => {
    if (selectedIds.length === 0) {
      setServerError("Select at least one person to split this expense between.");
      return;
    }
    setServerError(null);
    mutation.mutate({
      trip: trip.id,
      title: values.title,
      amount: values.amount,
      category_id: values.category_id ? Number(values.category_id) : undefined,
      paid_by_id: values.paid_by_id,
      split_type: values.split_type,
      expense_date: values.expense_date,
      notes: values.notes,
      location: values.location,
      split_between: selectedIds.map((id) => ({
        user_id: id,
        value: values.split_type === "equal" ? undefined : splitValues[id] || "0",
      })),
    });
  };

  const needsValue = splitType !== "equal";

  return (
    <Modal open={open} onClose={onClose} title="Add an expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">Title</Label>
          <Input id="title" className="mt-1.5" placeholder="Dinner at the beach shack" error={errors.title?.message} {...register("title")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="amount">
              Amount ({trip.currency})
            </Label>
            <Input id="amount" type="number" step="0.01" className="mt-1.5 font-ledger" error={errors.amount?.message} {...register("amount")} />
          </div>
          <div>
            <Label htmlFor="expense_date">Date</Label>
            <Input id="expense_date" type="date" className="mt-1.5" error={errors.expense_date?.message} {...register("expense_date")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paid_by_id">Paid by</Label>
            <Select id="paid_by_id" className="mt-1.5" error={errors.paid_by_id?.message} {...register("paid_by_id")}>
              {trip.members.map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="category_id">Category</Label>
            <Select id="category_id" className="mt-1.5" {...register("category_id")}>
              <option value="">Uncategorized</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="location">Location (optional)</Label>
          <Input id="location" className="mt-1.5" {...register("location")} />
        </div>

        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" rows={2} className="mt-1.5" {...register("notes")} />
        </div>

        <div>
          <Label>Split type</Label>
          <Controller
            control={control}
            name="split_type"
            render={({ field }) => (
              <div className="mt-1.5 grid grid-cols-4 gap-2">
                {(Object.keys(splitTypeLabels) as SplitType[]).map((type) => (
                  <button
                    type="button"
                    key={type}
                    onClick={() => field.onChange(type)}
                    className={`rounded-xl border px-2 py-2 text-xs font-medium transition-colors ${
                      field.value === type
                        ? "border-teal bg-teal-soft text-teal"
                        : "border-line bg-white text-ink-soft hover:bg-paper-dim"
                    }`}
                  >
                    {splitTypeLabels[type]}
                  </button>
                ))}
              </div>
            )}
          />
        </div>

        <div>
          <Label>Split between</Label>
          <div className="mt-1.5 flex flex-col gap-2 rounded-xl border border-line p-3">
            {trip.members.map((m) => (
              <div key={m.user.id} className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={!!selected[m.user.id]}
                  onChange={(e) => setSelected((s) => ({ ...s, [m.user.id]: e.target.checked }))}
                  className="h-4 w-4 rounded border-line accent-teal"
                />
                <span className="flex-1 text-sm">{m.user.full_name}</span>
                {needsValue && selected[m.user.id] ? (
                  <Input
                    type="number"
                    step="0.01"
                    placeholder={splitType === "percentage" ? "%" : splitType === "share" ? "shares" : trip.currency}
                    className="w-28"
                    value={splitValues[m.user.id] || ""}
                    onChange={(e) => setSplitValues((s) => ({ ...s, [m.user.id]: e.target.value }))}
                  />
                ) : null}
              </div>
            ))}
          </div>
          {splitType === "percentage" && (
            <p className="mt-1 text-xs text-ink-soft">Percentages across selected members must add up to 100.</p>
          )}
          {splitType === "exact" && amount && (
            <p className="mt-1 text-xs text-ink-soft">Exact amounts must add up to {amount} {trip.currency}.</p>
          )}
        </div>

        {serverError ? <p className="text-sm text-rust">{serverError}</p> : null}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting || mutation.isPending}>
            Add expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}
